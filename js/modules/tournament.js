/**
 * Putting Tournament — Double Elimination Bracket Engine
 *
 * Pure logic, no DOM. Kept separate from app.js so the bracket maths can be
 * reasoned about (and tested) on its own.
 *
 * Structure
 * ---------
 * Participants are randomly drawn, then padded with byes to the next power of
 * two. Standard seed ordering is used to place entrants, which spreads the byes
 * across the bracket instead of clustering them.
 *
 * Winners bracket (WB): R = log2(size) rounds.
 * Losers bracket (LB): 2R-2 rounds, alternating
 *   - seed  : pairs the WB round-1 losers against each other
 *   - major : LB survivors vs the players dropping out of WB round r
 *   - minor : LB survivors vs each other (halves the field)
 * Grand final: WB champion vs LB champion.
 *   - If `grandFinalReset` is on and the LB champion wins, a reset match is
 *     played (the WB champion has only lost once, so they get a second chance —
 *     true double elimination).
 *   - If it's off, the grand final is a single winner-takes-all match.
 *
 * Byes propagate: a match containing a BYE resolves automatically, and its
 * "loser" is itself a BYE which drops into the losers bracket and cascades.
 */

export const BYE = 'BYE';

/** Fisher–Yates shuffle (non-mutating). */
export function shuffle(arr, rng = Math.random) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function nextPowerOfTwo(n) {
    let p = 1;
    while (p < n) p *= 2;
    return Math.max(2, p);
}

/**
 * Classic bracket seed order, e.g. size 8 -> [1,8,4,5,2,7,3,6].
 * Ensures the top seed meets the bottom seed, which is what pushes byes apart.
 */
export function seedOrder(size) {
    let seeds = [1, 2];
    while (seeds.length < size) {
        const sum = seeds.length * 2 + 1;
        const next = [];
        for (const s of seeds) {
            next.push(s);
            next.push(sum - s);
        }
        seeds = next;
    }
    return seeds;
}

function makeMatch(id, bracket, round, idx) {
    return {
        id,
        bracket,          // 'W' | 'L' | 'GF' | 'GF2'
        round,
        idx,
        slots: [null, null],   // participantId | BYE | null (undecided)
        winner: null,
        loser: null,
        scores: {},       // { [participantId]: { makes, attempts } }
        winTo: null,      // { matchId, slot }
        loseTo: null,     // { matchId, slot } | null
        status: 'pending' // 'pending' | 'ready' | 'done'
    };
}

/**
 * Build a full double-elimination tournament.
 * @param {Array<{id:string,name:string,photoURL?:string}>} participants
 * @param {Object} opts { targetMakes, distance, grandFinalReset, rng }
 */
