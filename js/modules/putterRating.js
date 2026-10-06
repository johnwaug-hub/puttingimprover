/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */

/**
 * Putter Rating System
 *
 * Inspired by the PDGA rating model: performance is measured relative to a
 * "scratch" baseline (community average make% by distance). A rating of 500
 * means exactly scratch; 800+ is Elite.
 *
 * Formula:
 *   sessionScore = 500 + log2(actualPct / scratchPct) * 150
 *   weatherMultiplier applied on top (wind, rain, snow, temp extremes)
 *   rating = decayed weighted average over full history
 *   weight per session = √(attempts)   (more attempts → more reliable)
 *   decay = e^(-λ × daysAgo)   λ=0.002  → ~1 year half-life
 *
 * Range: 0–999, clamped.
 */

// ── Scratch baselines ──────────────────────────────────────────────────────────
// Community average make% by distance — seeded from disc golf research.
// Will converge toward real community data as sessions accumulate.
export const SCRATCH_BASELINES = {
    10: 90,
    15: 76,
    20: 60,
    25: 46,
    30: 33,
    35: 23,
    40: 16,
    45: 11,
    50: 7
};

// ── Tier definitions ───────────────────────────────────────────────────────────
export const RATING_TIERS = [
    { min: 0,   max: 299, name: 'Beginner', icon: '🌱', color: '#378ADD', bg: '#E6F1FB', textColor: '#0C447C' },
    { min: 300, max: 499, name: 'Amateur',  icon: '⭐', color: '#1D9E75', bg: '#E1F5EE', textColor: '#085041' },
    { min: 500, max: 649, name: 'Skilled',  icon: '🎯', color: '#BA7517', bg: '#FAEEDA', textColor: '#633806' },
    { min: 650, max: 799, name: 'Expert',   icon: '💫', color: '#D85A30', bg: '#FAECE7', textColor: '#4A1B0C' },
    { min: 800, max: 999, name: 'Elite',    icon: '🏆', color: '#993556', bg: '#FBEAF0', textColor: '#4B1528' },
];

// ── Decay constant ─────────────────────────────────────────────────────────────
// λ = 0.002 per day → half-life of ~347 days (~1 year)
const DECAY_LAMBDA = 0.002;

// ── Weather difficulty multiplier ──────────────────────────────────────────────
/**
 * Returns a multiplier ≥ 1.0 based on conditions.
 * Making 8/10 in 25mph wind is worth more than 8/10 on a calm day.
 * @param {Object|null} weather - Weather object from weather.js
 * @returns {number}
 */
export function getWeatherMultiplier(weather) {
    if (!weather) return 1.0;
    let mult = 1.0;

    // Wind — exponential difficulty, not linear
    const wind = weather.windSpeed || 0;
    if      (wind >= 25) mult += 0.50;
    else if (wind >= 20) mult += 0.32;
    else if (wind >= 15) mult += 0.18;
    else if (wind >= 10) mult += 0.08;

    // Precipitation
    if ((weather.rain  || 0) > 0) mult += 0.15;
    if ((weather.snow  || 0) > 0) mult += 0.20;

    // Temperature extremes
    const temp = weather.temperature;
    if (temp !== undefined) {
        if (temp < 35) mult += 0.10;
        else if (temp > 95) mult += 0.08;
    }

    return mult;
}

// ── Per-session score ──────────────────────────────────────────────────────────
/**
 * Calculate a single session's raw score (0–999 before clamping).
 * @param {number} makes
 * @param {number} attempts
 * @param {number} distance - feet
 * @param {Object|null} weather
 * @param {Object} scratchBaselines - override for community-updated baselines
 * @returns {number|null} null if not enough data
 */
export function calcSessionScore(makes, attempts, distance, weather, scratchBaselines = SCRATCH_BASELINES) {
    if (!attempts || attempts === 0) return null;

    const actualPct = (makes / attempts) * 100;

    // Find closest tracked distance
    const distances = Object.keys(scratchBaselines).map(Number).sort((a, b) => a - b);
    const closestDist = distances.reduce((prev, curr) =>
        Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
    );
    const scratchPct = scratchBaselines[closestDist];
    if (!scratchPct || scratchPct === 0) return null;

    // Core formula: log2 ratio centered at 500
    const ratio = actualPct / scratchPct;
    const rawScore = 500 + (Math.log2(Math.max(ratio, 0.01)) * 150);

    // Apply weather difficulty multiplier
    const weatherMult = getWeatherMultiplier(weather);
    const adjusted = rawScore * weatherMult;

    return Math.max(0, Math.min(999, adjusted));
}

// ── Main manager class ─────────────────────────────────────────────────────────
class PutterRatingManager {

    /**
     * Look up tier for a given rating number.
     * @param {number} rating
     * @returns {Object} tier object
     */
    getTier(rating) {
        if (rating == null || isNaN(rating)) return RATING_TIERS[0];
        return RATING_TIERS.find(t => rating >= t.min && rating <= t.max) || RATING_TIERS[0];
    }

