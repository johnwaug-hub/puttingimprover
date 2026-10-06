## v10.5.56
- **Hotfix:** the host could get stuck on their own "Waiting for the host to draw the bracket…" screen after drawing. `handleTournamentDraw()` only set host/guest tracking (`tournamentLiveHostId`, `isLiveTournamentGuest`) inside the async live-session creation call, which runs after the local bracket is already drawn and rendered — so if this device had *any* leftover guest state from previously viewing someone else's live tournament (e.g. an old test session), it would render as "waiting for host" even on the device that just hit "Draw Bracket & Start," and Refresh couldn't fix it since it was reading the same stale state. Drawing a bracket now clears and re-sets all host/guest tracking synchronously, before anything async happens, so the drawing device is unconditionally treated as host immediately.
- Also: a failure starting the live session (of any kind) now shows a toast instead of only logging to the console, so a sync failure doesn't look identical to "everything's fine" — you'll know to retry instead of assuming it's working.

## v10.5.55
- **Feature: a user can only host one live game at a time.** Starting a new live game (tournament or the generic multiplayer session/routine/game flow) now checks the server for any live session you're already hosting. If one's found, you're asked to end it before starting the new one — confirm and it ends automatically; cancel and the new activity just plays locally without syncing to other devices. This is checked server-side (not just local app state), so it also catches sessions left dangling from a crashed tab or a previous device.

## v10.5.54
- **Hotfix:** drawing a bracket threw `FirebaseError: Function addDoc() called with invalid data. Nested arrays are not supported` and the live session never got created — Firestore flatly rejects the bracket's `wb`/`lb` fields (arrays of arrays of match ids). This is exactly why guests were stuck on "waiting for host to draw the bracket": the host's draw never actually made it to Firestore, so nothing was there to sync. Fixed by serializing the whole bracket to a JSON string on write (and parsing it back on every read path — host's own listener, guest join, and the manual Refresh button), which sidesteps Firestore's data-shape restrictions entirely.
- As a result, the host's "score for anyone" fallback (already built into every match card and the bracket view) now actually reaches other devices, since live sync no longer silently fails to start.

## v10.5.53
- **Hotfix:** the "⌨️ Type the final score instead" option only showed up when it was literally your turn to tap Made/Missed — so a match participant who wasn't the *current* putter (e.g. waiting on their opponent's alternating turn) had no way to enter scores manually at all, on either the featured match card or the bracket. It's now available to either participant (or the host) any time the match is ready, whether or not it's currently your turn in the tap-by-tap flow.

## v10.5.52
- **Hotfix:** a participant opening the live tournament right as the host drew the bracket could get stuck on "Waiting for the host to draw the bracket…" indefinitely. The session doc was written in two steps (create, then a follow-up update adding the bracket) — anyone who loaded the session in that gap was waiting on a second Firestore write their listener wasn't guaranteed to catch promptly. The bracket is now included in the same write that creates the session, closing the gap.
- Added a manual "🔄 Refresh" button to both tournament "waiting for host" screens as a fallback, in case a listener ever misses an update (flaky connection, backgrounded tab).

## v10.5.51
- **Feature: type in tournament scores instead of tapping Made/Missed one putt at a time.** The featured match card now has an "⌨️ Type the final score instead" link that swaps to two Makes/Attempts number inputs per player — enter the final tally and hit Submit to record the match. Handy for higher targets (first to 21) or logging a match that was already played out in person.
- **Feature: enter scores directly from the bracket view.** Any match that's ready to be played (not just the one featured at the top) now shows an "✏️ Enter score" button right on its bracket card, so parallel matches (e.g. all of Winners Round 1 at once) don't have to wait in a forced queue — anyone authorized for that specific match can tap it open and submit results independently.
  - Same permission rules apply: in a live session, only the host or one of that match's two participants can enter its score.