export function createTournament(participants, opts = {}) {
    const {
        targetMakes = 15,
        distance = 20,
        grandFinalReset = true,
        rng = Math.random
    } = opts;

    if (!Array.isArray(participants) || participants.length < 2) {
        throw new Error('A tournament needs at least 2 participants');
    }

    const drawn = shuffle(participants, rng);
    const size = nextPowerOfTwo(drawn.length);
    const rounds = Math.round(Math.log2(size));

    // Entrant list padded with byes, then arranged by seed order.
    const entrants = [...drawn.map(p => p.id), ...Array(size - drawn.length).fill(BYE)];
    const order = seedOrder(size);
    const placed = order.map(seed => entrants[seed - 1]);

    const matches = {};
    const wb = [];   // wb[r-1] = array of match ids
    const lb = [];   // lb[i]   = array of match ids

    // ---- Winners bracket ----
    for (let r = 1; r <= rounds; r++) {
        const count = size / Math.pow(2, r);
        const ids = [];
        for (let i = 0; i < count; i++) {
            const id = `W${r}-${i}`;
            matches[id] = makeMatch(id, 'W', r, i);
            ids.push(id);
        }
        wb.push(ids);
    }
    // Seat round-1 players
    for (let i = 0; i < size / 2; i++) {
        matches[wb[0][i]].slots = [placed[i * 2], placed[i * 2 + 1]];
    }
    // Link WB winners forward
    for (let r = 1; r < rounds; r++) {
        wb[r - 1].forEach((id, i) => {
            matches[id].winTo = { matchId: wb[r][Math.floor(i / 2)], slot: i % 2 };
        });
    }

    // ---- Losers bracket round plan ----
    const plan = [{ type: 'seed', count: size / 4, wbRound: 1 }];
    for (let r = 2; r <= rounds; r++) {
        plan.push({ type: 'major', count: size / Math.pow(2, r), wbRound: r });
        if (r < rounds) {
            plan.push({ type: 'minor', count: size / Math.pow(2, r + 1) });
        }
    }
    // size === 2 (two players) has no losers bracket rounds at all.
    const lbPlan = plan.filter(p => p.count >= 1);

    lbPlan.forEach((spec, li) => {
        const ids = [];
        for (let i = 0; i < spec.count; i++) {
            const id = `L${li + 1}-${i}`;
            matches[id] = makeMatch(id, 'L', li + 1, i);
            ids.push(id);
        }
        lb.push(ids);
    });

    // ---- Wire the losers bracket ----
    lbPlan.forEach((spec, li) => {
        const ids = lb[li];

        if (spec.type === 'seed') {
            // WB round-1 losers pair up.
            ids.forEach((id, i) => {
                matches[wb[0][i * 2]].loseTo = { matchId: id, slot: 0 };
                matches[wb[0][i * 2 + 1]].loseTo = { matchId: id, slot: 1 };
            });
        } else if (spec.type === 'major') {
            // LB survivors (slot 0) meet the players dropping from WB round r (slot 1).
            const prev = lb[li - 1];
            const drops = wb[spec.wbRound - 1];
            ids.forEach((id, i) => {
                matches[prev[i]].winTo = { matchId: id, slot: 0 };
                // Reverse the drop order: keeps players who just met from meeting again.
                const dropIdx = drops.length - 1 - i;
                matches[drops[dropIdx]].loseTo = { matchId: id, slot: 1 };
            });
        } else { // minor
            const prev = lb[li - 1];
            ids.forEach((id, i) => {
                matches[prev[i * 2]].winTo = { matchId: id, slot: 0 };
                matches[prev[i * 2 + 1]].winTo = { matchId: id, slot: 1 };
            });
        }
    });

    // ---- Grand final ----
    const gf = makeMatch('GF', 'GF', 1, 0);
    matches['GF'] = gf;
    // WB champion
    matches[wb[rounds - 1][0]].winTo = { matchId: 'GF', slot: 0 };
    if (lb.length > 0) {
        // LB champion
        const lastLb = lb[lb.length - 1][0];
        matches[lastLb].winTo = { matchId: 'GF', slot: 1 };
    } else {
        // 2-player tournament: WB final loser goes straight to the grand final.
        matches[wb[rounds - 1][0]].loseTo = { matchId: 'GF', slot: 1 };
    }

    const state = {
        participants: drawn,
        participantsById: Object.fromEntries(drawn.map(p => [p.id, p])),
        size,
        rounds,
        matches,
        wb,
        lb,
        order: [...wb.flat(), ...lb.flat(), 'GF'],
        targetMakes,
        distance,
        grandFinalReset,
        champion: null,
        runnerUp: null,
        eliminated: [],       // participant ids, in elimination order (earliest out first)
        startTime: Date.now()
    };

    refresh(state);
    return state;
}

/** A slot is "settled" when it holds a participant or a BYE (not undecided). */
function settled(v) {
    return v !== null && v !== undefined;
}

/** Update match statuses and auto-resolve any match decided by byes. */
export function refresh(state) {
    let changed = true;
    while (changed) {
        changed = false;

        for (const id of Object.keys(state.matches)) {
            const m = state.matches[id];
            if (m.status === 'done') continue;

            const [a, b] = m.slots;
            if (!settled(a) || !settled(b)) {
                m.status = 'pending';
                continue;
            }

            // Both known — is it decided by a bye?
            if (a === BYE && b === BYE) {
                applyResult(state, id, BYE, null, true);
                changed = true;
            } else if (a === BYE) {
                applyResult(state, id, b, BYE, true);
                changed = true;
            } else if (b === BYE) {
                applyResult(state, id, a, BYE, true);
                changed = true;
            } else {
                m.status = 'ready';
            }
        }
    }
    return state;
}

/** Push a resolved match's winner/loser into the slots they feed. */
function propagate(state, m) {
    if (m.winTo) {
        const target = state.matches[m.winTo.matchId];
        if (target) target.slots[m.winTo.slot] = m.winner;
    }
    if (m.loseTo) {
        const target = state.matches[m.loseTo.matchId];
        if (target) target.slots[m.loseTo.slot] = m.loser;
    }
}