    /**
     * Incremental update — called after every new session save.
     * Updates the running weighted sum on the user object without reading
     * history from Firestore. O(1).
     *
     * @param {Object} user - current user object
     * @param {Object} session - newly saved session { makes, attempts, distance, weather, timestamp }
     * @param {Object} scratchBaselines - live community baselines (or SCRATCH_BASELINES)
     * @returns {Object} updated user fields to merge
     */
    updateRatingFromSession(user, session, scratchBaselines = SCRATCH_BASELINES) {
        const score = calcSessionScore(
            session.makes,
            session.attempts,
            session.distance,
            session.weather,
            scratchBaselines
        );
        if (score === null) return {};

        const sessionWeight = Math.sqrt(Math.max(session.attempts, 1));
        const now = new Date();
        const lastUpdated = user.ratingLastUpdated ? new Date(user.ratingLastUpdated) : now;
        const daysSinceLast = Math.max(0, (now - lastUpdated) / (1000 * 60 * 60 * 24));

        // Decay existing accumulated score toward the present
        const decayFactor = Math.exp(-DECAY_LAMBDA * daysSinceLast);
        const newWeightedSum = ((user.ratingWeightedSum || 0) * decayFactor) + (score * sessionWeight);
        const newTotalWeight = ((user.ratingTotalWeight || 0) * decayFactor) + sessionWeight;
        const newRating = Math.round(Math.max(0, Math.min(999, newWeightedSum / newTotalWeight)));

        return {
            putterRating: newRating,
            ratingWeightedSum: newWeightedSum,
            ratingTotalWeight: newTotalWeight,
            ratingLastUpdated: now.toISOString(),
        };
    }

    /**
     * Full recalc from all sessions — used for backfill / admin recalc.
     * Sessions are processed oldest-first; decay is applied relative to today.
     *
     * @param {Array} sessions
     * @param {Object} scratchBaselines
     * @returns {Object} rating fields to merge onto user
     */
    recalcFromSessions(sessions, scratchBaselines = SCRATCH_BASELINES) {
        if (!sessions || sessions.length === 0) {
            return { putterRating: null, ratingWeightedSum: 0, ratingTotalWeight: 0, ratingLastUpdated: null };
        }

        const sorted = [...sessions].sort(
            (a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
        );

        const now = new Date();
        let weightedSum = 0;
        let totalWeight = 0;

        sorted.forEach(session => {
            const score = calcSessionScore(
                session.makes, session.attempts, session.distance,
                session.weather, scratchBaselines
            );
            if (score === null) return;

            const sessionWeight = Math.sqrt(Math.max(session.attempts, 1));
            const sessionDate = new Date(session.timestamp || session.date);
            const daysAgo = Math.max(0, (now - sessionDate) / (1000 * 60 * 60 * 24));
            const decayFactor = Math.exp(-DECAY_LAMBDA * daysAgo);

            weightedSum += score * sessionWeight * decayFactor;
            totalWeight += sessionWeight * decayFactor;
        });

        if (totalWeight === 0) {
            return { putterRating: null, ratingWeightedSum: 0, ratingTotalWeight: 0, ratingLastUpdated: null };
        }

        const rating = Math.round(Math.max(0, Math.min(999, weightedSum / totalWeight)));
        return {
            putterRating: rating,
            ratingWeightedSum: weightedSum,
            ratingTotalWeight: totalWeight,
            ratingLastUpdated: now.toISOString(),
        };
    }

    /**
     * Render a compact tier badge HTML string.
     * @param {number|null} rating
     * @returns {string}
     */
    renderBadge(rating) {
        if (rating == null) return '';
        const tier = this.getTier(rating);
        return `<span class="putter-rating-badge" style="background:${tier.bg};color:${tier.textColor};">
                    ${tier.icon} ${rating} <span class="putter-rating-tier-name">${tier.name}</span>
                </span>`;
    }

    /**
     * Derive live scratch baselines from real community data.
     * Falls back to SCRATCH_BASELINES if no community data available.
     * @param {Object} communityStats - output of storageManager.getCommunityStats()
     * @returns {Object} baselines by distance
     */
    buildLiveBaselines(communityStats) {
        if (!communityStats?.hasData || !communityStats?.byDistance) {
            return { ...SCRATCH_BASELINES };
        }

        const live = { ...SCRATCH_BASELINES };
        Object.entries(communityStats.byDistance).forEach(([dist, stats]) => {
            // Only update if we have enough sample data (≥20 sessions at that distance)
            if (stats.sessionCount >= 20 && stats.totalAttempts > 0) {
                const communityAvg = Math.round((stats.totalMakes / stats.totalAttempts) * 100);
                // Blend 70% community + 30% seeded to prevent wild swings early on
                const seeded = SCRATCH_BASELINES[parseInt(dist)] || communityAvg;
                live[parseInt(dist)] = Math.round(communityAvg * 0.7 + seeded * 0.3);
            }
        });
        return live;
    }
}

export const putterRatingManager = new PutterRatingManager();