## v10.5.50
- **Feature: live, multi-device Putting Tournament scoring.** Drawing the bracket now starts a live session (reusing the existing real-time infrastructure) so every participant can open the tournament on their own phone, watch the bracket update in real time, and — on their own turn — tap Made/Missed themselves instead of the host having to run the whole thing from one device.
  - The full bracket (every match, score, and whose turn it is) syncs to Firestore on every putt and streams back down to all connected devices.
  - Turn-gated: only the participant currently putting (or the host, as a fallback) gets working Made/Missed/Undo buttons; everyone else watches live. A "🔴 LIVE" badge marks the synced view.
  - Participants get the existing live-session banner ("[Host] is scoring — View →") and tapping it drops them straight into the live match, no need to re-run the player picker.
  - Discarding the bracket and saving final results stay host-only; guests see a "waiting for host" message at those points. Guests leaving just unsubscribe — the tournament keeps running for everyone else.
  - Host permission now tracks a dedicated field instead of the shared "active live session" state, so being a participant in some *other* unrelated live session (e.g. someone else's group game) can't accidentally strip your host controls mid-tournament.

## v10.5.49
- **Hotfix:** the tournament live-match card and bracket view (Winners/Losers/Grand Final) were nearly unreadable — white cards with barely-visible text, making the bracket look like it wasn't there at all. The tournament CSS was written light-only and never scoped for `.bulk-wizard-score-body`, which forces light gray body text everywhere else in the game-scorer wizard. Added dark-theme overrides for the match card, match format buttons, grand-final buttons, and the full bracket (rounds, slots, standings) so they match the dark cards used by every other game scorer (Horse, Ladder, etc).

## v10.5.48
- Change: Putting Tournament match format options are now **first to 12 / 15 / 18 / 21** makes (was 3 / 5 / 7 / 10). Default is 15.

## v10.5.47
- **Hotfix:** the Putting Tournament card showed a "Log Score" button instead of "Play," so clicking it opened the plain score-entry form instead of the bracket setup wizard with the player picker. Added `putting_tournament` to the built-in games' interactive-games list so it now uses the "Play" button, which opens the bulk-log wizard for selecting participants and building the bracket.

## v10.5.46
- **Hotfix:** logging a score for a percentage-scored game (Putt 100 by 10/5/2) threw `TypeError: Cannot read properties of null (reading 'value')` on submit — `renderGameScoreModal()`'s form-builder switch had no `case 'percentage':`, so the modal rendered with no Makes/Attempts inputs at all while the submit handler still tried to read them. Added the missing form fields (Total Makes, Total Attempts, Putting Distance) for percentage-type games.

## v10.5.45
- **Hotfix:** scoring a putting league game threw `ReferenceError: currentUser is not defined` and crashed the render, because `renderGameScoreModal()` referenced `currentUser` in the "who is this score for" dropdown without ever defining it. Added the missing `const currentUser = userManager.getCurrentUser();` lookup at the top of the function.

## v10.5.44
- **Hotfix:** v10.5.43 would not load — the app failed at startup with `SyntaxError: Identifier 'flawless' has already been declared`. The new Flawless Champion tournament check declared a `flawless` variable in `checkAchievements()`, which already had one for the perfect-session achievement. Renamed the tournament variables; no behaviour change.

## v10.5.43
- Add: **five Putting Tournament achievements** — Bracket Debut (play one, 100 pts), Tournament Champion (win one, 500), Bracket Survivor (win after losing a match — i.e. fight back through the losers bracket, 750), Flawless Champion (win without losing a match, 750), and Tournament Dynasty (win 5, 1000). Awarded client-side on completion and validated by both audit paths from the tournament metadata (placement / wins / losses).
- Add: the bracket view now collapses. At 16+ players it defaults to showing only the rounds still in play plus the grand final, with a toggle for the full bracket; smaller brackets show everything, and the full bracket is always shown once a champion is decided.
- MCP server version → 9.6.0.

## v10.5.42
- **New game: Putting Tournament.** Pick your participants and they're drawn into a random double-elimination bracket. Each match is a race — first to the target number of makes wins — and the bracket updates after every result until one champion is left standing.
  - Match format is configurable: first to 3, 5, 7, or 10 makes, at any distance.
  - Grand final rule is a setup choice: **true double elimination** (if the losers-bracket player wins, a deciding rematch is played, so the undefeated player must be beaten twice) or a **single grand final** (one match, winner takes all).
  - Byes are handled automatically for any number of players and are spread across the bracket rather than clustered, so no one gets an unfair run.
  - Players alternate putts within a match, with an undo for mis-taps. Makes and attempts are recorded for every match and feed each participant's accuracy stats.
  - Results save per participant with final placement, win/loss record, and total accuracy; points are awarded on accuracy plus a placement bonus (1st +200, 2nd +100, 3rd +50).
  - The bracket engine lives in `js/modules/tournament.js` as pure logic, and is covered by tests across 2–32 players and both grand-final rules.

## v10.5.41
- Change: the scoring steppers now stack vertically — **+ above the number, − below it** — instead of sitting to its left and right. Applies everywhere the stepper is used (session scoring, routine scoring, and the custom game scorer). Buttons are wider (46px) for an easier thumb target, and the score columns were narrowed accordingly, which also gives player names more room.

## v10.5.40
- Fix: In the Putt 100 games (by 10 / by 5 / by 2), the round-by-round score grid was only rendered while the game was still in progress — the moment the final round was logged it disappeared, so there was no way to review all rounds before saving. The grid is now always visible, including on the completion/review screen.
- Fix: The grid only ever showed the *current* player's rounds. In multi-player games every player now gets their own grid, each with a running total.
- Add: **Any logged round can now be edited before saving.** Tap a round in the grid to correct its score — useful when a putt is mis-tapped mid-game. Works during play and on the final review screen.
- Fix: Putt 100 totals were accumulated incrementally (`totalMade += score`), which was correct for append-only play but would have corrupted the score on an edit (re-adding attempts — e.g. 110 attempts in a 100-putt game). Totals are now derived from the round scores array, so they stay correct however rounds are changed.
- Rounds are now labelled (R1, R2, …) in the grid, and long games (20 and 50 rounds) wrap at 10 columns instead of squeezing every round onto one line.

## v10.5.39
- Verified: **season rollover across the year boundary works correctly.** Q4 2026 → Q1 2027 produces the right season id, window, and days-remaining, and client and server agree at every quarter boundary. No change needed.
- Fix: Season achievements (`Level 10`, `Max Level`, `Season Starter`) checked `user.seasonXp` — a field that is never written to the user document. Real Season XP lives in `users/{id}/seasons/{seasonId}.xp`, so these checks evaluated against 0 (or a stale legacy value) and could not award reliably. Both audit paths now read the live season document.
- Fix: `Max Level` required Season Level 50 and `Level 25` required Level 25, but the level cap is 15 (`SEASON_CONFIG.maxLevel`, with level rewards defined for 1–15) — both were permanently unearnable. The Season ladder is now reachable end to end: **Level 5 (250 pts) → Level 10 (500 pts) → Max Level, 15 (1000 pts)**. Achievement ids are unchanged, so no existing data migrates.
- Fix: client achievement points had drifted from `shared/achievement-points.json` (the single source of truth) — `level_10` awarded 250 client-side but 500 server-side. Client, server, and source of truth are now identical across all achievements.

## v10.5.37
- Fix: `putting_admin_bulk_audit` built its own audit data that had drifted from the per-user audit, so the two tools disagreed about the same user. Two causes, both now aligned:
  - It trusted the stored `user.totalMakes`/`totalPutts` (which historically excluded routine makes) instead of deriving lifetime totals from actual session, routine, and game records — the same undercount fixed for the per-user audit in v10.5.33.
  - It evaluated time-of-day achievements using `getHours()` on the Cloud Function's own clock (UTC) rather than the user's timezone — roughly a 7-hour shift for a Phoenix user, so morning/evening achievements were checked against the wrong hour entirely.
- Both audit paths now build identical audit data, so per-user and bulk results always agree.
- MCP server version → 9.5.2.

## v10.5.36
- **Fix (critical): `putting_admin_bulk_audit` did not honour achievement stickiness.** v10.5.33 added the earn-once rule to the per-user audit, but the bulk audit has its own separate detection path that was missed — so it still classified grandfathered achievements as "invalid", and running it with `auto_fix: true` would have revoked legitimately earned milestones and moment-in-time achievements across every user at once (and cascaded into the point-threshold achievements their points supported). Both audit paths now share the same stickiness rule.
- Bulk audit now reports a 🛡️ Grandfathered column, and excludes those from the "issues" count so they can't be mistaken for problems.
- MCP server version → 9.5.1.

## v10.5.35
- Fix: Games and routines logged through the bulk/group scorer awarded **0 Season XP**. The call sites passed `'game'` and `'routine'` as the XP type, but the valid keys are `'playGame'` and `'completeRoutine'` — the lookup returned `undefined`, fell through to 0 XP, and never incremented the season activity counter. Failed silently, so it only surfaced once XP recalculation became season-scoped.
- Hardening: `addSeasonXp()` now rejects an unrecognised XP type with an error instead of quietly awarding 0 XP, so a typo'd key can never silently drop XP again.

## v10.5.34
- **Fix (critical): Season XP recalculation is now season-scoped.** `putting_admin_xp_fix` and `putting_admin_bulk_recalc` compared the *stored* Season XP (correctly scoped to the current season) against a *calculated* value built from **lifetime** totals — the whole achievements array, all-time session/routine/game counts, and the lifetime daily-challenge counter. Within a long-running season this looked roughly correct, but the moment a new season began every user appeared to have enormous XP "drift", and applying the fix would have written each user's entire lifetime XP into the fresh season, destroying the season leaderboard. Both tools now count only activity that falls inside the current season window (seasons are calendar quarters).
- Add: achievements now record when they were earned (`achievementDates`). They were previously stored as a bare list of ids with no timestamps, so there was no way to tell which were earned in the current season. Users with no recorded dates fall back to the season document's counter rather than the lifetime total — an undercount is recoverable; injecting lifetime XP into a new season is not.
- The XP fix report now states the season window it is scoping to, and whether achievement XP came from earned dates or the season counter.
- MCP server version → 9.5.0.

## v10.5.33
- Fix: Completing a routine now adds its makes/attempts to the user's lifetime `totalMakes`/`totalPutts`, matching what sessions and games already did. Deleting a routine already *subtracted* them, so stored totals only ever ratcheted downward — leaving lifetime makes well below the true figure (one user showed 898 stored vs 1,837 actual).
- Fix: Achievements are now "sticky" — earned once, never revoked. Achievement checks re-evaluate against current data, which wrongly stripped milestones ("100 sessions", "Total Makes 1K") and moments in time ("practice before 8am", "score exactly 69") whenever the underlying activity was later deleted or edited. Revoking also removed the achievement's points, which cascaded into point-threshold achievements failing too. Only genuinely reversible state (profile fields, live friend counts) remains revocable.
- Fix: The achievement audit now derives lifetime putts/makes from actual session, routine, and game records instead of trusting the stored total and estimating routine/game putts at flat per-activity rates.
- Audit: mismatched sticky achievements are now reported as "grandfathered" rather than "invalid", so real data problems stay visible without threatening earned badges.

## v10.5.32
- Fix: Season XP is now credited the moment an achievement is unlocked, through every unlock path (real-time, time-based-on-login, leaderboard, and bulk/group scorer). Previously the +30 XP was only awarded as a side effect of the achievement splash animation, so achievements earned through other paths left their XP uncredited until a manual recalc. Award is idempotent (keyed by achievement id) and symmetric with the existing revoke path.
- Fix: Completing a weekly challenge now awards its Season XP (+75) and increments the season weekly-challenge counter through the normal play flow. Previously weekly XP only applied if a user pressed the manual "Recalculate Weekly Challenge" button; auto-completed weeklies were under-credited. Awarded once per week per user via completeChallenge(), which both the automatic and manual paths funnel through.

## v10.5.31
- Fix: Challenges tab category expand/collapse scroll preservation now correctly re-queries the DOM after render (previous fix wrote to a detached element)

## v10.5.30
- Fix: Expanding/collapsing categories on the Challenges tab no longer jumps the view back to the top of the page

## v10.5.29
- Fix: Streak counter now correctly resets when a day is missed — stale stored value is overwritten with live recalculation on every stats load
- Fix: Streak display no longer shows incorrect value during initial load when games/routines haven't finished fetching

## v10.5.28
- Fix: Game difficulty badges (Easy/Medium/Hard) now readable in dark mode
- Fix: Game card description text color corrected in dark mode

## v10.5.27
- Fix: Friend search result cards now readable in dark mode (white background replaced with dark slate)

## v10.5.26
- Feature: Friend requests now require approval — clicking "+ Add Friend" sends a request the recipient must accept or decline; buttons show "⏳ Pending" for already-sent requests
- Fix: Dark mode game scoring text in "View Details" panel is now readable (was dark-on-dark)

## v10.5.8
- Fix: Dark mode routine difficulty labels now visible (background was light gray, text invisible)
- Fix: Android status bar overlap — all pages now respect safe-area-inset-top on native builds
- Fix: Getting Started module now has a close (✕) button

## [10.3.4] - March 2026 — Sticky Bottom Nav, Full Page Scroll, Footer Restored

### Changed
- **Reverted v10.3.3 layout changes** — footer is back, page scrolls normally
- **Mobile nav now uses `position: sticky; bottom: 0`** — stays in normal document flow so the whole page scrolls freely, but the nav bar sticks to the bottom of the viewport as you scroll past it
- Removed all `body:overflow:hidden`, `height:100dvh`, and `flex:1` overrides from `applyMobileNavStyles`
- Icon + label tab design retained from v10.3.3

---

## [10.3.3] - March 2026 — Mobile Nav Always Visible

### Fixed
- **Tabs buried below footer requiring scroll** — root cause was the page scrolling as a whole, pushing the tabs off-screen
- **Fix**: JS now sets `#app` to `display:flex; flex-direction:column; height:100dvh` and `.main-content` to `flex:1; overflow-y:auto` so the main area scrolls internally while tabs stay anchored at the bottom
- Footer (`app-footer`) and Getting Started button hidden on mobile — the bottom nav replaces them
- **Tab redesign**: icon (emoji, 20px) stacked above label (0.62rem text), matching the reference mockup
- Shortened tab labels: "Challenges/Achievements" → "Challenges", "Leaderboards" → "Boards"
- Active tab dark-mode safe: explicitly set `color:white !important` on active tab and its children to prevent dark mode overrides

---

## [10.3.2] - March 2026 — Move Tabs Below Main in DOM

### Fixed
- **Root cause of tabs disappearing in v10.3.1**: `position: fixed` is unreliable in Capacitor's Android WebView — elements can render off-screen or behind the WebView layer
- **New approach**: Moved the `<div class="tabs">` entirely out of `<main>` and placed it after `</main>` in the DOM. The tabs now sit at the bottom of the page flow naturally, no fixed/absolute positioning required
- `applyMobileNavStyles()` still runs to enforce the horizontal flex row via JS inline styles, but no longer sets `position:fixed`
- Removed fixed positioning from the `<style>` block in `index.html`

---

## [10.3.1] - March 2026 — Mobile Nav Fixed via JavaScript Inline Styles

### Fixed
- **Definitive fix for mobile nav layout**: After 8+ CSS-only attempts all failed due to WebView cascade conflicts, switched to JavaScript `element.style.cssText` applied directly after every `render()` call. JS inline styles are the highest specificity possible — they beat all CSS regardless of `!important`, file load order, or WebView quirks
- Added `applyMobileNavStyles()` method called in render's `finally` block, targeting `#main-tabs` and its `.tab` children
- Added `id="main-tabs"` to the tabs container div for reliable targeting
- Preserves active tab gradient by re-applying it after style reset

---

## [10.3.0] - March 2026 — Mobile Bottom Nav: Inline Style (Guaranteed Fix)

### Fixed
- **Root cause of all previous attempts failing**: no external CSS file can reliably win the cascade when multiple files fight over the same selectors with conflicting specificity. The only guaranteed solution is an inline `<style>` block placed in `<head>` after all `<link rel="stylesheet">` tags — the browser always processes it last
- Moved all bottom nav CSS into an inline `<style>` block at the bottom of `<head>` in `index.html`
- Removed all bottom nav overrides from `mobile-fixes.css` (no longer needed)
- No `!important` flags required — source order alone guarantees the win

---

## [10.2.9] - March 2026 — Bottom Nav Back in mobile-fixes.css

### Changed
- Moved bottom navigation bar CSS back into `css/mobile-fixes.css` where it belongs
- Removed it from `coaching.css` (that was a workaround for cascade ordering)
- All `!important` flags retained — they override the conflicting `min-height: 44px` and `flex-shrink: 0` rules in `enhancements.css` regardless of load order

---

## [10.2.7] - March 2026 — Fix Mobile Nav Tabs Still Stacking Vertically

### Fixed
- **Root cause identified**: `enhancements.css` (loaded before `mobile-fixes.css`) had `.tab { min-width: fit-content; min-height: 44px; }` and `styles.css` had `@media (max-width: 768px) .tab { flex-shrink: 0 }` — both preventing tabs from compressing into a row. Because `phase2.css`, `phase5.css`, `modal-redesign.css`, `onboarding.css`, and `coaching.css` all load **after** `mobile-fixes.css`, any non-`!important` overrides in mobile-fixes were being overridden right back
- **Fix**: Moved the entire bottom navigation CSS block to the very end of `coaching.css` (the last file loaded in `index.html`), guaranteeing it wins the cascade
- Added `!important` to every property in the block and explicitly overrode `min-height: 0`, `flex-shrink: 1`, `min-width: 0`, and `flex-direction: row` so no upstream rule can re-stack the tabs

---

## [10.2.6] - March 2026 — Fix Tab Active Highlight Bleed

### Fixed
- **Challenges/Achievements tab active gradient bleeding outside the tab bar** — three root causes fixed:
  1. Removed `margin-left: -18px` hack on `.tab-compact` span (desktop ≥641px) — this negative margin was pushing the span outside the button's layout box, breaking gradient clipping
  2. Added `overflow: hidden` to both `.tab` rule sets so the active background gradient is always clipped within the border-radius
  3. Fixed `body.dark-mode .tab-compact` having `background: #1e293b` — the inner span's own background was conflicting with the parent button's active gradient; changed to `transparent`
- Removed `flex-wrap: wrap` from global `.tabs` rule to prevent unexpected tab wrapping

---

## [10.2.5] - March 2026 — Fix Mobile Nav Horizontal Layout

### Fixed
- **Bottom navigation tabs were stacking vertically on mobile** — added explicit `flex-direction: row !important` and `flex-wrap: nowrap !important` to force all 6 tabs onto a single horizontal row
- Reduced tab font size slightly (`0.62rem`) and tightened padding so all tabs fit without scrolling on narrow screens
- "Challenges/Achievements" compact label font reduced to `0.58rem` to fit within its tab cell

---

## [10.2.4] - March 2026 — Mobile Bottom Navigation Bar

### Changed
- **Navigation tabs moved to bottom of screen on mobile** — on devices ≤640px wide the tab bar is now fixed to the bottom of the viewport, matching the standard Android/iOS app navigation pattern
- **Android system bar safe area** — added `env(safe-area-inset-bottom)` padding so the nav bar never overlaps the Android gesture bar or clock/notification area
- **Status bar safe area** — added `env(safe-area-inset-top)` padding to the app header for devices with notches or status bar overlaps
- **Compact tab labels** — tab font size reduced slightly on mobile so all 6 tabs fit without horizontal scrolling
- Added `viewport-fit=cover` to the viewport meta tag (required for `env(safe-area-inset-*)` to function)

---

## [10.2.3] - March 2026 — Fix Loading Screen Crash

### Fixed
- **App crash on startup** caused by duplicate `const currentUser` declarations in `renderEloLeaderboard`, `renderSeasonXpLeaderboard`, and `renderPutterRatingLeaderboard`. The friends filter block we added in v10.2.2 re-declared `currentUser` which was already declared at the top of each function, causing a JS syntax error that prevented the app from loading.

---

## [10.2.2] - March 2026 — Friends & Tier Leaderboard Filters

### Added
- **👤 Friends only** toggle on all leaderboard tabs (Points, ELO, Season XP, Rating) — shows only the current user + their friends. Button only appears if the user has at least one friend. Toggles on/off.
- **Tier filter** on the Rating leaderboard — pill buttons to filter by Beginner / Amateur / Skilled / Expert / Elite. Sits directly below the shared filter row.
- Both filters compose with the existing gender filter (all three apply simultaneously)
- Full dark mode coverage for both new controls

### Changed
- `renderGenderFilter()` replaced by `renderLeaderboardFilters()` which renders the combined friends + gender row. `renderGenderFilter()` kept as a deprecated alias.
- Added `leaderboardFriendsOnly` and `leaderboardRatingTier` to app state
- Filters reset correctly when switching tabs (showAll resets; filter state persists across tab switches intentionally)

---

## [10.2.1] - March 2026 — Gender Filter on All Leaderboards

### Changed
- **Gender filter** (♂️ Male / ♀️ Female / 👥 Both) now appears on all four leaderboard tabs: Points, ELO, Season XP, and Rating
- Extracted inline gender filter HTML into reusable `renderGenderFilter()` method — single source of truth
- All four leaderboard render functions apply the filter before slicing for display
- **Dark mode fix:** gender filter container now correctly uses `var(--bg-secondary)` background and `var(--border-color)` border instead of hardcoded light values; filter label, toggle hover, and active states all properly themed

---

## [10.2.0] - March 2026 — Admin Putter Rating Recalc Tool

### Added
- **`putting_admin_recalc_rating`** MCP tool — backfills Putter Rating for any user from their full session history
  - Reads all sessions ordered oldest-first, applies distance/accuracy formula vs scratch baselines, applies weather multipliers, exponential time decay (λ=0.002/day)
  - `dry_run: true` (default) previews result without writing; `dry_run: false` saves to Firestore
  - Output shows new rating, tier, change vs old rating, sessions scored vs skipped, and breakdown of last 10 sessions
- Added `putterRating`, `ratingWeightedSum`, `ratingTotalWeight`, `ratingLastUpdated` to `User` interface in `index.ts`

---

## [10.1.9] - March 2026 — Teams UI Hidden

### Changed
- **Teams** tab removed from leaderboard type tabs
- **Teams** icon button removed from all tab header social icon rows
- All four team modals (team info, create team, browse teams, team invite) removed from render output
- Team button event listeners removed from attachEventListeners
- All render methods and backend logic preserved intact — hidden only from UI for future reimplementation

---

## [10.1.8] - March 2026 — Putter Rating System

### Added
- **Putter Rating** — performance-based numeric rating (0–999) inspired by the PDGA system
- **Five tiers:** Beginner (0–299), Amateur (300–499), Skilled (500–649), Expert (650–799), Elite (800–999)
- **Formula:** each session scored as `500 + log2(actualPct / scratchPct) × 150` vs community scratch baselines per distance; weather difficulty multiplier applied on top (wind speed exponential, rain +0.15, snow +0.20, extreme temps)
- **Full history with decay:** incremental O(1) update on every session — no history scan needed. Decay λ=0.002/day (~1yr half-life) means old sessions fade rather than vanish
- **Weather multiplier:** wind 10–14mph +8%, 15–19mph +18%, 20–24mph +32%, 25+mph +50%; rain +15%, snow +20%, temp <35°F +10%, temp >95°F +8%
- **Live community baselines:** `buildLiveBaselines()` blends real session data (70%) with seeded values (30%) once a distance has ≥20 sessions
- **`js/modules/putterRating.js`** — standalone module: `calcSessionScore()`, `getWeatherMultiplier()`, `PutterRatingManager` class with `updateRatingFromSession()`, `recalcFromSessions()`, `renderBadge()`, `getTier()`
- **`js/modules/teamsLeagues.js`** — `getPutterRatingLeaderboard()` added
- **`js/modules/user.js`** — rating recalc hooked into `addSession()` post-save, silent fail
- **Leaderboard tab** — new 🎯 Rating tab in the leaderboard section with tier legend, player rows, show more/less
- **Profile stats card** — rating appears as a 7th stat card with tier color accent and tier name label
- **CSS** — `.putter-rating-badge`, `.rating-leaderboard-item`, tier colors, dark mode coverage

---

## [10.1.7] - March 2026 — Dark Mode Comprehensive Fixes

### Changed
- **Dark mode toggle removed from Profile → Privacy panel** — the floating FAB (bottom-left) is now the only toggle

### Fixed (Dark Mode Gaps)
- **`styles.css`** — Login card, form inputs/selects/labels, profile field labels/inputs/hints, session date/stats text, leaderboard items, achievement card (locked), filter label, inline tabs, section hint text
- **`enhancements.css`** — Stats page: search input, player header gradient, player name/meta, distance labels/bar background, best session card; Bulk wizard: player checkbox list/items, player summary/score items, game selection items, permissions section, goal labels; General: checkbox labels, select[multiple] options, game/summary section headers
- **`phase2.css`** — Slide panel background/header/close button, friend request items, activity feed items, notification items (including unread state), section icon buttons, toast close button, challenge target info/from/desc/score, empty state title, notification hints
- **`phase5.css`** — Team name, member names, team section headings (Members/Activity/Invites), team leaderboard name text, friend activity user name

---

## [10.1.6] - March 2026 — Dark Mode FAB Restored

### Changed
- **Dark mode floating button** restored to bottom-left corner (was removed in v10.1.5)
- FAB is 1/3 smaller than the original: 32×32px circle (vs ~48px before)
- Displays 🌙 in light mode, ☀️ in dark mode; button itself shifts from dark grey to orange gradient when dark mode is active
- Button is injected once into the DOM (persists across renders, no flicker)
- Syncs state with the profile panel toggle when both are visible

---

## [10.1.5] - March 2026 — Dark Mode Toggle Moved to Profile

### Changed
- **Dark mode toggle** moved from floating fixed button (bottom-left corner) into **Profile → Privacy panel** as a proper toggle switch row
- Toggle renders as a pill switch (off = grey, on = orange gradient) with a ☀️ Off / 🌙 On label
- Removed the `.dark-mode-toggle` fixed button CSS entirely — no more floating button cluttering the UI
- Privacy panel now has an "Appearance" section header above the toggle, separating it from the privacy checkboxes below

## [10.1.4] - March 2026 — Dark Mode Tab Fixes

### Fixed
- **Main navigation tabs** (`Practice`, `Routines`, `Games`, `Challenges/Achievements`, `Leaderboards`, `Stats`) — tab bar now shows dark slate background (`#1e293b`), inactive tabs show muted text, active tab keeps orange gradient
- **Sub-tabs** (Routines: Suggested/My Custom/Community; Games: Built-in/My Custom/Community) — container border, inactive text, hover, and active state all corrected for dark mode
- **Leaderboard tabs** — active state now uses consistent orange gradient (was incorrectly using `var(--bg-card)` + `#fb923c`); inactive and hover states match the rest of the app
- **Profile modal tabs** (Info/Goals/Location/Privacy/Stats/Friends) — already used CSS vars; now resolve correctly since `--modal-text-secondary` and `--brand-orange` are properly defined on `body.dark-mode` in `modal-redesign.css`
- **Tab-header titles** inside Routines and Games views now use `#f1f5f9` in dark mode
- **`leaderboard-tab` border** hardcoded `#e5e7eb` overridden to `#334155` in dark mode

## [10.1.3] - March 2026 — Dark Mode Fixes & Getting Started Routing

### Fixed
- **CSS variables defined:** `--accent-color`, `--bg-color`, `--card-bg`, `--text-color`, `--text-muted`, `--border-color`, `--border-radius` now properly declared on `:root` (light values) and `body.dark-mode` (dark values) in `modal-redesign.css`. These were used throughout `coaching.css` and `coachingUI.js` but never defined — resolving to empty/inherited values in both light and dark mode
- **`coaching.css` dark mode fixed:** All `[data-theme="dark"]` selectors converted to `body.dark-mode` to match the app's actual dark mode implementation. The old selectors were completely non-functional
- **`tutorialVisual.css` dark mode added:** Tutorial legend modal now fully themed in dark mode (card background, legend side, screenshot side, footer, dots, header gradient)
- **`mobile-fixes.css` dark mode added:** Hardcoded `background: white` and `color: #111827` replaced with CSS variable equivalents; dark mode overrides added for chart sections and scrollbar
- **Getting Started routing:** Both the floating `gettingStartedBtn` and the footer `📖 Getting Started` button now open the new onboarding flow instead of the old tutorial slideshow

## [10.1.2] - March 2026 — New Getting Started Onboarding Flow

### Added
- **Full first-time onboarding flow** replaces the old slideshow tutorial for new users. 4 steps:
  - **Step 1 — Welcome:** Dark branded screen with animated floating disc illustration
  - **Step 2 — Features:** Clean mini UI mockups for Practice, Routines, and Games with feature descriptions
  - **Step 3 — Setup:** Display name input + 4-button skill level picker (Beginner / Intermediate / Advanced / Pro); values save directly to user profile
  - **Step 4 — Ready:** Personalized celebration with avatar initial, skill badge, and 3 first-step tips with point values
- New `js/modules/onboarding.js` and `css/onboarding.css`
- Onboarding awards the `tutorial_complete` achievement (50 pts) on finish
- Old tutorial modal remains accessible via the "📖 Getting Started" footer button for returning users

## [10.1.1] - March 2026 — Achievement Logic & Data Fixes

### Fixed
- **`comeback_kid` logic:** Now properly detects a 30+ day gap between consecutive practice sessions. Previously fired incorrectly for any user with a long streak and 30+ total sessions, meaning it was awarding the "comeback" badge to dedicated players who never actually took a break.
- **`versatile_putter` logic:** Now correctly requires completing at least one session, one routine, *and* one game — matching its description. Previously checked for sessions at 6 different distance ranges (10–60ft), which was completely wrong and had nothing to do with activity variety.
- **`underdog_victory` logic:** Added guard requiring both previous and current leaderboard rank to be valid positive numbers. Previously could fire spuriously when a user had no valid current rank (e.g., just after signup with points but no sessions).
- **Description mismatches corrected** — the following achievement descriptions now accurately describe what triggers them:
  - `consistency_builder`: "Complete the Consistency Builder routine" (was: "Maintain 75%+ accuracy for 5 consecutive sessions")
  - `points_surge`: "Earn 500+ points in a single day" (was: "Double your weekly point average")
  - `points_doubler`: "Earn 2,000+ total points" (was: "Score double your average points in one session")
  - `personal_best`: "Score 150+ points in a single session" (was: "Beat your best session score")
  - `data_enthusiast`: "Export your data 10 times" (was: "View your stats page 10 times")
  - `versatile_putter`: "Complete at least one session, one routine, and one game" (was: "Complete sessions, routines, and games")
  - `comeback_kid`: "Return to practice after a 30+ day gap" (was: "Return to practice after 30+ day break")

### Data Cleanup (admin)
- Revoked 15 invalid achievements from `playstore` account (earned then lost when data was cleared), awarded 1 missing (`first_friend`)
- Revoked 1 invalid achievement (`underdog_victory`) from Julian Plaza
- Revoked 1 invalid achievement (`tutorial_complete`) from Sidepiece Plastic

## [10.0.0] - March 2026 — Season XP Drift Fixes

### Fixed
- **Bug #1 — Bulk wizard missing Season XP:** `submitBulkSession`, `submitBulkRoutine`, and `submitBulkGame` now correctly call `awardSeasonXp()` for the current user's own activity. Previously the bulk wizard awarded points but silently skipped the season XP/counter increment, causing systematic drift for all users who logged via the wizard.
- **Bug #2 — Offline sync missing Season XP:** All six offline queue sync paths (`session`, `routine`, `game`, `bulk_session`, `bulk_routine`, `bulk_game`) now call `awardSeasonXp()` when syncing back online. XP was previously only awarded if the activity was logged while online.
- **Bug #3 — `addSeasonXp()` double-count (Stephanie-style drift):** Added optional `activityId` idempotency guard to `addSeasonXp()` in `teamsLeagues.js`. When an `activityId` is provided, the function writes a record to an `xpLog` subcollection and skips if already present — preventing double-award on save retries, offline-sync replays, or optimistic UI re-saves.
- **Bug #4 — "Committed" and other account-age achievements never firing passively:** Added `checkTimeBasedAchievements()` to `AchievementManager`. Called on every login via `onAuthStateChange`, it checks account-age milestones (30-day Committed, 90-day Veteran, 365-day Legend) regardless of whether the user has logged any activity. Previously these only fired inside `checkAchievements()`, which requires an activity to trigger.
- **Bug #5 — Invalid competition achievements persisting after H2H/challenge resolution:** `updateActiveH2HChallenges()` and `updateActiveFriendChallenges()` now call `revalidateAchievements()` for the current user after any challenge resolves — not just for the winner. ELO-dependent achievements (Underdog Victory, Rising Star) are now revoked promptly when they no longer qualify.

### Technical
- `activitiesCompleted` season counters now increment correctly across all activity paths: direct log, bulk wizard (self), bulk wizard (accepted pending), offline sync, and online sync
- `addSeasonXp()` signature updated: `addSeasonXp(userId, xpType, amount = null, activityId = null)` — fully backward compatible, `activityId` is optional

## [9.9.9] - March 2026 — Local Background Images

### Fixed
- **Background images** now stored as local files instead of Unsplash URLs (which were returning incorrect/random images)
- Added `download-backgrounds.js` script to fetch all 19 background photos from verified Unsplash sources
- All `backgrounds.js` file references updated to `../images/backgrounds/{name}.jpg`

## [9.9.7] - March 2026 — Background Picker & Rotation

### Added
- **`js/modules/backgrounds.js`** — new BackgroundManager module with 20 US regional backgrounds spanning every region (Southwest, Pacific NW, West Coast, Rockies, Plains, Midwest, Great Lakes, South, Southeast, Appalachian, Northeast, Gulf Coast, Alaska, Hawaii)
- **Background picker in Profile modal** — gallery organized by tier (Default / Earned / Rare) showing gradient swatches, region names, and lock state with unlock hint text
- **Auto-rotation mode** — toggle in the picker; rotates through all unlocked backgrounds every 5 minutes
- **Unlock system** — 5 always-unlocked defaults; 12 earned via specific achievements (week_warrior, point_king, committed, etc.); 3 rare unlocks for podium_finish, daily_grinder, session_legend, and number_one
- **Background unlock toast** — animated notification when an earned achievement also unlocks a new background
- **Preference persistence** — saved to localStorage immediately on pick + synced to Firestore user object on profile save; applied on every login

### Changed
- **`css/styles.css`** — background picker grid, swatch cards, rotation toggle switch, unlock overlay, active checkmark, and toast notification styles added
- **`js/app.js`** — backgroundManager imported; init called after dark mode on load and after user login; profile modal renders picker section; event handlers for swatch clicks and rotation toggle; handleProfileSave persists bg preference; achievement flow checks for new background unlocks

---

## [9.9.6] - March 2026 — iOS Build Infrastructure

## [9.9.6] - March 2026 — iOS Build Infrastructure

### Added
- **Full iOS build pipeline** — everything needed to ship to the App Store, short of requiring a Mac to run Xcode
- **`ios-icons/AppIcon.appiconset/`** — all 13 required iOS icon sizes (20px → 1024px) with proper `Contents.json` for Xcode; solid `#1a1a1a` background (no transparency — Apple requirement); logo fills 88% of canvas
- **`ios-icons/splash/`** — 11 iOS splash screen variants from 320×480 through 2732×2732, center-cropped from source
- **`ios-icons/App.entitlements`** — pre-staged entitlements file with Sign in with Apple capability
- **`ios-icons/GoogleService-Info.plist.template`** — annotated template showing where to drop the real Firebase plist download
- **`build-ios.sh`** — iOS-specific build script: runs `build-cap.sh`, copies icons/splash/entitlements to Xcode project paths
- **`fix-ios.sh`** — one-time fix script: runs `pod install`, checks for `GoogleService-Info.plist`, patches `Info.plist` with GPS privacy strings and Google Sign-In URL scheme, reminds about Sign in with Apple capability
- **`IOS_BUILD.md`** — 15-step guide from zero to App Store submission including Xcode setup, Firebase registration, App Store Connect listing, TestFlight, and common issues
- **`package.json`** scripts: `build:ios`, `fix:ios`, `fix:android`

### Changed
- **`build-cap.sh`** — now patches both Android and iOS icons in one run; also copies `ic_launcher_foreground.png` and `mipmap-anydpi-v26/` XML files (adaptive icon support added in 9.9.5); fixed dead reference to removed `screenshots/` root folder and `service-worker-improved.js`

---

## [9.9.5] - March 2026 — Adaptive Icons + Service Worker Consolidation

### Fixed
- **Android icon cropping (proper fix)**: Added true Android adaptive icon support via `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` — now uses foreground/background layer architecture that Android 8+ requires; black background layer (`#FF000000`) matches the icon's outer ring; all launchers (circle, squircle, teardrop, etc.) now clip cleanly
- **Foreground layer generated** for all 5 densities (mdpi → xxxhdpi) at 60% safe-zone fill — content never clips on any device shape
- **Version drift fixed**: `APP_VERSION` in `index.html` was stuck at `9.8.2` while service workers were already at `9.9.3`; all version references now stay in sync
- **Duplicate service worker removed**: `service-worker-improved.js` promoted to canonical `service-worker.js`; the old `service-worker.js` (cache-first for all resources) replaced by the Network-First strategy for HTML (always fetches fresh `index.html`) and Cache-First for static assets

### Removed
- `service-worker-improved.js` (merged into `service-worker.js`)
- `build-cap.sh.bak` (stale backup)
- `update-checker-improved.html` (dead file)
- `zone-helper.html` (dead file)
- `/screenshots/` root folder (duplicate of `resources/screenshots/`)

### Changed
- `manifest.json` screenshot paths updated from `/screenshots/` → `/resources/screenshots/`

### Android Deploy Notes
Copy these into your Android project under `app/src/main/res/`:
- `android-icons/mipmap-anydpi-v26/` → `mipmap-anydpi-v26/`
- `android-icons/values/colors.xml` → `values/colors.xml` (merge with existing)
- All `android-icons/mipmap-*/ic_launcher_foreground.png` → respective `mipmap-*/` folders

---

## [9.9.4] - March 2026 — Android Icon Safe Zone Fix

### Fixed
- Android app icon and loading icon no longer cropped on any device shape (circle, squircle, etc.)
- Reduced icon content to 55% of image area, well within Android adaptive icon safe zone (61%)
- All mipmap densities regenerated (mdpi through xxxhdpi)
- `resources/icon.png` and all PWA icons updated with consistent padding

---

## [9.9.3] - March 2026 — Unified Group UI
### Changed
- Removed "📋 Multiplayer Log" button from Recent Practice card header
- "📋 Multiplayer Log Routines" renamed to "👥 Group Routines" using the same blue gradient Group button style
- Added "👥 Group Games" button to the Putting Games card header, same style, opens bulk log wizard in game mode

## [9.9.2] - March 2026 — Multiplayer Timer Auto-Start Fix
### Fixed
- Bulk log wizard (Multiplayer Log) timer now auto-starts immediately when entering the scoring step, matching Simple Scorer behavior

## [9.9.1] - March 2026 — Distance Slider +10% Size
### Changed
- Distance slider 10% larger across all scoring modules (Simple Scorer, Group Scorer, Bulk Log Wizard)
  - Track height: 52px → 57px
  - Rail & fill height: 10px → 11px
  - Thumb: 26×26px → 29×29px (dragging: 30→33)
  - Tick marks, label font sizes, and value font all scaled proportionally

## [9.9.0] - March 2026 — Group Scorer with Full XP & Achievements
### Added
- **Group Scorer**: New 👥 Group button on the practice page opens a full-screen group session overlay
- **Step 1 – Player Selection**: Pick friends from your friends list; current user is always included; minimum 2 players required to start
- **Step 2 – Live Scoring**: Player pill switcher at top shows all players with running scores; active player is highlighted; tap any pill to switch who you're scoring for
- **Auto-advance toggle**: Optionally advance to the next player automatically after every putt
- **Next Player button**: Manually rotate through players without tapping the pill
- **Per-player putt history dots**: The putt dot tracker reflects the currently active player's history
- **Undo**: Remove the last recorded putt for the active player
- **Distance slider**: Shared distance across all players; locks after first putt
- **Step 3 – Group Summary**: Ranked leaderboard showing makes/accuracy/points for all players, with achievement badges inline
- **Season XP for all players**: Every player in a Group Scorer session earns Season XP (practiceSession reward) immediately — not deferred to next login
- **Achievements for all players**: checkAchievementsForUser() checks all session-based, accuracy, distance, streak, and volume achievements for non-current-user players by reading/writing Firestore directly without touching the current user's state
- **addAchievementForUser()** in user.js: Direct Firestore achievement write that does not require the target user to be loaded in userManager
- **awardSeasonXpForUser()** in app.js: Thin wrapper to award season XP to any userId

### Technical
- Group sessions write directly to each player's `users/{id}/sessions` subcollection (active immediately, no pending flag)
- Current user goes through the full normal pipeline (addSession → awardSeasonXp → daily challenge → H2H/friend challenges → achievements)
- Other players get: direct Firestore session write + awardSeasonXpForUser + checkAchievementsForUser
- All group scorer methods are self-contained and do not use the bulk log wizard infrastructure
- _groupScorerUpdateUI() patches only changed DOM elements between putts for smooth performance

# Changelog

## [9.7.5] - March 2026 — Fix Syntax Error
### Fixed
- **App stuck on blank screen**: SyntaxError in auth.js caused by account linking methods being appended outside the class body — moved inside AuthManager class where they belong

## [9.7.4] - March 2026 — Silent Cancel on Auth
### Fixed
- **Error toast on Apple/Google cancel**: tapping X to dismiss sign-in no longer shows a red error toast — cancelling is treated as a silent no-op
- Covers all cancel error codes: `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, error code 1001 (Apple native cancel), and message-based cancel detection

## [9.7.3] - March 2026 — Linked Accounts
### Added
- **Linked Accounts section** in Profile modal for email/password users
- Link Google account — opens native Google picker, links to existing email account
- Link Apple account — same flow for Apple Sign-In
- Unlink Google/Apple — safely removes provider (only shown when 2+ providers exist so you can't lock yourself out)
- Profile modal re-renders after link/unlink to reflect updated state instantly

## [9.7.2] - March 2026 — Native Google Sign-In Fix
### Fixed
- **Google Sign-In stayed in browser after auth**: `signInWithRedirect` opened Chrome but never returned to the app
- Now uses `@capacitor-firebase/authentication` plugin (`FirebaseAuthentication.signInWithGoogle()`) on Capacitor — opens native Google account picker and returns directly to the app
- Same fix applied to Apple Sign-In on Capacitor

## [9.7.1] - March 2026 — Android Crash Fix
### Fixed
- **Android FATAL crash on launch**: `NoClassDefFoundError: com.google.android.gms.auth.api.signin.GoogleSignIn`
  - Root cause: `@capacitor-firebase/authentication` plugin registered in Android project but missing `play-services-auth` Gradle dependency
  - Fix: Added `com.google.android.gms:play-services-auth:21.0.0` to `android/app/build.gradle`
### Added
- `fix-android.sh` — run once from project root to auto-patch build.gradle, sync, and build debug APK
- `fix-android.bat` — same fix for Windows

## [9.7.0] - March 2026 — Android Auth Fix
### Fixed
- **Android Google Sign-In**: Replaced broken `@capacitor-community/google-auth` native plugin approach with `signInWithRedirect` — popup sign-in is blocked in Android WebView and required this change
- **Android Apple Sign-In**: Same redirect fix applied — now uses `signInWithRedirect` on Capacitor instead of popup
- **Capacitor config**: Added `server.url: "https://puttingimprover.com"` so the WebView loads from the live authorized domain (fixes `auth/unauthorized-domain` errors)
### Added
- **`checkRedirectResult()`** method in AuthManager — call on every app init in Capacitor to capture the signed-in user after returning from a Google/Apple redirect
- Auto-check on Capacitor startup in `app.js` init — redirect result is processed automatically with no extra user action

## [9.6.9] - March 2026 — Apple Sign-In
### Added
- **Apple Sign-In**: Standard Apple black button on login screen with full Firebase OAuthProvider integration
- Supports both web (popup) and native Capacitor (SignInWithApple plugin) flows
- Proper error handling for all Apple auth scenarios including account-exists-with-different-credential

## [9.5.2] - February 2026 — Activity Duration on All Cards
### Added
- **Session cards**: Duration pill `⏱️ X min` added to stats row (moved from header tag)
- **Game cards**: Duration pill shows `game.timeInMinutes || game.duration` in stats row
- **Stats page**: Duration appended to session, game, and routine mini-cards

### Cleaned Up
- Removed unused `durationDisplay` variable from session renderer
- Routines already showed duration in stats row — no change needed

## [9.5.1] - February 2026 — Auto-Time All Multiplayer Activities
### Removed
- Manual Start/Pause/Reset timer UI from session, routine, and game scoring forms
- All timer listener code (bulkStartSessionTimer, bulkResetSessionTimer, routine, game equivalents)
- All timer state variables (bulkSessionTimerRunning, bulkSessionTimerSeconds, intervals, etc.)

### Added
- Auto-timer: `_bulkScoringStartTime = Date.now()` recorded when entering step 3 (scoring)
- Duration auto-calculated on submit: `Math.max(1, Math.ceil((Date.now() - startTime) / 60000))` minutes
- Applied to all activity types: sessions, routines, generic games, and all 8 interactive games (HORSE, Ladder, Par, Perfect 10, Points Poker, Putt 100, Joe's Monday, Around The World)
- Cleared on wizard close and after each submit

## [9.5.0] - February 2026 — Wizard Listener Debounce
### Session Timer Fix (Root Cause)
- `render()` and every caller (handleBulkLogNext, Back, GPS return, etc.) both scheduled `attachBulkLogWizardListeners()` via separate setTimeouts
- Both fired at ~50ms → TWO click handlers on the timer button
- Click Start → Handler 1 starts timer → Handler 2 immediately pauses it → timer appears broken

### Solution: `scheduleWizardListeners()`
- New debounced method: `clearTimeout` + `setTimeout(attach, 60ms)`
- ALL callers now use `this.scheduleWizardListeners()` instead of direct `setTimeout(() => this.attachBulkLogWizardListeners(), 50)`
- Multiple calls within 60ms collapse to a single attachment — no double handlers
- `closeBulkLogWizard()` clears the pending timer to prevent stale attachment after close

## [9.4.9] - February 2026 — Wizard Step Double-Fire Fix
### Root Cause
- Global delegated handler (document click) AND `attachBulkLogWizardListeners()` both attached handlers for Close, Cancel, Back, and Next buttons
- v9.4.8 made `render()` call `attachBulkLogWizardListeners()` every time wizard was open, guaranteeing double handlers
- One click on Next → `handleBulkLogNext()` fired twice → step 2→3→4 → empty wizard with green checkboxes

### Fix
- Removed Close, Cancel, Back, Next handlers from `attachBulkLogWizardListeners()` — global delegated handler already covers these
- Added `if (bulkLogStep >= 3) return` guard in `handleBulkLogNext()` as safety cap
- Added `if (bulkLogStep <= 1) break` guard in Back handler

## [9.4.8] - February 2026 — Session Timer Fix
### Timer Display Fix
- Bulk session timer `setInterval` callback now uses fresh `document.getElementById('bulkSessionDurationDisplay')` lookups instead of stale closure references
- Reset handler also uses fresh DOM lookups
- Matches the pattern used by the working single-player timer

### Wizard Listener Re-Attachment
- `render()` now calls `attachBulkLogWizardListeners()` via setTimeout when wizard is open
- Previously, if any render fired while wizard was on step 3, all wizard buttons (timer, submit, cancel, back) became unresponsive because listeners were only attached from specific callers, not from render itself

## [9.4.7] - February 2026 — Single Submit + Auto-Fill Host Wizard
### Live Scoreboard: One "Send All Scores" Button
- Replaced per-player Submit buttons with single "📤 Send All Scores to Host" button at bottom
- Collects all entered scores and sends them to the live_sessions Firestore doc in one batch
- Subtitle clarifies: "Host will review and save the final activity"

### Auto-Fill Host Wizard from Live Scores
- When non-host sends scores, host's wizard inputs auto-fill in real-time (green borders)
- `handleLiveSessionUpdate` triggers `autoFillWizardFromLiveScores()` when host is on wizard step 3
- Tracks already-notified players to avoid duplicate toasts ("📥 1 score received from players!")
- Host still clicks Submit in wizard to actually save the activity — scores are just pre-filled

### Correct Flow
- Non-host: Enter scores → Send All → writes to live_sessions doc only
- Host: Sees auto-filled inputs (green) → Reviews → Hits Submit → Creates actual activity records
- Previous bug: non-host Submit toast said "saved" but only wrote to live_sessions, not actual records

## [9.4.6] - February 2026 — Live Session Cleanup Fix
### Session Now Properly Closes on Host
- `endLiveSession()`: Clears `liveSessionId` and `activeLiveSession` state IMMEDIATELY before awaiting Firestore update — prevents race where listener re-sets state
- `closeBulkLogWizard()`: Now explicitly clears `liveSessionId`, `activeLiveSession`, force-removes banner DOM, and closes scoreboard modal if open
- Score listener (`listenToLiveSessionScores`): Now checks session status — if 'completed' or 'abandoned', auto-closes scoreboard and clears state instead of re-setting `activeLiveSession`
- Non-host auto-cleanup: When host ends session, non-host's scoreboard auto-closes with status check

## [9.4.5] - February 2026 — Non-Host Scores All Players
### Live Scoreboard: Score for Everyone
- Non-host players now see score inputs for ALL unscored players, not just themselves
- Each player row gets its own Submit button with per-player data attributes
- Host still scores everyone through the wizard; host sees "Waiting..." in scoreboard for unscored players
- Toast confirms which player's score was submitted: "Score submitted for John!"

## [9.4.4] - February 2026 — Live Session Fixes
### Banner Persistence
- Live banner now re-inserts itself after every `render()` call — previously destroyed when DOM rebuilt
- Fixed hide condition to check both `showBulkLogWizard` and `showBulkLogModal` for host

### Non-Host Player Scoring
- Non-host players now see inline score inputs (makes/attempts or game score) in the live scoreboard instead of just "Waiting..."
- Submit button writes scores directly to Firestore via `RealTimeManager.updateLiveSessionScores()`
- Validation: makes cannot exceed attempts, all fields required
- After submission, row switches to read-only score display in real-time
- Styled inputs with purple borders, dark mode support, mobile-responsive wrapping

### Removed Live Toast
- Removed the "Live Session Started!" toast notification when another player starts a session
- Banner alone provides sufficient notification without being intrusive

## [9.4.3] - February 2026 — GPS Distance Tool in Multiplayer Wizard
### GPS Button Added to Wizard Step 3
- Added 📡 GPS button next to the distance input in the multiplayer log wizard's session scoring step
- Uses `_gpsReturnToBulkWizard` flag so GPS tool returns the measured distance to the wizard's distance field
- GPS close (✕) also properly returns to the wizard and re-attaches wizard event listeners
- Button wired into global delegated click handler for mobile resilience

## [9.4.2] - February 2026 — Multiplayer Wizard Freeze Fix & Input Enlargement
### Critical Fix: Wizard Freeze on Mobile
- Real-time Firestore listeners (challenge alerts, friend requests, pending items) were calling `this.render()` while the wizard was open, destroying all button event listeners and making the wizard unresponsive
- Added `!this.state.showBulkLogWizard && !this.state.showBulkLogModal` guards to all 6 real-time handlers that trigger renders
- Added global delegated click handler in `initializeApp()` for wizard Close (✕), Cancel, Next, and Back buttons — these now survive any DOM rebuilds as a safety net

### Enlarged Score Inputs
- Makes/Attempts inputs: width 80px→100px, padding 0.5rem→0.75rem, font-size 1rem→1.25rem, font-weight 600, border 2px with rounded corners
- Game score inputs: width 120px→140px, same enlargement pattern  
- Mobile: inputs now 1.4rem font, 0.875rem padding, min-height 52px for easy thumb tapping
- Score divider (/) enlarged to 1.5rem bold
- Input labels enlarged to 0.85rem with 600 weight
- Focus rings widened from 0.1→0.2 opacity for better visibility

## [9.4.1] - February 2026 — GPS Distance Tool Accuracy Refinements
### Multi-Sample Basket Positioning
- Basket location now collected from **6 GPS samples** instead of a single reading
- Best 3-4 samples (by accuracy) are averaged to establish the basket position
- Samples with accuracy worse than 8m (~26ft) are filtered out
- Progress indicator shows good/total samples during collection: "Samples: 2/3 good (4/6 total)"
- 12-second safety timeout prevents infinite wait on poor signal

### Rolling Median Filter for Tracking
- Live distance now uses a **5-sample rolling median** instead of raw GPS values
- Median filtering rejects outlier readings (GPS spikes) far better than averaging
- Result: distance display is much more stable and consistent

### Accuracy Gating
- Tracking rejects readings with accuracy worse than 12m (~39ft) instead of displaying bad data
- Shows "Poor signal — waiting for better fix..." when readings are rejected

### Visual Accuracy Indicator
- Color-coded accuracy display replaces plain text:
  - 🟢 Excellent (≤10ft / ≤3m)
  - 🟡 Good (≤20ft / ≤6m)  
  - 🟠 Fair (>20ft) with "stand still" tip
  - 🔴 Poor signal (rejected reading)

### Other Improvements
- `maximumAge: 0` on tracking forces fresh GPS readings every time (was 1000ms)
- Updated tips text with guidance about clear sky and waiting for green accuracy
- Tracking buffer cleared on reset/close to prevent stale data on re-open

## [9.4.0] - February 2026 — Real-Time Live Updates
### Challenge Alerts (Feature 1)
- **Real-time H2H challenge notifications**: When someone challenges you, you see a toast immediately without refreshing
- **Real-time friend challenge notifications**: Friend challenges appear as live toasts with challenge description
- **Real-time friend request alerts**: Friend requests trigger instant toast notifications
- All alerts update the notification badge count in real-time

### Live Score Feed (Feature 2)
- **Live scoring indicator**: When someone starts scoring for you in the multiplayer wizard, you see a toast: "X started scoring Activity with you!"
- **Pending activity toasts**: Already existed, now enhanced with live session context

### Shared Live Sessions (Feature 3)
- **🔴 LIVE banner**: When a multiplayer scoring session starts with 2+ players, a red "LIVE" banner appears at the top of all participants' screens
- **Live scoreboard modal**: Tap the banner to see a real-time scoreboard showing all players and their scores updating live
- **Debounced score sync**: As the host enters scores, they're pushed to Firestore every 1.5 seconds so other players see updates in real-time
- **Host indicator**: Live scoreboard shows who is hosting the session
- **Auto-cleanup**: Stale live sessions (2+ hours old) are automatically cleaned up
- **Firestore `live_sessions` collection**: New collection with rules for authenticated users

### Infrastructure
- New Firestore collection: `live_sessions` with security rules
- `RealTimeManager` class expanded from 4 to 11 listeners
- Static methods for creating, updating, and ending live sessions
- First-snapshot detection prevents toast spam on page load
- Known ID tracking prevents duplicate notifications
- New toast types: `challenge` (amber) and `live` (red) with custom styling
- Full dark mode support for all live session UI

## [9.3.9] - February 2026
- **Removed**: Disc/putter selection from all scoring screens (session, routine, game - both single and multiplayer)
- **Removed**: Notes textarea and quick-note weather buttons from all scoring screens
- **Reason**: Weather is now auto-tracked by zip code, disc and notes were rarely used and added clutter
- **Cleanup**: Removed unused `favoritePutter`/`recentDiscs` variable declarations, dead quick-note-btn event listeners, disc/notes fields from Firestore save objects
- Historical sessions with disc/notes data still display correctly in session history

## [9.3.8] - February 2026
- **UX Overhaul**: Streamlined multiplayer wizard from 4 steps to 3
  - Step 1 (Players): Current user now pre-selected by default
  - Step 2 (Activity): Replaced 7 activity type cards with 3 clean tabs (Session, Routine, Game)
  - Routine tab shows unified list of built-in, custom, and community routines with source badges
  - Game tab shows unified list of built-in, custom, and community games with source badges
  - Session tab shows quick info, proceeds directly to score entry
  - Step 3 (Score): Same scoring UI, now reached in 2 taps instead of 3
- **Removed**: Old step 3 (separate selection screens for each routine/game type) - merged into step 2
- **Removed**: Old step 4 router (renderBulkLogStep4Score) - now handled by step 3 router
- **Style**: Added tab styles with dark mode support, source badges (Built-in/My/Community)

## [9.3.7] - February 2026
- **Feature**: Per-user timezone support across app and MCP server
  - Timezone dropdown in Profile → Location & Weather section
  - Explains that timezone is used for daily/weekly challenge tracking and streak calculations
  - Auto-detects timezone from browser on first login and saves to Firestore
  - If user selects "Auto-detect", falls back to `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Fix (MCP)**: Replaced all hardcoded Arizona (UTC-7) timezone calculations with user-specific timezones
  - Reads `user.timezone` field (defaults to `America/Phoenix`)
  - All admin tools (recalc_stats, audit_achievements, get_challenges, fix_daily, fix_weekly) now use user's timezone
  - `getTodaysActivities` dynamically calculates UTC day boundaries per user's timezone
  - `calculateUserStreak` now accepts timezone parameter
  - Supports all US timezones including DST-observing ones via `Intl.DateTimeFormat`
  - Removed `ARIZONA_OFFSET_HOURS` constant and all `getArizona*` helper functions

## [9.3.6] - February 2026
- **Fix**: Daily challenge progress showing stale inflated values (e.g. 77 instead of 49)
  - Root cause: `Math.max` guard in `checkDailyChallengeProgress` and `recalculateDailyChallenge` prevented progress from ever decreasing, locking in values from the UTC timezone bug
  - Removed `Math.max` guard - progress now reflects actual recounted values
  - `getDailyChallenge` now recalculates progress on load for accumulation-type challenges (volume, consistency, distances) to fix stale stored values

## [9.3.5] - February 2026
- **Fix**: Season level not matching XP - rewards showing locked despite having enough XP
  - `getSeasonProgress` now recalculates level from XP on every read
  - Fixes stale `level` field caused by recalc_stats or manual XP adjustments
  - Auto-corrects and saves the fixed level back to Firestore
- **Fix (MCP)**: `recalc_stats` now also fixes season `level` and `activitiesCompleted`
  - Previously only updated `xp` field, leaving `level` stale and counters at 0
  - Now writes correct level, practiceSessions, routines, games, dailyChallenges, h2hWins, achievements
  - Report now shows season level and activitiesCompleted comparison table

## [9.3.4] - February 2026
- **Fix**: Season level reward "Claim" buttons now work on mobile
  - Removed nested scroll container (.reward-tiers max-height) that blocked touch events
  - Reward tiers now scroll with the full modal instead of a separate inner scroll
  - Increased claim button touch targets to 44px min height for mobile taps
  - Added touch-action: manipulation to prevent double-tap zoom delays

## [9.3.3] - February 2026
- **UI Fix**: Multiplayer Log Step 3 player scores no longer cramped on mobile
  - Player name/avatar and Makes/Attempts inputs now stack vertically on small screens
  - Added proper base styles for score-input-group and score-divider
  - Inputs stretch to full width for easier tap targets

## [9.3.2] - February 2026
- **MCP Server Fix**: All date/time calculations now use Arizona time (UTC-7) instead of UTC
  - `getTodaysActivities` — was pulling activities from previous day due to UTC "today" being 7 hours ahead
  - `isTargetDay` — removed overly generous 36-hour tolerance window, now uses strict Arizona day boundaries
  - `fix_daily_challenge` / `get_challenges` — "Today" checks now match Arizona local time
  - Streak calculation, season XP leaderboard, season info, weekly challenge — all fixed
  - Added `getArizonaNow()`, `getArizonaTodayString()`, `getArizonaTodayISO()` helper functions
- MCP version bumped to 9.3.1

## [9.3.1] - February 2026
- **Fix**: Season XP not awarded when accepting bulk-logged routines and games
  - `acceptPendingRoutine` now calls `awardSeasonXp('completeRoutine')`
  - `acceptPendingGame` now calls `awardSeasonXp('playGame')`
  - Sessions already had this, routines and games were missing it

## [9.3.0] - February 2026
- **Critical Fix**: Custom routines and games not included in loaded stats
  - Root cause: `getRoutineCompletions` and `getGameCompletions` used Firestore `orderBy('endTime')` which **silently excludes** documents without an `endTime` field
  - Custom routines, older completions, and any activities saved through paths that didn't set `endTime` were invisible to the app
  - Removed `orderBy` from both queries — now fetches all docs and sorts in JavaScript
  - Increased limit from 50 to 100 to capture more activity history
- **Fix**: `calculateAllActivitiesStats` now falls back to `drillScores` when `totalStats` is missing on a routine
- Affects: Stats page, streaks, challenge progress, achievement checks — anywhere loaded routines/games are used

## [9.2.9] - February 2026
- **Critical Fix**: Points and stats not being saved when accepting bulk-logged activities
  - Root cause: `checkDailyChallengeProgress()` and `completeChallenge()` were overwriting freshly-saved stats with stale cached user data
  - Accept methods now reload user cache before triggering challenge updates
  - Challenge functions now use `updateUser()` partial updates instead of `saveUser()` full overwrites
  - Prevents `firebase.firestore.FieldValue.increment()` race conditions on totalPoints, completedChallenges, dailyChallengesCompleted
- Affects: `acceptPendingSession`, `acceptPendingRoutine`, `acceptPendingGame`

## [9.2.8] - February 2026
- **Fix**: Week starts Monday at midnight throughout the app (coaching "This Week" was using Sunday)
- Days remaining calculation updated for Monday-based weeks
- Challenges module already used Monday — now consistent everywhere

## [9.2.5] - February 2026
- **Fix**: Removed protection.js script entirely (was blocking app initialization)
- **Fix**: Added self.skipWaiting() to service worker to force cache updates
- **Debug**: Added visible error overlay to catch JS errors on screen

## [9.2.4] - February 2026
- **Fix**: Protection script changed to `defer` loading — was blocking Firebase SDK from initializing

## [9.2.3] - February 2026
- **Fix**: Removed Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers that blocked Firebase SDK CDN loading and Auth popups
- **Fix**: Removed `debugger` statement from protection.js that could freeze the page
- **Fix**: Added master try-catch to protection.js so it can never block app loading
- **Fix**: Reverted X-Frame-Options to SAMEORIGIN for Firebase Auth compatibility

## [9.2.2] - February 2026
- **Simple Scorer**: New quick-entry mode for fast putting practice tracking
  - Full-screen overlay with distance selection (10/15/20/25/30/33/40/50ft) color-coded by zone
  - Large MAKE/MISS tap buttons designed for one-handed use on the course
  - Live score counter, accuracy percentage, and visual putt dot tracker
  - Auto-starting session timer with pause/resume
  - Green/red flash feedback on each putt
  - Undo button for corrections
  - Sessions save through full pipeline: points, weather, challenges, achievements, leaderboard, season XP
  - Sessions tagged with "Simple Score" notes field
  - GPS Distance integration from Simple Scorer distance select screen
  - Summary screen shows points earned, accuracy, and putt replay dots
  - "New Session" to immediately start another, or "Done" to return
- **Bug Fix**: Session notes and disc fields now properly saved to Firestore (previously destructured but not included in session object)

## [9.2.0] - February 2026
- **CRITICAL BUG FIX**: Friend challenges and H2H challenges never auto-completed because code checked `endTime` field but challenges store expiration as `expiresAt` — `new Date(undefined)` always returned Invalid Date so expiration check always failed
- Fixed both `updateChallengeScore()` and H2H equivalent in storage.js to use `expiresAt || endTime`
- Added `checkExpiredChallenges()` that runs on page load to auto-complete any expired active challenges with toast notifications showing the winner
- Added countdown timers to ALL challenge types: Daily (countdown to midnight), Weekly (countdown to end date), Friend challenges (countdown to expiresAt), H2H challenges (countdown to expiresAt)
- Timers show "Xd Xh" format for >1 day, "Xh Xm" for <1 day, "Xm" for <1 hour
- Live countdown updates every 60 seconds via `startChallengeCountdownTimer()` interval
- Auto-triggers reload when a challenge expires while user is viewing
- **NEW FEATURE**: GPS Distance Tool — measure putting distance using phone GPS
  - "📡 GPS" button next to distance input in Add Session form
  - Step 1: Stand at basket pole, tap "Set Basket Location" to capture GPS coordinates
  - Step 2: Walk to putting spot — live distance updates via `watchPosition`
  - Shows distance in feet with zone labels (Tap-in, C1 Inner, Circle 1, Circle 2, Long Range)
  - Color-coded zones match disc golf putting circles
  - Shows GPS accuracy reading
  - "Use Xft" button auto-fills the session distance field
  - Uses Haversine formula for accurate GPS distance calculation
  - High-accuracy GPS mode with proper error handling for permissions, availability, timeouts
- Fixed stats page "Total Points" click showing current user's activities instead of the searched player's activities
- `renderRecentPracticeForStats()` now checks `searchedPlayer` state in addition to `showLeaderboardPlayerPractice`
- Recent Practice section header now shows the player's name (e.g., "John's Recent Practice") like Achievements already does

## [9.1.9] - February 2026
- Fixed native Google Sign-In to use Capacitor plugin bridge correctly
- Added server_client_id to Android strings.xml
- Removed broken redirect/import approaches

## [9.1.8] - February 2026
- Native Google Sign-In via @codetrix-studio/capacitor-google-auth plugin
- Uses native account picker on Android/iOS instead of browser redirect
- Falls back to popup on web, redirect if plugin unavailable

## [9.1.7] - February 2026
- Fixed Google Sign-In for Capacitor native apps (redirect instead of popup)
- Handle redirect result on app init for native platforms
- Fixed routine_completionist achievement description to match logic
- Added Capacitor build scripts (build-cap.bat, build-cap.sh)
- Updated capacitor.config.json webDir to "www"

## [9.1.6] - February 2026

### 🛡️ Data Integrity & Achievement System Improvements

**Fixed all 5 critical issues identified during user audit:**

#### Issue 1: Twice is Nice Achievement Logic
- Fixed boolean parameter handling in MCP server (`award_missing`, `revoke_invalid`)
- Parameters now correctly handle both boolean and string values from MCP calls
- Fixed report showing stale achievement counts after changes

#### Issue 2: Missing Achievement Point Values
- Added 25+ missing achievements to MCP `ACHIEVEMENT_POINTS`:
  - Routine completions: `beginner_10ft`, `beginner_form_focus`, `beginner_consistency`, etc.
  - Game completions: `horse`, `around_the_world`, `par_game`, `points_poker`, `joes_monday_night`
  - Intermediate/Advanced/Expert routines
  - Special achievements: `founder`, `community_contributor`

#### Issue 3: Recalculated Remaining Users
- Fixed Chloe Waugaman: 125 → 225 pts (+100)
- Verified all hidden accounts

#### Issue 4: Automated Integrity Checks
- Added `weeklyIntegrityCheck` scheduled Cloud Function
  - Runs every Sunday at 3am (America/Phoenix timezone)
  - Audits all users for point/stat discrepancies
  - Stores results in `system/integrityChecks` document
  - Checks: point mismatches, activity count mismatches
- Added `integrityCheckApi` HTTP endpoint
  - GET: View last integrity check results
  - POST: Trigger manual check (requires admin key)

#### Issue 5: Single Source of Truth
- Created `shared/achievement-points.json` as canonical source
- Created `shared/sync-achievement-points.js` sync script
- Updated sync comments in MCP server

---

## [9.1.5] - February 2026

### 🔧 MCP Server Achievement Points Sync

**Fixed:** Achievement point discrepancies between client and MCP server

#### Issue Identified
- Client (constants.js) and MCP server (index.ts) had different point values for achievements
- Example: "Committed" showed 200 pts in UI but MCP calculated it as 100 pts
- **121 achievements** had mismatched values
- **42 achievements** were missing from MCP server

#### Resolution
- Created unified `ACHIEVEMENT_POINTS` constant at global scope in MCP server
- Synced all 192 achievement values from client `constants.js`
- Removed duplicate local `ACHIEVEMENT_POINTS` definitions in `recalc_stats` and `audit_achievements` functions
- Added sync comments for future maintenance

#### Key Value Corrections
| Achievement | Old MCP Value | Correct Value |
|-------------|---------------|---------------|
| committed | 100 | 200 |
| veteran | 300-500 | 500 |
| legend | 1000-2000 | 2000 |
| daily_grinder | 1500-2000 | 1500 |
| challenge_champion | 750 | 300 |
| century_match | 1000 | 200 |

---

## [9.0.0] - February 2026

### 🎉 Major Release: E2E Testing Suite + Achievement System Fixes

**Version 9.0.0** marks a major milestone with comprehensive automated testing and critical bug fixes.

#### E2E Testing Suite (Playwright)
- Full automated testing coverage for all app features
- Test credentials: `johnwaug@hotmail.com` / `nov301`
- 80+ automated tests covering:
  - App loading & authentication
  - Practice sessions & routines
  - All 10 putting games
  - Stats & charts
  - Leaderboards (points, ELO, season)
  - Achievements & challenges
  - PWA features

**Test Commands:**
```bash
npm install && npx playwright install
npm test                 # Run all tests
npm run test:headed      # Watch browser
npm run test:ui          # Interactive mode
```

#### Achievement Bug Fixes (from 8.9.30)
1. **Game On** - Now requires completing a game (was: viewing tab)
2. **Hidden Users** - No longer earn leaderboard achievements
3. **Rising Star** - Properly implemented (10% accuracy improvement over 10 sessions)
4. **Point values** - Synchronized across app and MCP server

#### UI Fix (from 8.9.31)
- **Leaderboard names** - Increased mobile width from 100px to 150px

#### Full User Audit Completed
- 51 users audited
- 41 invalid achievements revoked
- 16 missing achievements awarded
- All user stats recalculated

---

## [8.9.31] - February 2026

### Leaderboard Player Name Width Fix

**Issue:** On mobile, player names in the Points Leaderboard were being truncated too aggressively (e.g., "John Wauga...", "Step...", "Ron ...").

**Fix:** Increased the `max-width` for `.elo-player-details .player-name` from 100px to 150px in mobile responsive styles, allowing more characters of the username to be visible.

**File:** `css/phase5.css`

### E2E Testing Suite Added

Comprehensive Playwright-based end-to-end testing suite for automated app testing.

**New Files:**
- `playwright.config.ts` - Test configuration
- `tests/e2e/auth.setup.ts` - Authentication setup
- `tests/e2e/helpers.ts` - Test utilities
- `tests/e2e/app.spec.ts` - Full app tests
- `tests/e2e/practice.spec.ts` - Practice tab tests  
- `tests/e2e/games.spec.ts` - Games tests (all 10 games)
- `tests/e2e/achievements.spec.ts` - Achievements & challenges tests
- `tests/README.md` - Testing documentation

**Test Commands:**
```bash
npm install && npx playwright install  # Setup
npm test                                # Run all tests
npm run test:ui                         # Interactive UI mode
npm run test:headed                     # See browser
npm run test:debug                      # Debug mode
```

**Coverage:**
- App loading & navigation
- All practice features (sessions, routines)
- All 10 games
- Stats & charts
- Leaderboards
- Daily/weekly challenges
- Achievements
- Profile & settings
- PWA features
- Error handling

## [8.9.30] - February 2026

### Achievement Bug Fixes

**Bug 1: Game On Achievement Awarded Without Playing Games**
- **Issue:** Users received "Game On" achievement just for viewing the Games tab, not for completing a game
- **Fix:** Removed auto-award on tab view; now only awards when user completes at least one game
- **Affected Code:** `js/app.js` (removed tab view award), `js/modules/achievements.js` (added proper check)

**Bug 2: Leaderboard Achievements Awarded to Hidden Users**
- **Issue:** Users with `hideFromLeaderboard: true` were still receiving leaderboard achievements (Podium Finish, Top 5/10/20, Number One)
- **Fix:** 
  - Updated `getUserRank()` to optionally filter hidden users
  - Hidden users now get rank -1 (preventing achievement awards)
  - Added revalidation to revoke leaderboard achievements when user becomes hidden
- **Affected Code:** `js/utils/calculations.js`, `js/modules/achievements.js`

**Bug 3: Rising Star Achievement Never Implemented**
- **Issue:** "Rising Star" (Improve accuracy by 10% over 10 sessions) was never properly implemented - the check was commented out
- **Fix:** Implemented proper check that:
  - Requires at least 10 sessions
  - Compares average accuracy of first 3 sessions vs last 3 sessions
  - Awards if improvement is ≥10%
  - Added revalidation logic
- **Affected Code:** `js/modules/achievements.js`

## [8.9.29] - February 2026

### Removed Points Leaderboard Scrollbar

Removed the `max-height: 600px` and `overflow-y: auto` styles from the `.leaderboard-list` container that was causing a scrollbar on the right side of the points leaderboard. Now matches the ELO and Season leaderboards which don't have internal scrolling.

## [8.9.28] - February 2026

### Fixed MCP Achievement Points Bug

**Bug:** The `committed` achievement was incorrectly valued at 200 pts in the `handleAdminRecalcStats` function, while the correct value is 100 pts (as defined in `handleAdminAuditAchievements`).

**Root Cause:** Two separate `ACHIEVEMENT_POINTS` maps exist in the MCP server with inconsistent values.

**Fix:** Updated `committed: 200` → `committed: 100` in the recalc function.

**Affected Users:** 8 users who received only the Committed achievement during the audit had incorrect points (200 instead of 100). These need to be recalculated after deployment.

## [8.9.27] - February 2026

### MCP Admin Tools - List Users & Reset User

Added two new admin tools to the MCP server:

**putting_admin_list_users:**
- Lists all users with basic stats (points, activities, achievements)
- Shows which users are hidden from leaderboard
- Can filter to show only hidden users
- Sorted by points descending

**putting_admin_reset_user:**
- Completely resets a user to fresh state
- Deletes all sessions, routines, games
- Resets all stats to zero (points, XP, achievements, streaks)
- Preserves identity fields (name, email, profile pic, friends)
- Requires `confirm=true` as safety measure
- Useful for test accounts like "waugs test"

## [8.9.26] - February 2026

### Fixed Season Modal Title Visibility in Light Mode

**Bug:** Season modal title "Season 1 2026" was invisible in light mode because the dark text color (`#1f2937`) from base `.modal-header h3` was overriding the white color intended for the purple gradient background.

**Fix:** Added specific styles for `.season-header h3` with `color: white !important` to ensure visibility. Also styled the close button for better contrast on the purple background.

## [8.9.25] - February 2026

### Leaderboard Pagination - Show First 20

All three leaderboards (Points, ELO, Season XP) now display only the first 20 players initially with a "Show More" button to reveal the rest.

**Changes:**
- Points leaderboard: Shows first 20, button shows "Show X More Players"
- ELO leaderboard: Shows first 20, button shows "Show X More Players"  
- Season XP leaderboard: Shows first 20, button shows "Show X More Players"
- "Show Less" button appears when expanded to collapse back to 20
- State resets to collapsed when switching between tabs

**Styling:**
- Purple gradient "Show More" button
- Gray gradient "Show Less" button
- Hover effects with subtle lift and shadow
- Dark mode compatible

## [8.9.24] - February 2026

### Points Leaderboard Style Update

Updated points leaderboard to match the clean horizontal style of ELO and Season leaderboards while keeping all existing data fields:

**Visual Changes:**
- Uses same `.elo-leaderboard-item` layout as ELO/Season tabs
- Stats displayed in two right-aligned columns (Points | Total Activities)
- Cleaner horizontal layout with consistent spacing
- Join order badge and achievements badge inline with player name
- Compact challenge button for friends

**Data Fields Preserved:**
- Rank with medal colors (gold/silver/bronze)
- Profile picture with placeholder
- Player name (clickable)
- Join order badge (🌱 #X)
- Achievements count (🏅 X)
- Primary stat (Points/Sessions/Routines/Games based on category)
- Total Activities with hover tooltip showing breakdown
- Challenge button for friends

**Responsive:**
- Mobile-optimized with smaller text and appropriate spacing
- Stats columns remain visible on mobile

## [8.9.23] - February 2026

### Fixed Weekly Challenge Display

**Bug:** Weekly challenge card showed mismatched data:
- Description: "Make 2+ putts from 40+ feet"  
- Target: "40 makes from 30+ feet"

**Root Cause:** For distance challenges, `challenge.target` = distance (40ft), `challenge.makes` = required makes (2). But `getChallengeTargetText()` was using `target` as the number of makes.

**Fixes:**
1. **`getChallengeTargetText()`** - Now correctly handles all 22 challenge types from CHALLENGE_TYPES
2. **`getChallengeProgress()`** - Now correctly calculates progress for all challenge types including:
   - Distance challenges use `challenge.makes` as the target
   - Volume challenges include routines and games, not just sessions
   - Streak challenges count unique practice days
   - All new challenge types: accuracy_sustained, accuracy_average, perfect_session, distance_variety, long_range_total, volume_daily, volume_single, weekend_warrior, weekday_grinder, double_session, points_weekly, routines, games, variety, all_rounder

**Result:** "Distance Master" now correctly shows "Target: 2 makes from 40+ feet"

## [8.9.22] - February 2026

### Fixed MCP User Lookup Logic

**Bug:** Searching for "CK" returned "Dick Gogin" because the partial match used `.includes()` which matched "ck" inside "Dick".

**Fix:** Implemented smarter matching priority:
1. **Exact match** (case-insensitive) - highest priority
2. **Starts with** - e.g., "Ron" matches "Ron Smith"
3. **Word boundary** - search term must be a complete word (regex `\b`)
4. **Contains** - only if search term is 3+ characters

Also added secondary sort by name length (shorter names preferred) when multiple candidates have same priority.

**Result:** "CK" now correctly finds the user named "CK", not "Dick Gogin".

## [8.9.21] - February 2026

### Fixed Weekly Challenge Stability

**Bug:** Weekly challenge would change unexpectedly within the same week.

**Root Cause:** The `startDate` was stored as an ISO UTC timestamp, but different timezones would calculate different UTC timestamps for "Monday midnight local time". This could cause the challenge to appear as "from last week" when checked from a different timezone.

**Fix:**
- Added `weekDate` field storing the local date string (e.g., "2026-02-02") for reliable comparison
- Changed comparison to use date strings instead of timestamps
- Added double-check safeguard in `createNewChallenge()` to prevent overwriting existing valid challenges
- Added detailed logging to track challenge lifecycle

**Result:** Weekly challenges now remain stable regardless of user timezone or when they access the app.

## [8.9.20] - February 2026

### Fixed More Faulty Achievement Checks

Disabled/fixed additional achievement checks that were incorrectly awarding achievements:

| Achievement | Problem | Fix |
|-------------|---------|-----|
| `triple_perfect` | Didn't check sessions were consecutive by DATE | Disabled - MCP handles |
| `accuracy_climb` | Used 20% diff (wrong criteria) | Disabled - MCP handles |
| `daily_hundred` | Only checked sessions, not all activities | Disabled - MCP handles |
| `birthday_putts` | Could match dates before account creation | Disabled - MCP handles |
| `coach` | Checked total sessions instead of unique players | Fixed to use `bulkLogStats.uniquePlayersLogged` |

Also fixed viewing other player's achievements on stats page.

## [8.9.19] - February 2026

### Fixed Viewing Other Player's Achievements

**Bug:** When viewing another user's stats page and clicking "Achievements", it showed YOUR achievements instead of theirs.

**Fix:**
- `renderAchievementsForStats()` now checks `searchedPlayer` and `showLeaderboardPlayerPractice` state
- `loadOtherPlayerStats()` now fetches the other player's achievements from their user document
- Achievement header now shows "[PlayerName]'s Achievements" instead of always "Your Achievements"

## [8.9.18] - February 2026

### Fixed App Achievement Logic

**Fixed incorrect achievement awarding that caused achievements to be re-added after MCP revoke:**

| Achievement | Bug | Fix |
|-------------|-----|-----|
| `rising_star` | Awarded for top 50 rank | Disabled - requires complex session analysis (MCP handles) |
| `data_enthusiast` | Required 1 export | Fixed to require 10 exports |
| `coach` | Required 5 sessions | Fixed to require 10 different players |
| `first_competitor` | Required 1 multiplayer | Fixed to require H2H completion |
| `team_player` | Duplicate check with wrong criteria | Disabled duplicate - bulk log check is correct |

This prevents the app from incorrectly re-awarding achievements that were properly revoked by MCP audit.

## [8.9.17] - February 2026

### Complete Achievement System Fixes

**Added Special Achievements to App (constants.js):**
- `founder_1` (500 pts) - Early supporter achievement
- `community_1` (250 pts) - Community contributor achievement
- **App Achievement Count:** 195 (was 193)

**Fixed Achievement Display Consistency:**
- "Your Achievements" header now shows dynamic count (X/195) instead of hardcoded /194
- Stats tab achievements section now shows dynamic count
- Leaderboard user cards show achievement count correctly

**Added Special Achievements to MCP:**
- `founder_1` and `community_1` now tracked in MCP audit
- **MCP Achievement Count:** 221

**Fixed Root Cause - Leaderboard Rank Tracking:**
- Now tracks best rank for ALL three leaderboard types (Points, ELO, Season)
- Previously only tracked Points leaderboard rank
- Each leaderboard type updates its respective field (bestPointsRank, bestEloRank, bestSeasonRank)
- Fixed updateBestLeaderboardRank() to use correct leaderboard array for each type

## [8.9.16] - February 2026

### MCP Achievement Audit - Untracked Detection

**Added untracked achievement detection:**
- Now reports achievements in user's data that aren't in the MCP audit
- Shows the achievement ID so legacy/orphaned achievements can be identified
- Helps identify data cleanup opportunities

## [8.9.15] - February 2026

### MCP Achievement Audit - Complete Coverage

**Added 26 Routine/Game Completion Achievements:**
- 5 Beginner routines: beginner_10ft, beginner_short_game, beginner_form_focus, beginner_circle_1, beginner_consistency
- 6 Intermediate routines: intermediate_mixed, intermediate_ladder_up, intermediate_circle_edge, intermediate_pressure, intermediate_angles, intermediate_comeback
- 6 Advanced routines: advanced_ladder, advanced_long_range, advanced_tournament_prep, advanced_endurance, advanced_all_ranges, advanced_speed_round
- 3 Expert routines: expert_ultimate_test, expert_100_putt_challenge, expert_perfect_practice
- 6 Game completions: around_the_world, horse, ladder_challenge, par_game, points_poker, joes_monday_night

**MCP Achievement Count:** 219 (was 193)

This ensures all achievements can be audited with no "untracked" achievements.

## [8.9.14] - February 2026

### MCP Achievement Audit Improvements

**Friends Subcollection Fix:**
- MCP now fetches friends from `users/{userId}/friends` subcollection
- Previously was looking for `user.friends` array field which doesn't exist
- Fixes false invalids for: first_friend, friendly_rivalry, social_butterfly, friend_magnet, squad_goals, social_network

**Enhanced Audit Report:**
- Now shows **all valid achievements** organized by category
- Added Friends count to Profile Fields
- Added Account Age (days) to Profile Fields
- Full report shows complete picture of user's achievement status

## [8.9.13] - February 2026

### Achievement Tracking Fixes
Implemented automatic tracking for all achievement-related user fields to prevent data gaps.

**Fix 1: Leaderboard Rank Tracking** (`js/app.js`)
- Added `updateBestLeaderboardRank()` method
- Automatically tracks `bestPointsRank`, `bestEloRank`, `bestSeasonRank`
- Called after every `loadLeaderboard()` to capture new best ranks
- Triggers `checkLeaderboardAchievements()` when user achieves new best rank

**Fix 2: Bulk Log Stats Tracking** (`js/app.js`)
- Added `updateBulkLogStats()` method
- Automatically tracks in `bulkLogStats` object:
  - `uniquePlayersLogged` - count of distinct players logged for
  - `totalLogsForOthers` - total activities logged for other players
  - `maxPlayersInSession` - largest multiplayer session size
  - `playersLoggedSet` - array of player IDs for tracking unique players
- Called after every successful bulk log submit
- Triggers `checkBulkLogAchievements()` for team_player, coach, generous_logger, party_host

**Fix 3: Data Download Tracking** (`js/app.js`)
- Now tracks `dataDownloads` count for data_enthusiast achievement
- Incremented each time user exports their data

**Fix 4: User Field Initialization** (`js/modules/user.js`)
- Backfills `createdAt` for existing users (needed for veteran/legend achievements)
- Initializes all tracking fields on login:
  - `dataDownloads` (default: 0)
  - `bestPointsRank` (default: 999999)
  - `bestEloRank` (default: 999999)  
  - `bestSeasonRank` (default: 999999)
  - `bulkLogStats` object with all fields

**New Achievement Methods** (`js/modules/achievements.js`)
- `checkLeaderboardAchievements(rank)` - awards podium_finish, top_five, top_ten, top_twenty, number_one
- `checkBulkLogAchievements(stats)` - awards team_player, coach, generous_logger, party_host

**Impact:** All users will now have proper tracking fields initialized on next login. Future achievement audits will show accurate results.

## [8.9.12] - February 2026

### All Achievements Now Fully Implemented
Removed all `check: (d) => false` placeholders - every achievement now has working logic!

**Bulk Logging Achievements (Social):**
- `team_player`: Log for 5 different friends → checks `user.bulkLogStats.uniquePlayersLogged >= 5`
- `generous_logger`: Log 50 activities for others → checks `user.bulkLogStats.totalLogsForOthers >= 50`
- `coach`: Log for 10 different players → checks `user.bulkLogStats.uniquePlayersLogged >= 10`
- `party_host`: Log multiplayer session with 4+ players → checks `user.bulkLogStats.maxPlayersInSession >= 4`

**Leaderboard Achievements:**
- `podium_finish`: Reach top 3 → checks minimum of `bestPointsRank`, `bestEloRank`, `bestSeasonRank` <= 3
- `top_five`: Reach top 5 → same logic, <= 5
- `top_ten`: Reach top 10 → same logic, <= 10
- `top_twenty`: Reach top 20 → same logic, <= 20
- `number_one`: Reach #1 → same logic, === 1

**Required User Fields for New Features:**
```javascript
user.bulkLogStats = {
  uniquePlayersLogged: number,  // Count of unique players logged for
  totalLogsForOthers: number,   // Total activities logged for others
  maxPlayersInSession: number   // Most players in a single bulk log session
};

user.bestPointsRank = number;   // Best all-time points leaderboard rank
user.bestEloRank = number;      // Best all-time ELO leaderboard rank
user.bestSeasonRank = number;   // Best all-time season leaderboard rank
```

**Achievement Counts:**
- MCP Audit: 203 achievements (100% implemented!)
- App Total: 193 achievements

## [8.9.11] - February 2026

### Achievement Updates
- **Deleted** `speed_runner` achievement (was duplicate of Around the World speed concept)
- **Updated** `joes_regular`: Now "Play Joe's Putting League game 10 times" (checks for games with "joe" in name)
- **Updated** `data_enthusiast`: Download your data 10 times (checks `user.dataDownloads >= 10`)
- **Updated** `beta_tester`: First 30 users with 20+ activities (checks `user.isBetaTester` flag)
- **Updated** `early_adopter`: First 50 users with 100+ activities (checks `user.isEarlyAdopter` flag)
- **Updated** `season_finisher`: Track activities every week of a season (checks `user.seasonFinisher` flag)
- **Updated** `undefeated_week`: No H2H/friend challenge losses in a week with 5+ challenges (checks `user.undefeatedWeek` flag)
- **Updated** `underdog_victory`: Beat player 10+ spots higher on ELO leaderboard (checks `user.underdogVictory` flag)
- **Implemented** `full_moon_putter`: Now calculates actual lunar phase based on session dates

**Achievement Counts:**
- MCP Audit: 202 achievements
- App Total: 193 achievements

## [8.9.10] - February 2026

### Major MCP Achievement Audit Expansion
Expanded MCP admin audit from 95 → **203 achievements** (from 194 total) - now covers **100%** of auditable achievements!

**New Categories Added:**
- **Accuracy (22)**: triple_perfect, consistent_accuracy, finishing_strong, accuracy_climb, rising_star
- **Streaks (11)**: phoenix_rising, comeback_kid
- **Points (8)**: nice (69 pts), lucky_seven, points_surge
- **Sessions (10)**: double_trouble, triple_play, ten_sessions_week, twice_is_nice, quick_session, marathon_session
- **Distance (18)**: mid_range_master, all_ranges, distance_variety, graduated_distances, distance_progression, versatile_putter, range_finder, circle_2_hero, perfect_circle, distance_traveler, distance_champion
- **Volume (9)**: three_hundred_club, five_hundred_club, daily_hundred, volume_increase
- **Routines (16)**: routine_completionist, routine_specialist, ladder_climber, consistency_king, consistency_builder, ladder_master, perfect_routine, routine_speedster
- **Games (24)**: game_sampler, game_master, all_rounder, game_streak, horse_master/warrior/whisperer, around_the_world_champ, atw_traveler, perfect_streak, perfect_ten_legend, par_shooter, par_excellence, poker_king/face/pro, perfect_score, putt_100_master
- **Social (9)**: team_player, generous_logger, coach
- **Competition (7)**: challenge_accepted, first_competitor, century_match, undefeated_week, underdog_victory
- **Time-Based (14)**: early_bird, night_owl, morning_person, afternoon_delight, night_session, sunrise_session, lunch_break_putter, golden_hour, hour_logger, palindrome, hump_day_hero, monday_motivation, weekend_warrior, weekend_streak
- **Special Dates (4)**: new_year_resolution, birthday_putts, holiday_dedication, four_seasons
- **Weather (6)**: heat_wave, cold_blooded, wind_warrior, rain_or_shine, desert_rat, weather_warrior
- **Leaderboard (5)**: podium_finish, top_five, top_ten, top_twenty, number_one
- **Dedication (5)**: daily_grinder, month_complete

**Technical Improvements:**
- Expanded AuditData interface with 12 new computed fields
- Added sessionsByDate, makesByDate, pointsByDate, routinesByDate aggregations
- Added uniqueDistances, uniqueRoutineNames, uniqueGameTypes sets
- Added sessionHours, weekdayCounts, monthDayCounts for time-based checks
- Session/routine/game data now includes timestamps, weather, duration
- Expanded ACHIEVEMENT_POINTS map from 60 → 150+ entries

**Note:** 15 achievements return `false` as they require data not currently tracked:
- Leaderboard rank achievements (need rank query)
- Bulk logging achievements (need bulkLog tracking)
- Location-based achievements (need GPS)
- View tracking achievements (need analytics)

## [8.9.9] - February 2026

### Fixed - Duplicate Achievements
Four achievements had identical requirements to other achievements. Differentiated them:
- `streak_saver`: Changed from 14-day streak → **18-day streak** (fills gap between 14 and 21)
- `no_warmup_needed`: Changed from 10 makes at 100% → **15 makes at 100%** (harder than Perfect 10)
- `routine_machine`: Changed from 3 routines/day → **5 routines/day** (harder than Routine Marathon)
- `desert_rat`: Changed from 50 sessions → **10 hot weather sessions (90°F+)** (Arizona themed!)

### Improved - MCP Achievement Audit Coverage
Expanded MCP admin audit tool from 52 → **95 achievements** (+83% coverage):
- Added: Getting Started, Distance, Volume, Season, H2H/Competition categories
- Added: All streak achievements (3-day through 100-day)
- Added: All point milestones (1K through 100K)
- Added: Account age achievements (committed, veteran, legend)
- Added: Community achievements (feedback, bug reports)

### Improved - Achievement Revalidation Coverage  
Expanded revalidation function from ~40 → **112 achievements** (+180% coverage):
- Now covers: All accuracy, streak, point, session, distance, volume achievements
- Now covers: All routine and game milestone achievements
- Now covers: All time-based achievements (early bird, night owl, weekday, weekend)
- Now covers: Seasonal achievements (four_seasons)
- Documents which achievements are intentionally NOT revocable (social, profile, weather, etc.)

### Updated
- Updated constants.js descriptions for differentiated achievements
- Updated MCP ACHIEVEMENT_POINTS map with all 95 audited achievements
- Updated AuditData interface with uniqueDays and accountAgeDays fields

## [8.9.8] - February 2026

### Fixed
- **UTC Timezone Bug Causing Incorrect Streaks & Dates**
  - **Problem**: App was using `toISOString().split('T')[0]` throughout, which converts to UTC time. For users in western timezones (like Arizona UTC-7), this caused dates to appear as "tomorrow" after 5pm local time, breaking streak calculations and date displays.
  - **Solution**: 
    - Enhanced `getLocalDateString()` helper to accept any date input and always return LOCAL date
    - Added `getYesterdayLocalDateString()` helper
    - Fixed streak calculation in `calculateStreaksFromActivities()` to use local dates
    - Fixed coaching engine `getStreakInfo()` to use local dates
    - Fixed 15+ locations using `toISOString().split('T')[0]` across app.js, user.js, coachingEngine.js
    - Fixed MCP streak calculation to use Math.round() for DST edge cases
  - **Result**: Streaks now correctly reflect user's local timezone

- **Achievement Bug: Week Warrior Not Awarding**
  - **Problem**: `week_warrior` achievement was checking `stats.currentStreak >= 7` instead of `stats.longestStreak >= 7`. If user had a 7+ day streak but current streak was broken, achievement wouldn't award.
  - **Solution**: Changed to check `longestStreak` - once you've ever had a 7-day streak, you've earned it permanently.
  - Also fixed `three_day_starter` achievement with same issue.

### Added
- **ACHIEVEMENTS_AUDIT.md** - Comprehensive audit document covering all 224 achievements:
  - Documents all achievement categories and their check logic
  - Identifies duplicate achievements that could be consolidated
  - Notes MCP audit coverage (52 of 224 achievements)
  - Provides recommendations for future improvements

### Files Modified
- js/app.js - 15+ date fixes, streak calculation fix
- js/modules/user.js - Added local date helper, fixed date fallback
- js/modules/coachingEngine.js - Added local date helpers, fixed getStreakInfo
- js/modules/achievements.js - Fixed week_warrior and three_day_starter to use longestStreak
- functions/src/index.ts - Fixed MCP streak calculation for DST

## [8.9.7] - February 2026

### Fixed
- **Profile Modal Freeze - Background Load Render Conflict**
  - **Root Cause**: The coaching engine takes up to 5 seconds to load. After all background data loads, `render()` was called unconditionally at line 754. If the user opened the profile modal during those 5 seconds, the render would replace the entire DOM, causing the modal to freeze.
  - **Fix**: Skip the post-background-load render if profile modal is open:
    ```javascript
    if (!this.state.showProfileModal) {
        this.render();
    }
    ```
  - Also protected offline/online event handlers from triggering renders while profile modal is open
  - Console log added: `⏭️ Skipping post-background-load render - profile modal is open`

## [8.9.6] - February 2026

### Fixed
- **Profile Modal Freeze Bug (v2 - Complete Fix)**
  - **Root Cause**: Multiple issues causing profile modal to freeze:
    1. Header click listeners not checking if modal already open
    2. `handleAddFriend` and `handleRemoveFriend` were calling `openProfileModal()` again after render, causing duplicate modal opens
    3. Profile modal button event listeners were only attached in `openProfileModal()` setTimeout, so they were lost when `render()` was called while modal was open
  - **Fixes**:
    1. Header profile click now checks `showProfileModal` and `isOpeningProfile` before opening
    2. `openProfileModal` now checks if modal is already shown and skips
    3. Removed redundant `openProfileModal()` calls from `handleAddFriend` and `handleRemoveFriend`
    4. Moved profile modal button event listeners to `attachEventListeners()` so they're reattached on every render
    5. Added `profileModalTimeout` tracking and cleanup to prevent multiple setTimeout handlers
    6. Added comprehensive console logging to track profile modal lifecycle
  - Console logs now show: `🔓 openProfileModal called`, `🔓 Render complete`, etc.

## [8.9.5] - February 2026

### Fixed
- **Profile Modal Freeze Bug**
  - **Bug**: Profile opens, refreshes, then app freezes
  - **Cause**: Realtime database updates were triggering re-renders while profile modal was open, causing race conditions
  - **Fixes**:
    1. Added `isOpeningProfile` flag to prevent duplicate profile opens
    2. Realtime update handlers now skip re-render when profile modal is open
    3. Flag is properly cleared when profile is closed or if error occurs
  - This prevents the freeze that occurred when realtime data came in while profile was loading

## [8.9.4] - February 2026

### Fixed
- **Routines and Games Not Properly Tracked in Friend Challenges**
  - **Bug**: When routines/games were added to challenges, they used a temporary ID like `routine_${Date.now()}`. But when deleting, we used the actual database ID. These didn't match, so deletions couldn't find the session to remove.
  - **Fix**: 
    - `addRoutineCompletion()` now returns the actual completion ID
    - `saveGameCompletion()` now returns the actual completion ID  
    - `addGameScore()` now returns the actual completion ID
    - All game save locations (10 games) updated to capture and use actual IDs
    - All routine save locations updated to capture and use actual IDs
  - Now when you delete a routine or game, it properly removes from friend challenges

## [8.9.3] - February 2026

### Changed
- **Weekly Challenges Now Reset Monday** (User's local time)
  - **Before**: Reset 7 days after creation (inconsistent start days)
  - **After**: Always start Monday at midnight local time
  - New `getWeekStartMonday()` helper function
  - Challenge `startDate` now set to Monday of current week

### Fixed
- **Deleted Sessions Now Recalculate Daily/Weekly Challenges**
  - **Before**: Once completed, challenges stayed completed even if you deleted qualifying activities
  - **After**: Deleting a session rechecks if you still qualify for daily/weekly challenges
  - If no longer qualifying:
    - Challenge is uncompleted
    - Reward points are removed
    - Season XP is removed
    - User is notified
  - New functions:
    - `insightsManager.recheckDailyChallengeAfterDelete()`
    - `challengeManager.recheckWeeklyChallengeAfterDelete()`

## [8.9.2] - February 2026

### Fixed
- **Deleted Sessions Not Removed from Friend Challenges**
  - **Bug**: When a session was deleted, it remained in friend challenge scores
  - **Fix**: Added `removeSessionFromChallenge()` function in storage.js
  - Added `removeSessionFromChallenges()` helper in app.js
  - Now when deleting a session, it's automatically removed from all active friend challenges
  - Challenge scores are recalculated after session removal

## [8.9.1] - February 2026

### Fixed
- **Friend Challenge Sessions Not Recording for All Users** - Debugging and fix
  - **Bug**: In friend challenges, one user's sessions would record but the other's wouldn't
  - **Investigation**: Added comprehensive logging to trace the issue:
    - Logs user ID comparison when updating challenges
    - Logs whether user is `from` or `to` participant
    - Shows challenge participant IDs vs current user ID
  - **Fix 1**: Added `id: doc.id` to `getChallenges()` to ensure challenge IDs are always available
  - **Fix 2**: Added automatic challenge refresh after session is logged so both users see updated scores
  - Console logs now show exactly which field (fromSessions/toSessions) is being updated

## [8.9.0] - February 2026

### Fixed
- **Profile Modal Freeze** - Added error handling to prevent app freeze
  - **Bug**: Profile modal could freeze the app if an error occurred during render
  - **Fix**: Wrapped `renderProfileModal()` in try-catch with fallback error UI
  - If profile fails to load, shows error message with close button instead of freezing

- **Chart.js CDN Blocked by Tracking Prevention** - Charts not loading for some users
  - **Bug**: Browser tracking prevention blocked `cdn.jsdelivr.net` causing Chart.js to fail
  - **Fix**: Switched to `cdnjs.cloudflare.com` CDN with integrity hash
  - Added `crossorigin="anonymous"` and `referrerpolicy="no-referrer"` attributes

### Improved
- **Audit Tool Shows Profile Fields** - Achievement audit now displays profile data
  - Shows favorite putter, midrange, driver
  - Shows gender, birthday, feedback submissions
  - Helps debug why `disc_collector` or `profile_complete` aren't awarding

## [8.8.7] - February 2026

### Fixed
- **Feedback Achievement Not Awarding** - Fixed race condition in form submission
  - **Bug**: `feedback_contributor` achievement (100 pts) wasn't being awarded on Send Feedback
  - **Cause**: Form redirected to FormSubmit before async save/achievement check completed
  - **Fix**: Now uses `e.preventDefault()` + `fetch()` to submit form, then saves stats and checks achievements
  - Shows toast notification when achievement unlocks

### Added
- **Admin Tool: Set Community Stats** - New MCP tool `putting_admin_set_community_stats`
  - Set feedback submissions, bug reports, feature requests for users
  - Automatically awards `feedback_contributor` achievement if applicable
  - Added `feedback_contributor` to MCP audit validation

## [8.8.6] - February 2026

### Fixed
- **Disc Collector Achievement Not Awarding** - Achievement now triggers when saving profile
  - **Bug**: Adding all 3 favorite discs in profile didn't award `disc_collector` achievement
  - **Cause**: `handleProfileSave()` didn't call `checkAchievements()` after saving
  - **Fix**: Now calls `achievementManager.checkAchievements()` after profile save
  - Also validates `disc_collector` and `profile_complete` in MCP audit tool

- **State Field Abbreviation Confusion** - Changed from text input to dropdown
  - **Bug**: Users typed "AR" for Arizona (which is actually Arkansas - Arizona is "AZ")
  - **Fix**: Replaced text input with dropdown showing all 50 states + DC with proper abbreviations
  - Format: "Arizona (AZ)" so users see both name and code

## [8.8.5] - February 2026

### Fixed
- **Stats Flash Fix** - Eliminated brief display of wrong stats on hard refresh
  - **Bug**: On hard refresh, stats showed sessions-only (259/67.1%) before updating to all activities
  - **Cause**: `getStatistics()` calculated from empty arrays before games/routines loaded
  - **Fix**: When games/routines haven't loaded but user has them, use stored `user.totalMakes`/`user.totalPutts`
  - Stats now show correct values immediately on first render

## [8.8.4] - February 2026

### Fixed
- **Stats Display: Auto-Sync on Load** - Fixed stale makes/accuracy showing on dashboard
  - **Bug**: Dashboard showed old stats (259 makes/67.1%) from stored user doc, only counting sessions
  - **Cause**: `user.totalMakes` and `user.totalPutts` in Firestore didn't include routines/games
  - **Fix**: Added `syncUserStatsFromActivities()` that runs after all data loads
  - Automatically recalculates and saves correct totals from all activities (sessions + routines + games)
  - Stats now update immediately without needing manual recalculation

## [8.8.3] - February 2026

### Fixed
- **MCP Recalc: Challenge Completion Detection** - Fixed recalc looking for non-existent `challengeCompletions` collection
  - **Bug**: Recalc queried `users/{id}/challengeCompletions` which the app never creates
  - **Fix**: Now reads `user.dailyChallengesCompleted` counter and checks `challenges/weekly.completedBy` array
  - Uses estimated rewards (daily ~75pts, weekly ~600pts) since historical reward values aren't stored
  
- **MCP Fix Daily Challenge: Missing Season XP** - Now awards 25 Season XP when completing daily challenges
  - Previously only awarded points, forgot to update `seasonXp`
  - Output now shows "Season XP Awarded: +25"

## [8.8.2] - February 2026

### Added
- **MCP Server: Version Tracking**: Added `MCP_VERSION` constant to functions
  - All admin tool responses now show version: `(MCP v8.8.2)`
  - Makes it easy to verify which version is deployed
  - Version appears in: Challenge Status, Daily Challenge Fix, Stats Recalc, Achievement Audit

### Fixed
- **MCP Server: Parameter Type Handling**: Fixed `ignore_date` parameter not being recognized
  - MCP may pass boolean parameters as strings (`"true"` instead of `true`)
  - Now handles both: `params.ignore_date === true || String(params.ignore_date) === "true"`

## [8.8.1] - February 2026

## [8.8.0] - February 2026

### Fixed
- **MCP Server: Complete Timezone-Aware Activity Search**: Rewrote `getTodaysActivities()` to properly find routines and games across timezone boundaries
  - **Problem**: User logs routine at 5pm Arizona (Feb 1 local) → stored as midnight Feb 2 UTC → MCP server (running in UTC) couldn't find it when searching for Feb 1
  - **Solution**: Multi-method date matching that checks:
    1. `date` field matches target date (YYYY-MM-DD format, stored in local time)
    2. Timestamp ISO string starts with target date
    3. Timestamp's `toDateString()` matches target date string
    4. Expanded ±12 hour time window to catch timezone edge cases
  - Now correctly finds sessions, routines, AND games regardless of timezone differences
  - Daily challenge progress will now show accurate totals including all activity types

## [8.7.9] - February 2026

### Fixed
- **MCP Admin: Daily Challenge Timezone Fix**: Added `ignore_date` parameter to `putting_admin_fix_daily_challenge`
  - MCP server runs in UTC but users' challenges are stored in local time
  - When it's 10pm Feb 1 in Arizona (UTC-7), server sees Feb 2 UTC - causing date mismatch
  - New `ignore_date=true` parameter bypasses date check and uses the challenge's stored date
  - `getTodaysActivities()` now accepts optional `overrideDate` to query activities from a specific day
  - Enables fixing challenges even when server/user timezones differ

## [8.7.8] - February 2026

### Fixed
- **MCP Server: Stats Now Include All Activities**: `putting_get_user_stats` now includes routines and games in accuracy calculation
  - Previously only counted sessions (21 sessions = 259/386)
  - Now counts all activities (sessions + routines + games) for true overall accuracy
  - Output now shows: "Activities: X total (Y sessions, Z routines, W games)"
  
- **MCP Server: Tutorial Achievement Check**: Fixed `tutorial_complete` achievement validation
  - Previously checked only `tutorialComplete` flag which wasn't always set
  - Now validates if user has ANY activity (session/routine/game) since you can't log without completing tutorial
  - Users who completed tutorial and got the toast will no longer show as "invalid"

## [8.7.7] - February 2026

### Fixed
- **Local Timezone Fix for Daily/Weekly Challenges**: Fixed critical bug where challenges used UTC server time instead of user's local time
  - Added local timezone helper functions: `getLocalDateString()`, `getLocalStartOfDayISO()`, `getLocalEndOfDayISO()`, `isLocalToday()`, `timestampToLocalDateString()`
  - Fixed `insights.js` daily challenge functions to use local time:
    - `recalculateDailyChallenge()` 
    - `getTodaysTotalMakes()`
    - `getTodaysActivityCount()`
    - `getTodaysSessionCount()`
    - `getTodaysUniqueDistances()`
    - `getTodaysActivityTypes()`
    - `getStreakWarning()`
  - Fixed `challenges.js` weekly challenge functions to use local time:
    - `getWeeklyMakes()`
    - `getWeeklySessionsWithAccuracy()`
    - `getWeeklyAverageAccuracy()`
    - `getWeeklyDistancesPracticed()`
    - `getWeeklyMakesFromDistance()`
    - `getDaysWithMinMakes()`
    - `getWeeklyPracticeDays()`
    - `getWeekendPracticeDays()`
    - `getWeekdayPracticeDays()`
    - `getDaysWithMultipleSessions()`
    - `getWeeklyPoints()`
    - `getWeeklyRoutineCount()`
    - `getWeeklyGameCount()`
    - `getWeeklySessionCount()`
    - `recalculateWeeklyChallenge()`
  - Previously, `new Date().toISOString().split('T')[0]` returned UTC date (e.g., Tuesday in UTC when it's still Monday locally)
  - Now uses user's local timezone for all "today" and "this week" comparisons

## [8.7.6] - February 2026

### Fixed
- **MCP Admin Tools**: Fixed routine/game queries - removed ALL `orderBy` clauses
  - Firestore silently returns empty results when orderBy field doesn't exist
  - Routines/games use `endTime` not `timestamp`, causing queries to fail
  - Now fetches all documents without ordering, filters in code
  - Fixed `getTodaysActivities`, `calculateUserStreak`, `handleAdminFixWeeklyChallenge`
  - Added overall accuracy calculation to activity totals

## [8.7.5] - February 2026

### Fixed
- **Daily Challenge Progress Regression Bug**: Fixed critical bug where daily challenge progress would decrease after adding new sessions/routines/games
  - Progress now uses `Math.max()` to ensure it never decreases
  - Queries now use timestamp-based filtering for more reliable date matching
  - Added fallback queries when timestamp index not available
  - Double-validates dates to handle different date format storage
- Improved robustness of all daily challenge helper functions:
  - `getTodaysTotalMakes()`
  - `getTodaysActivityCount()`
  - `getTodaysActivityTypes()`
  - `recalculateDailyChallenge()`

## [8.6.1] - February 2026

### Fixed
- Work On card click handler now properly opens the coaching modal
- Changed from inline onclick to event delegation for better reliability

## [8.6.0] - February 2026

### 🎯 NEW: Comprehensive Coaching Engine

A powerful new coaching system that provides personalized, data-driven practice recommendations.

#### Features Added:

**1. Granular Distance Tracking**
- Tracks specific distances (10, 15, 20, 25, 30, 33, 40, 50ft)
- Shows accuracy, trends, and skill tier for each distance
- Identifies weakest and strongest distances

**2. Trend Analysis**
- Week-over-week accuracy comparison
- Volume and frequency trends
- Best/worst day of week analysis
- Monthly progress tracking

**3. Consistency Score (0-100)**
- Measures how consistent your putting is
- Lower variance = higher score
- Grades: Excellent (85+), Good (70-84), Fair (50-69), Needs Work (<50)

**4. Session Fatigue Detection**
- Compares performance in long vs short sessions
- Identifies if accuracy drops during longer practice
- Recommends optimal session length

**5. Neglect Alerts**
- Warns when distances haven't been practiced recently
- Severity levels: High (14+ days), Medium (7-13 days), Low (low data)
- Prompts to add neglected distances to practice

**6. Time Optimization**
- Tracks accuracy by time of day (early morning, morning, afternoon, evening, night)
- Identifies your best practice time
- Shows accuracy difference between best and worst times

**7. Skill Benchmarks & Tiers**
- Compares your accuracy to Beginner/Intermediate/Advanced/Pro standards
- Visual benchmark chart for each distance
- Shows gap to next tier

**8. Predictive Goals**
- Estimates when you'll reach the next skill tier
- Based on current improvement rate
- "At your current pace, you'll reach Advanced at 25ft in ~3 weeks"

**9. Smart Drill Prescriptions**
- Automatically selects the best drill based on your data
- Drill types: Foundation Builder, Consistency Drill, Distance Refresher, Burst Training, Challenge Ladder, Pressure Closer
- Includes step-by-step instructions

**10. Weather Impact Analysis** (if weather tracking enabled)
- Shows how wind and temperature affect your putting
- Identifies optimal weather conditions

#### New UI Components:

**Enhanced Work On Card**
- Shows primary focus distance with current accuracy and trend
- Displays skill tier badge
- Top recommendation with action button
- Urgent neglect alerts
- Consistency score bar
- Click to open full coaching dashboard

**Coaching Dashboard Modal**
- 5 tabs: Overview, Distances, Trends, Benchmarks, Time
- Weekly progress summary
- Distance profile with accuracy bars and trends
- Recommendation cards with actionable buttons
- Drill prescription with start button
- Benchmark comparison charts

#### Technical Details:
- New module: `/js/modules/coachingEngine.js` (~1200 lines)
- New component: `/js/components/coachingUI.js` (~600 lines)
- New stylesheet: `/css/coaching.css` (~700 lines)
- Caches analysis for 5 minutes to improve performance
- Works with sessions, routines, and games data

## [8.4.3] - February 2026

### Enhanced - MCP Recalculate Stats Tool
The `putting_admin_recalc_stats` tool now accounts for **all** point sources:

**Points Breakdown (All Time):**
1. ✅ Sessions - points from `sessions` subcollection
2. ✅ Routines - points from `routineCompletions` subcollection  
3. ✅ Games - points from `gameCompletions` subcollection
4. ✅ Daily/Weekly Challenge Rewards - from `challengeCompletions` subcollection
5. ✅ H2H Wager Wins - from `h2h_challenges` where `winnerId == user.id`
6. ✅ **NEW:** Friend Challenge Wins - from `challenges` where `winnerId == user.id`
7. ✅ **NEW:** Community Routine Creator Bonus - `timesCompleted × 10 pts` from `community_routines` where `createdBy == user.id`
8. ✅ Level Rewards - from `seasons/{seasonId}` subcollection
9. ✅ Achievement Rewards - calculated from user's achievements array

**Season XP Breakdown:**
- Sessions: 10 XP each
- Routines: 15 XP each
- Games: 20 XP each
- Daily Challenges: 25 XP each
- Weekly Challenges: 75 XP each
- H2H Wins: 50 XP each
- Friend Challenge Wins: 50 XP each (NEW)
- Achievements: 30 XP each

## [8.4.2] - February 2026

### Fixed - H2H Wager Points Not Being Awarded (BUG)
- **H2H challenges with wagers now properly award points to the winner**
- Previously, `wagerPoints` was stored but never transferred to the winner's `totalPoints`
- Winner now receives:
  - Points added to `totalPoints`
  - `h2hWagersWon` counter incremented
  - `h2hWagerPointsWon` running total updated
- Winner notification now shows wager amount won

### Fixed - Friend Challenge Rewards Not Being Awarded (BUG)
- **Friend challenges with rewards now properly award points to the winner**
- Previously, `reward` was displayed but never transferred to winner's `totalPoints`
- Winner now receives:
  - Points added to `totalPoints`
  - `friendChallengesWon` counter incremented
  - `friendChallengeRewardsWon` running total updated
- Winner notification now shows reward amount won

### Point Sources Summary (for recalc reference)
All point sources in the app:
1. **Sessions** - `calculateSessionPoints()` ✅
2. **Routines** - `calculateRoutinePoints()` ✅
3. **Games** - `calculateGamePoints()` ✅
4. **Weekly Challenges** - `challenge.reward` (500-1200 pts) ✅
5. **Daily Challenges** - `dailyChallenge.reward` ✅
6. **H2H Wager Wins** - `challenge.wagerPoints` ✅ (FIXED)
7. **Friend Challenge Wins** - `challenge.reward` ✅ (FIXED)
8. **Level Rewards** - `levelClaims` collection ✅
9. **Achievement Rewards** - `achievement.points` ✅
10. **Community Routine Creator Bonus** - +10 pts per completion ✅

## [8.4.1] - February 2026

### Fixed - Custom Routines/Games Challenge & Stats Integration
- **Custom routines now update weekly/daily challenges** - Previously only sessions triggered challenge progress
- **Custom games now update weekly/daily challenges** - Games were missing challenge check integration
- Both custom routines and games now properly call `challengeManager.checkChallengeCompletion()`

### Improved - Game Points Calculation
- **Games now receive session-equivalent points** when makes/attempts/distance data is available
- Added calculation path: `basePoints (50 × players) + sessionPoints (makes × distanceMultiplier × accuracyMultiplier × 10)`
- Example: 80 makes at 25ft now earns ~3250 pts vs previous ~450 pts

### Added - Putt Tracking for Custom Games
- New **"Track putt details for full points"** toggle in custom game scoring
- When enabled, users can enter:
  - Distance (ft) - shared across all players
  - Makes / Attempts - per player
- Custom games with putt tracking receive session-equivalent points
- Full dark mode support for putt tracking UI

### Technical Changes
- Updated `calculateGamePoints()` to prioritize session-equivalent calculation when putt data available
- Added putt tracking toggle event listener and form fields
- New CSS styles for putt tracking section (light + dark mode)
- Challenge checks now pass complete activity data including makes/attempts/percentage/distance

## [8.3.2] - January 2026

### Fixed - Streak Calculation Timezone Bug
- **Root cause**: Games and routines used `toISOString().split('T')[0]` which converts to UTC, causing dates to shift
  - Example: Activity at 10 PM Jan 27 in Arizona (UTC-7) would become Jan 28 in UTC
- **Fix**: Created `getLocalDateString()` helper that extracts local date consistently
- Now checks `timestamp || date` for sessions (previously only checked `date`)
- Now checks `endTime || timestamp || date` for games and routines
- Added debug logging to help diagnose future streak issues (check console for "🔥 Streak calculation")
- All activity types now use consistent local date extraction

## [8.3.1] - January 2026

### Changed - Balanced Update Approach
- **Non-blocking update toast** - Shows "🆕 Update available!" with Refresh button instead of auto-reloading
- **User controls when to update** - Can dismiss toast or click Refresh when ready
- **Check every 2 minutes** (was 30 seconds) - reduces battery/data usage
- **Toast auto-dismisses after 30 seconds** - non-intrusive
- **Only clears old caches** - doesn't clear current version's cache
- **Service worker waits for user** - doesn't force skipWaiting() automatically
- Styled toast matches app theme (cyan/green gradient)

### Benefits over v8.3.0:
- No mid-task interruptions
- No data loss from unexpected reloads  
- Better battery and data usage
- User stays in control

## [8.3.0] - January 2026

### Improved - Aggressive App Refresh & Version Updating
- **Auto-reload on version change** - no more "Reload to update?" prompts, just automatic refresh
- **Aggressive cache clearing** - clears ALL caches when version changes, not just service worker caches
- **Faster update checks** - checks for updates every 30 seconds (was 5 minutes)
- **Immediate update check** - checks for updates immediately on page load
- **Service worker takes over immediately** - uses skipWaiting() and clients.claim() aggressively
- **Hard reload** - uses `window.location.reload(true)` to bypass browser cache
- **Message listener** - service worker now listens for SKIP_WAITING and CLEAR_CACHE messages
- **Notifies all clients** - service worker sends SW_UPDATED message to all open tabs
- Synchronized CACHE_VERSION in service-worker.js with APP_VERSION in index.html

## [8.2.9] - January 2026

### Removed - Profile Recalculate Buttons
- Removed all recalculate buttons from Profile page:
  - 🔧 Recalculate My Stats
  - 🏆 Recalculate Weekly Challenge
  - 🎯 Recalculate Daily Challenge
  - ⭐ Recalculate Season XP
- Cleaner profile UI without debug/admin tools

## [8.2.8] - January 2026

### Fixed - Reference Error in Bulk Session
- Fixed `sessionDate is not defined` error in submitBulkSession
- Changed `sessionDate.toISOString()` to `now.toISOString()` (now is the correct variable name after refactor)

## [8.2.7] - January 2026

### Fixed - Critical Bulk Session Save Bug
- **Fixed bug where bulk session logging showed both success and error messages**
- Root cause: `this.render()` was being called before form values were captured, destroying the form inputs
- Solution: Capture ALL form values (distance, makes, attempts, disc, notes) into variables BEFORE calling render()
- Player scores are now stored in a `playerScores` array before any state changes
- Validation errors now properly throw exceptions instead of just returning, preventing false success messages
- Added better logging for debugging input capture issues

## [8.2.6] - January 2026

### Improved - Bulk Session Logging Wizard
- **Simplified Practice Session flow to 3 steps** (was 4 steps):
  - Step 1: Select Players (unchanged)
  - Step 2: Select Activity Type (unchanged)
  - Step 3: Combined session form with distance, player scores, disc, notes, and Save button
- Removed redundant Step 4 for sessions
- Step 3 now matches the Add Practice Session form layout:
  - Duration timer at top
  - Distance input with quick-select buttons (15', 20', 25', 30', C1)
  - Player scores section with Makes/Attempts for each player
  - Putter selection with suggestions
  - Notes with quick-note buttons
- Added event listeners for quick distance buttons in bulk session form
- Added event listeners for quick note buttons in bulk session form

## [8.2.5] - January 2026

### Changed - Simplified Activity Logging
- **Removed date/time selection from all logging forms** - activities now automatically use current time
  - Add Practice Session: date/time fields removed (only shown when editing)
  - Bulk Session Logging: date/time fields removed
  - Bulk Routine Logging: date/time fields removed  
  - Bulk Game Logging: date/time fields removed
- Date and time can still be adjusted via the **Edit** function after saving

### Fixed - Timezone Date Bug
- Fixed bug where activities logged late at night could show wrong date due to UTC conversion
- Now uses `getLocalDateString()` consistently for proper local timezone handling
- This fixes the issue where sessions logged on 1/27 would appear as 1/28

## [8.2.4] - January 2026

### Fixed - Stats Page Card Icons
- Fixed stat card icons not being centered on Stats page
- Added flexbox centering to `.stat-card-detailed` for consistent alignment
- Icons now properly center regardless of content width

## [8.2.3] - January 2026

### Fixed - Streak Counter & Warning
- Fixed streak counter not updating after logging activities (sessions, routines, or games)
- Streak warning now correctly checks ALL activity types (sessions, routines, AND games) when determining if user practiced today
- Streak calculation now properly recalculates using `calculateAllActivitiesStreaks` function

### Improved - Streak Warning UI
- Streak warning on Practice tab is now displayed inside a card for consistent styling
- Added proper CSS styling for streak warning card with gradient backgrounds
- Urgent warnings (≤4 hours left) have a subtle pulse animation
- Added dark mode support for streak warning
- Mobile-responsive layout that stacks vertically on small screens

## [8.2.2] - January 2026

### Fixed - Recent Practice Time Ordering
- Fixed games and routines not appearing in correct chronological order in Recent Practice
- Added robust timestamp validation for all activity types (sessions, routines, games)
- Invalid or missing timestamps now handled gracefully with console warnings
- `saveGameCompletion` now ensures both `timestamp` and `endTime` are always set
- `saveRoutineCompletion` now ensures both `timestamp` and `endTime` are always set
- `addGameForUser` now includes both `timestamp` and `endTime` for bulk game logging

### Improved
- Better debug logging showing actual timestamps used for sorting
- Activities with invalid dates are now placed at the end (epoch fallback) instead of causing errors

## [8.2.1] - January 2026

### Added - Saving Spinners for Bulk Session/Routine
- Added "⏳ Saving..." spinner state to bulk session logging submit button
- Added "⏳ Saving..." spinner state to bulk routine logging submit button
- Both now prevent double-submission with disabled button during save
- Proper error handling resets saving state on failure

### Improved
- submitBulkRoutine now wrapped in try-catch for better error handling
- Early returns (validation failures) now properly reset saving state

## [8.2.0] - January 2026

### Added - Saving Spinners for All Games
- Added "⏳ Saving..." spinner state to ALL interactive game submit buttons:
  - Putt 100 (all variants)
  - Joe's Monday Night
  - Perfect 10
  - Points Poker
  - Around the World
  - HORSE
  - Ladder Challenge
  - Par Game (already had it)
  - Bulk Game Logging (already had it)
  
### Improved
- All game handlers now prevent double-submission
- Button shows disabled state with "⏳ Saving..." during save
- Proper error handling resets the saving state

## [8.1.9] - January 2026

### Improved - Dark Mode
- Added comprehensive dark mode styles to phase2.css:
  - Spinner overlays and loading containers
  - Toast notifications (success, error, warning, info)
  - Progress bars and labels
  - Confirm modals
  - Tooltips
  - Skeleton loaders
  - Empty states
  - Info cards and highlight cards
  - Feature cards
  - Badges and tags
  - Form hints and help text
  - Data lists
  - Accordion panels
  - Tab navigation
  - Friend items and pending requests
  - Tip/Hint/Warning/Success/Error boxes

## [8.1.8] - January 2026

### Fixed
- Added friendship check to ALL remaining interactive game handlers:
  - **Around the World** - Added missing `currentUserId` declaration and friendship check
  - **HORSE** - Added friendship check before saving to other players
  - **Ladder Challenge** - Added friendship check
  - **Par Game** - Added friendship check
- All games now properly skip saving to non-friends' accounts (prevents permission errors)
- Consistent dual-save pattern across all 10 interactive game modes

### Games Now Fixed (Complete List):
1. Putt 100 (all variants) ✅
2. Perfect 10 ✅
3. Points Poker ✅
4. Joe's Monday Night ✅
5. Around the World ✅
6. HORSE ✅
7. Ladder Challenge ✅
8. Par Game ✅
9. Bulk Game Logging ✅

## [8.1.7] - January 2026

### Improved
- Comprehensive dark mode styling for Bulk Log Wizard
- Fixed text visibility in dark mode for:
  - Player selection list
  - Activity type cards (Session, Routine, Game)
  - Routine/Game selection items
  - Form inputs (date, time, number fields)
  - Summary sections
  - Drill score inputs
  - Interactive game scoring (Putt 100, Perfect 10, Points Poker, Joe's Monday Night)
  - Timer displays
  - Game leaderboards
  - Station indicators
  - Progress bars and badges

## [8.1.6] - January 2026

### Fixed
- Applied dual-save pattern to ALL interactive game modes:
  - **Putt 100** (all variants) ✅
  - **Perfect 10** ✅
  - **Points Poker** ✅
  - **Joe's Monday Night** ✅
- All games now properly check friendship before saving to other players' accounts
- Other players' game results saved as "pending" requiring their acceptance
- Your own games save directly with immediate points

## [8.1.5] - January 2026

### Fixed
- Fixed Firestore permissions error when saving Putt 100 games for other players
- Putt 100 now uses proper dual-save pattern: saves to your account as reference, saves to friend's account as pending
- Removed illegal attempt to update other users' profile documents directly
- Other players' games are now saved as "pending" requiring their acceptance

## [8.1.4] - January 2026

### Fixed
- Fixed `currentUserId is not defined` error in Putt 100 game submit
- Fixed `Invalid collection reference` error - corrected `storageManager.get()` call syntax
- Putt 100 interactive game mode now properly saves and updates user points

## [8.1.3] - January 2026

### Fixed
- Bulk game logging now properly handles "Putt 100" percentage-type games
- Fixed undefined `basePoints`/`scoreBonus` variable error in game logging console output
- Added proper scoring calculation for percentage, rotations, and other game types

### Improved
- Game completions now store `scoringType` and `scoreData` for better activity card display
- Putt 100 games now correctly calculate points based on accuracy percentage

## [8.1.2] - January 2026

### Fixed
- Bulk entry now properly saves `drillResults` for activity card display
- Routine breakdown now checks both `drillResults` and `drillScores` for compatibility with older data
- Routines now show BOTH drill-by-drill table AND summary formula when drill data is available

### Improved
- Activity cards for routines now always show the scoring formula (Makes × Avg Distance × Accuracy × 10)
- Average distance is calculated from actual drill distances when available
- Added drill count and avg points per drill summary below formula

## [8.1.1] - January 2026

### Fixed
- Routine breakdown now shows session-style formula (Makes × Distance × Accuracy × 10) when no drill-by-drill data is available
- Added putts/min pace indicator to routine fallback display
- Improved fallback display for routines with totalStats but no drillResults

## [8.1.0] - January 2026

### Added
- Enhanced Activity Cards with detailed scoring breakdowns
- Collapsible "Scoring Breakdown" section on all activity types
- Performance badges: Perfect, High Accuracy, Long Range, High Volume, etc.
- Stat pills with color-coded visual indicators
- Drill-by-drill breakdown for routines showing individual performance
- Game scoring explanation showing base points and bonuses
- Extra stats like putts per minute pace indicator
- Dark mode support for all new activity card elements

### Changed
- Recent Practice activity cards now show much more detail
- Session cards display scoring formula: Makes × Distance Multiplier × Accuracy Multiplier × 10
- Routine cards show per-drill stats and summary averages
- Game cards explain base points (50 × players) plus bonus calculations
- Improved visual hierarchy with modern pill-style stat indicators

### Improved
- Mobile responsiveness for activity card breakdowns
- Activity card hover effects for better interactivity
- Visual polish with gradients and subtle animations

## [8.0.0] - January 2026

### Added
- Season XP system with XP awards for all activities
- Season XP Leaderboard tab (⭐ Season)
- Retroactive Season XP calculation button in Profile
- Hover tooltips on leaderboard tabs explaining each ranking system
- Pending sync button in Practice tab header
- DEBUG_MODE flag to disable console logging in production

### Changed
- Unified Friend Challenges and H2H Challenges into single "H2H" system
- Both H2H types now award +50 XP for winning
- Season XP stored in dedicated subcollection for accurate tracking
- Mobile-responsive ELO leaderboard layout

### Fixed
- Season XP not updating in Season Pass modal
- Season leaderboard not loading on first click
- Daily/Weekly challenges now track all activity types (sessions, routines, games)
- ELO leaderboard overflow on mobile devices

### Removed
- Separate "Win Friend Challenge" XP type (merged into winH2H)
- Pending sync card from app header (moved to Practice tab)
- Console logging in production mode

## [7.2.x] - January 2026
- Challenge tracking improvements
- Stats recalculation features
- ELO leaderboard privacy settings

## [7.0.0] - January 2026
- Phase 5: Teams, Leagues, Seasons foundation
- ELO rating system
- Team creation and management

## [6.0.0] - December 2025
- Games system with scoring
- Routines with completion tracking
- Multiplayer logging

## [5.0.0] - November 2025
- Achievements system
- Daily/Weekly challenges
- Friend system

## [4.0.0] - October 2025
- Advanced statistics
- Charts and analytics
- Weather integration

## [3.0.0] - September 2025
- Firebase backend
- User authentication
- Cloud data sync

## [2.0.0] - August 2025
- PWA features
- Offline support
- Install prompts

## [1.0.0] - July 2025
- Initial release
- Basic practice tracking
- Local storage