function applyResult(state, matchId, winnerId, loserId, isBye) {
    const m = state.matches[matchId];
    m.winner = winnerId;
    m.loser = loserId;
    m.status = 'done';
    m.byeResolved = !!isBye;

    // A real player losing in the losers bracket (or the grand final) is out.
    if (loserId && loserId !== BYE) {
        const isLosersSide = m.bracket === 'L' || m.bracket === 'GF' || m.bracket === 'GF2';
        if (isLosersSide && !state.eliminated.includes(loserId)) {
            state.eliminated.push(loserId);
        }
    }

    propagate(state, m);

    // Grand final resolution
    if (m.bracket === 'GF') {
        const wbChamp = m.slots[0];
        const lbChamp = m.slots[1];
        if (winnerId === wbChamp || lbChamp === BYE || winnerId === BYE) {
            state.champion = winnerId;
            state.runnerUp = loserId && loserId !== BYE ? loserId : null;
        } else if (state.grandFinalReset) {
            // LB champion won: WB champion has now lost once — play the reset.
            if (!state.matches['GF2']) {
                const gf2 = makeMatch('GF2', 'GF2', 2, 0);
                gf2.slots = [wbChamp, lbChamp];
                gf2.status = 'ready';
                state.matches['GF2'] = gf2;
                state.order.push('GF2');
            }
        } else {
            state.champion = winnerId;
            state.runnerUp = loserId;
        }
    } else if (m.bracket === 'GF2') {
        state.champion = winnerId;
        state.runnerUp = loserId;
    }
    return m;
}

/**
 * Record the result of a real (non-bye) match.
 * @param {Object} scores { [participantId]: { makes, attempts } }
 */
export function recordMatchResult(state, matchId, winnerId, scores = {}) {
    const m = state.matches[matchId];
    if (!m) throw new Error(`Unknown match ${matchId}`);
    if (m.status === 'done') throw new Error(`Match ${matchId} already decided`);
    if (!m.slots.includes(winnerId)) throw new Error(`${winnerId} is not in match ${matchId}`);

    const loserId = m.slots[0] === winnerId ? m.slots[1] : m.slots[0];
    m.scores = scores;
    applyResult(state, matchId, winnerId, loserId, false);
    refresh(state);
    return state;
}

/** Matches that can be played right now, in bracket order. */
export function readyMatches(state) {
    return state.order
        .map(id => state.matches[id])
        .filter(m => m && m.status === 'ready');
}

/** The next match to play (or null). */
export function nextMatch(state) {
    return readyMatches(state)[0] || null;
}

export function isComplete(state) {
    return !!state.champion && state.champion !== BYE;
}

/**
 * Aggregate per-participant totals across every match they played.
 * Placement: 1st champion, 2nd runner-up, then reverse elimination order.
 */
export function standings(state) {
    const totals = {};
    for (const p of state.participants) {
        totals[p.id] = { id: p.id, name: p.name, makes: 0, attempts: 0, wins: 0, losses: 0, matches: 0 };
    }
    for (const id of Object.keys(state.matches)) {
        const m = state.matches[id];
        if (m.status !== 'done' || m.byeResolved) continue;
        for (const pid of m.slots) {
            if (pid === BYE || !totals[pid]) continue;
            const s = m.scores[pid];
            if (s) {
                totals[pid].makes += s.makes || 0;
                totals[pid].attempts += s.attempts || 0;
            }
            totals[pid].matches++;
            if (m.winner === pid) totals[pid].wins++;
            else totals[pid].losses++;
        }
    }

    // Placement order: champion, runner-up, then most-recently eliminated first.
    const placedIds = [];
    if (state.champion && state.champion !== BYE) placedIds.push(state.champion);
    if (state.runnerUp && state.runnerUp !== BYE) placedIds.push(state.runnerUp);
    const rest = [...state.eliminated].reverse().filter(id => !placedIds.includes(id));
    placedIds.push(...rest);
    for (const p of state.participants) {
        if (!placedIds.includes(p.id)) placedIds.push(p.id);
    }

    return placedIds.map((id, i) => ({
        ...totals[id],
        placement: i + 1,
        percentage: totals[id].attempts > 0 ? (totals[id].makes / totals[id].attempts) * 100 : 0
    }));
}
