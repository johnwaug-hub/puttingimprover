/**
 * Application Constants
 * All magic numbers and configuration values in one place
 */

// Debug mode - set to false for production
export const DEBUG_MODE = false;

export const CONSTANTS = {
    // Points calculation
    POINTS: {
        DISTANCE_DIVISOR: 10,
        ACCURACY_DIVISOR: 100,
        BASE_MULTIPLIER: 10
    },

    // Weekly challenge duration
    CHALLENGE: {
        DURATION_DAYS: 7
    },

    // Achievement thresholds
    ACHIEVEMENTS: {
        PERFECT_10_THRESHOLD: 10,
        CENTURY_CLUB_POINTS: 100,
        WEEK_WARRIOR_DAYS: 7,
        MONTH_MASTER_DAYS: 30,
        DISTANCE_DEMON_PUTTS: 5,
        DISTANCE_DEMON_FEET: 40,
        SOCIAL_BUTTERFLY_FRIENDS: 5,
        POINT_KING_TOTAL: 1000,
        PODIUM_POSITION: 3
    },

    // UI Configuration
    UI: {
        DEFAULT_DISTANCE: '10',
        AVATAR_SIZE: 48
    },

    // Storage keys
    STORAGE_KEYS: {
        WEEKLY_CHALLENGE: 'weekly_challenge',
        SESSIONS_PREFIX: 'sessions:',
        USER_PREFIX: 'user:',
        FRIENDS_PREFIX: 'friends:',
        FRIEND_REQUEST_PREFIX: 'friend_request:',
        ROUTINES_PREFIX: 'routines:',
        COMMUNITY_ROUTINE_PREFIX: 'community_routine:'
    },

    // Validation
    VALIDATION: {
        MIN_MAKES: 0,
        MIN_ATTEMPTS: 1,
        MIN_DISTANCE: 1,
        MAX_DISTANCE: 100
    }
};

export const CHALLENGE_TYPES = [
    // === ACCURACY CHALLENGES (10) ===
    { type: 'accuracy', target: 80, desc: 'Achieve 80%+ accuracy in a session', reward: 500 },
    { type: 'accuracy', target: 85, desc: 'Achieve 85%+ accuracy in a session', reward: 600 },
    { type: 'accuracy', target: 90, desc: 'Achieve 90%+ accuracy in a session', reward: 750 },
    { type: 'accuracy', target: 75, desc: 'Achieve 75%+ accuracy in a session', reward: 400 },
    { type: 'accuracy', target: 95, desc: 'Achieve 95%+ accuracy in a session', reward: 1000 },
    { type: 'accuracy_sustained', target: 80, sessions: 3, desc: 'Hit 80%+ accuracy in 3 sessions this week', reward: 800 },
    { type: 'accuracy_sustained', target: 75, sessions: 5, desc: 'Hit 75%+ accuracy in 5 sessions this week', reward: 900 },
    { type: 'accuracy_average', target: 70, desc: 'Maintain 70%+ average accuracy this week', reward: 650 },
    { type: 'accuracy_average', target: 80, desc: 'Maintain 80%+ average accuracy this week', reward: 850 },
    { type: 'perfect_session', target: 100, minAttempts: 10, desc: 'Complete a perfect session (10+ attempts)', reward: 1200 },

    // === DISTANCE CHALLENGES (10) ===
    { type: 'distance', target: 30, makes: 5, desc: 'Make 5+ putts from 30+ feet', reward: 400 },
    { type: 'distance', target: 25, makes: 10, desc: 'Make 10+ putts from 25+ feet', reward: 450 },
    { type: 'distance', target: 35, makes: 3, desc: 'Make 3+ putts from 35+ feet', reward: 500 },
    { type: 'distance', target: 40, makes: 2, desc: 'Make 2+ putts from 40+ feet', reward: 550 },
    { type: 'distance', target: 20, makes: 15, desc: 'Make 15+ putts from 20+ feet', reward: 400 },
    { type: 'distance', target: 33, makes: 8, desc: 'Make 8+ putts from Circle 1 edge (33ft)', reward: 600 },
    { type: 'distance', target: 45, makes: 1, desc: 'Make a putt from 45+ feet', reward: 400 },
    { type: 'distance', target: 50, makes: 1, desc: 'Make a putt from 50+ feet', reward: 500 },
    { type: 'distance_variety', distances: [15, 20, 25, 30], desc: 'Practice from 15, 20, 25, and 30 feet', reward: 550 },
    { type: 'long_range_total', target: 25, distance: 25, desc: 'Make 25+ putts from 25+ feet this week', reward: 700 },

    // === VOLUME CHALLENGES (10) ===
    { type: 'volume', target: 50, desc: 'Make 50+ total putts this week', reward: 300 },
    { type: 'volume', target: 100, desc: 'Make 100+ total putts this week', reward: 500 },
    { type: 'volume', target: 150, desc: 'Make 150+ total putts this week', reward: 650 },
    { type: 'volume', target: 200, desc: 'Make 200+ total putts this week', reward: 800 },
    { type: 'volume', target: 250, desc: 'Make 250+ total putts this week', reward: 950 },
    { type: 'volume', target: 300, desc: 'Make 300+ total putts this week', reward: 1100 },
    { type: 'volume', target: 75, desc: 'Make 75+ total putts this week', reward: 400 },
    { type: 'volume_daily', target: 20, days: 5, desc: 'Make 20+ putts on 5 different days', reward: 700 },
    { type: 'volume_daily', target: 30, days: 4, desc: 'Make 30+ putts on 4 different days', reward: 750 },
    { type: 'volume_single', target: 75, desc: 'Make 75+ putts in a single session', reward: 600 },

    // === STREAK CHALLENGES (8) ===
    { type: 'streak', target: 5, desc: 'Practice 5 days this week', reward: 700 },
    { type: 'streak', target: 7, desc: 'Practice every day this week', reward: 1000 },
    { type: 'streak', target: 4, desc: 'Practice 4 days this week', reward: 500 },
    { type: 'streak', target: 6, desc: 'Practice 6 days this week', reward: 850 },
    { type: 'streak', target: 3, desc: 'Practice 3 days this week', reward: 350 },
    { type: 'weekend_warrior', target: 2, desc: 'Practice both Saturday and Sunday', reward: 400 },
    { type: 'weekday_grinder', target: 5, desc: 'Practice every weekday (Mon-Fri)', reward: 800 },
    { type: 'double_session', target: 3, desc: 'Complete 2+ sessions on 3 different days', reward: 650 },

    // === POINTS CHALLENGES (6) ===
    { type: 'points', target: 500, desc: 'Score 500+ points in one session', reward: 800 },
    { type: 'points', target: 300, desc: 'Score 300+ points in one session', reward: 500 },
    { type: 'points', target: 750, desc: 'Score 750+ points in one session', reward: 1000 },
    { type: 'points', target: 1000, desc: 'Score 1000+ points in one session', reward: 1500 },
    { type: 'points_weekly', target: 1500, desc: 'Earn 1500+ total points this week', reward: 700 },
    { type: 'points_weekly', target: 2500, desc: 'Earn 2500+ total points this week', reward: 1000 },

    // === ACTIVITY VARIETY CHALLENGES (6) ===
    { type: 'routines', target: 3, desc: 'Complete 3 routines this week', reward: 600 },
    { type: 'routines', target: 5, desc: 'Complete 5 routines this week', reward: 850 },
    { type: 'games', target: 3, desc: 'Play 3 putting games this week', reward: 550 },
    { type: 'games', target: 5, desc: 'Play 5 putting games this week', reward: 800 },
    { type: 'variety', target: 3, desc: 'Complete sessions, routines, AND games', reward: 700 },
    { type: 'all_rounder', sessions: 3, routines: 2, games: 2, desc: 'Complete 3 sessions, 2 routines, 2 games', reward: 900 }
];

/**
 * Achievements that may be revoked if a re-check no longer validates them.
 *
 * Everything NOT in this set is "sticky": earned once, never taken away.
 * Achievement checks re-evaluate against the user's CURRENT data, which is fine
 * for live, user-reversible state (profile fields, friend counts) but wrong for
 * milestones ("100 sessions") and moments in time ("practice before 8am",
 * "score exactly 69"). Those are things the user DID — if the underlying
 * activity is later deleted or edited, the check fails and the badge would be
 * stripped even though it was legitimately earned. Worse, revoking an
 * achievement removes its points, which can cascade into point-threshold
 * achievements failing too.
 *
 * Keep this list in sync with REVOCABLE_ACHIEVEMENTS in functions/src/index.ts.
 */
export const REVOCABLE_ACHIEVEMENTS = new Set([
    // Profile configuration — the user can clear these fields at any time
    'profile_complete',
    'disc_collector',
    // Live friend counts — "have N friends" is a present-tense condition
    'first_friend',
    'friendly_rivalry',
    'social_butterfly',
    'social_scorer',
    'friend_magnet',
    'squad_goals',
    'social_network'
]);

/**
 * True if an achievement can never be revoked once earned.
 * @param {string} achievementId
 * @returns {boolean}
 */
export function isStickyAchievement(achievementId) {
    return !REVOCABLE_ACHIEVEMENTS.has(achievementId);
}

export const ACHIEVEMENTS_CONFIG = [
    // Getting Started
    { id: 'first_steps', icon: '🎯', name: 'First Steps', desc: 'Complete your first practice session', points: 50 },
    { id: 'early_bird', icon: '🌅', name: 'Early Bird', desc: 'Practice before 8am', points: 75 },
    { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Practice after 8pm', points: 75 },
    { id: 'first_friend', icon: '🤝', name: 'First Friend', desc: 'Add your first friend', points: 25 },
    { id: 'tutorial_complete', icon: '📖', name: 'Tutorial Complete', desc: 'Complete the getting started tutorial', points: 50 },
    { id: 'first_week', icon: '📅', name: 'First Week', desc: 'Practice for 7 total days', points: 75 },
    { id: 'morning_person', icon: '☀️', name: 'Morning Person', desc: 'Practice 5 times before noon', points: 75 },
    { id: 'afternoon_delight', icon: '🌤️', name: 'Afternoon Delight', desc: 'Practice 5 times between 12pm-5pm', points: 75 },

    // Accuracy Achievements
    { id: 'perfect_10', icon: '💯', name: 'Perfect 10', desc: 'Make 10 putts in a row at 100%', points: 100 },
    { id: 'eighty_percent_pro', icon: '🎯', name: '80% Pro', desc: 'Achieve 80%+ accuracy in a session', points: 75 },
    { id: 'ninety_percent_club', icon: '🎖️', name: '90% Club', desc: 'Achieve 90%+ accuracy in a session', points: 125 },
    { id: 'flawless', icon: '✨', name: 'Flawless', desc: 'Complete a 50-putt session at 100%', points: 250 },
    { id: 'sharpshooter', icon: '🎪', name: 'Sharpshooter', desc: 'Hit 95%+ accuracy from 20+ feet', points: 200 },
    { id: 'deadeye', icon: '👁️', name: 'Deadeye', desc: 'Hit 98%+ accuracy in a 25+ putt session', points: 300 },
    { id: 'perfect_circle', icon: '⭕', name: 'Perfect Circle', desc: '100% accuracy from Circle 1 (33ft) in a session', points: 400 },
    { id: 'laser_focus', icon: '🔬', name: 'Laser Focus', desc: 'Hit 90%+ accuracy from 25+ feet', points: 250 },
    { id: 'consistent_accuracy', icon: '📊', name: 'Consistent Accuracy', desc: 'Maintain 85%+ average over 10 sessions', points: 350 },
    { id: 'triple_perfect', icon: '3️⃣', name: 'Triple Perfect', desc: 'Complete 3 consecutive sessions at 100%', points: 500 },

    // Points & Sessions
    { id: 'quick_start', icon: '⚡', name: 'Quick Start', desc: 'Score 25+ points in one session', points: 50 },
    { id: 'century_club', icon: '💪', name: 'Century Club', desc: 'Score 100+ points in one session', points: 150 },
    { id: 'double_century', icon: '💥', name: 'Double Century', desc: 'Score 200+ points in one session', points: 300 },
    { id: 'triple_threat', icon: '🎪', name: 'Triple Threat', desc: 'Score 300+ points in one session', points: 500 },
    { id: 'half_century', icon: '⚡', name: 'Half Century', desc: 'Complete 50 practice sessions', points: 300 },
    { id: 'centurion', icon: '🏛️', name: 'Centurion', desc: 'Complete 100 practice sessions', points: 500 },
    { id: 'session_veteran', icon: '🎓', name: 'Session Veteran', desc: 'Complete 250 practice sessions', points: 750 },
    { id: 'session_legend', icon: '👑', name: 'Session Legend', desc: 'Complete 500 practice sessions', points: 1500 },
    { id: 'point_king', icon: '⭐', name: 'Point King', desc: 'Earn 1000+ total points', points: 250 },
    { id: 'point_legend', icon: '💎', name: 'Point Legend', desc: 'Earn 5000+ total points', points: 750 },
    { id: 'point_millionaire', icon: '💰', name: 'Point Millionaire', desc: 'Earn 10,000+ total points', points: 1500 },
    { id: 'point_titan', icon: '🏔️', name: 'Point Titan', desc: 'Earn 25,000+ total points', points: 3000 },
    { id: 'ten_sessions_week', icon: '🔟', name: 'Ten Sessions Week', desc: 'Complete 10 sessions in one week', points: 200 },

    // Streaks
    { id: 'three_day_starter', icon: '🔥', name: 'Three Day Starter', desc: 'Practice 3 days in a row', points: 75 },
    { id: 'week_warrior', icon: '🔥', name: 'Week Warrior', desc: 'Practice 7 days in a row', points: 200 },
    { id: 'two_week_streak', icon: '🔥🔥', name: 'Two Week Streak', desc: 'Practice 14 days in a row', points: 350 },
    { id: 'month_master', icon: '👑', name: 'Month Master', desc: 'Practice 30 days in a row', points: 500 },
    { id: 'iron_will', icon: '🛡️', name: 'Iron Will', desc: 'Practice 60 days in a row', points: 1000 },
    { id: 'quarter_year', icon: '🗓️', name: 'Quarter Year', desc: 'Practice 90 days in a row', points: 1500 },
    { id: 'unstoppable', icon: '🌟', name: 'Unstoppable', desc: 'Practice 100 days in a row', points: 2000 },
    { id: 'weekend_streak', icon: '📅', name: 'Weekend Streak', desc: 'Practice every weekend for a month', points: 250 },
    { id: 'phoenix_rising', icon: '🔥', name: 'Phoenix Rising', desc: 'Rebuild a 30+ day streak after breaking one', points: 300 },

    // Distance
    { id: 'baby_steps', icon: '👶', name: 'Baby Steps', desc: 'Practice from 5-10 feet', points: 50 },
    { id: 'long_ranger', icon: '📍', name: 'Long Ranger', desc: 'Practice from 30+ feet', points: 100 },
    { id: 'mid_range_master', icon: '📏', name: 'Mid-Range Master', desc: 'Make 20+ putts from 20-25 feet in one session', points: 150 },
    { id: 'distance_demon', icon: '🚀', name: 'Distance Demon', desc: 'Make 5+ putts from 40+ feet', points: 300 },
    { id: 'downtown_driver', icon: '🏙️', name: 'Downtown Driver', desc: 'Make a putt from 50+ feet', points: 400 },
    { id: 'extreme_range', icon: '🎯', name: 'Extreme Range', desc: 'Make 3+ putts from 60+ feet', points: 600 },
    { id: 'circle_2_hero', icon: '🎯', name: 'Circle 2 Hero', desc: 'Make 10+ putts from Circle 2 (66ft)', points: 750 },
    { id: 'ultra_range', icon: '🚀', name: 'Ultra Range', desc: 'Make a putt from 70+ feet', points: 1000 },
    { id: 'distance_variety', icon: '🌈', name: 'Distance Variety', desc: 'Make putts from 15ft, 20ft, 25ft, 30ft in one session', points: 125 },
    { id: 'graduated_distances', icon: '🎓', name: 'Graduated Distances', desc: 'Complete sessions at every 5ft increment from 10-50ft', points: 400 },

    // Volume
    { id: 'fifty_club', icon: '5️⃣0️⃣', name: 'Fifty Club', desc: 'Make 50 putts in one session', points: 100 },
    { id: 'hundred_club', icon: '💯', name: 'Hundred Club', desc: 'Make 100 putts in one session', points: 200 },
    { id: 'two_hundred_club', icon: '🎊', name: 'Two Hundred Club', desc: 'Make 200 putts in one session', points: 350 },
    { id: 'three_hundred_club', icon: '🎉', name: 'Three Hundred Club', desc: 'Make 300 putts in one session', points: 500 },
    { id: 'five_hundred_club', icon: '🌟', name: 'Five Hundred Club', desc: 'Make 500 putts in one session', points: 1000 },
    { id: 'marathon_putter', icon: '🏃', name: 'Marathon Putter', desc: 'Attempt 500 putts in one session', points: 400 },
    { id: 'iron_man', icon: '🦾', name: 'Iron Man', desc: 'Attempt 1000 putts in one session', points: 750 },
    { id: 'total_makes_1000', icon: '1️⃣', name: 'Total Makes: 1000', desc: 'Make 1,000 total putts all-time', points: 300 },
    { id: 'total_makes_5000', icon: '5️⃣', name: 'Total Makes: 5000', desc: 'Make 5,000 total putts all-time', points: 750 },
    { id: 'total_makes_10000', icon: '🔟', name: 'Total Makes: 10000', desc: 'Make 10,000 total putts all-time', points: 1500 },
    { id: 'daily_hundred', icon: '💯', name: 'Daily Hundred', desc: 'Make 100+ putts in a single day', points: 150 },

    // Routine Achievements
    { id: 'routine_rookie', icon: '📋', name: 'Routine Rookie', desc: 'Complete your first routine', points: 75 },
    { id: 'routine_regular', icon: '📚', name: 'Routine Regular', desc: 'Complete 5 different routines', points: 150 },
    { id: 'routine_master', icon: '🎓', name: 'Routine Master', desc: 'Complete all 4 routines', points: 200 },
    { id: 'ladder_climber', icon: '🪜', name: 'Ladder Climber', desc: 'Complete the Advanced Ladder routine', points: 100 },
    { id: 'consistency_king', icon: '♾️', name: 'Consistency King', desc: 'Complete Consistency Builder 3 times', points: 150 },
    { id: 'routine_addict', icon: '🔄', name: 'Routine Addict', desc: 'Complete 25 total routines', points: 300 },
    { id: 'routine_completionist', icon: '✅', name: 'Routine Completionist', desc: 'Complete 10 different routines', points: 400 },
    { id: 'routine_specialist', icon: '🎯', name: 'Routine Specialist', desc: 'Complete the same routine 10 times', points: 200 },
    { id: 'routine_marathon', icon: '🏃', name: 'Routine Marathon', desc: 'Complete 3 routines in one day', points: 250 },
    { id: 'fifty_routines', icon: '5️⃣0️⃣', name: 'Fifty Routines', desc: 'Complete 50 total routines', points: 500 },
    { id: 'routine_century', icon: '💯', name: 'Routine Century', desc: 'Complete 100 total routines', points: 1000 },

    // Games Achievements
    { id: 'game_on', icon: '🎮', name: 'Game On', desc: 'Complete your first game', points: 50 },
    { id: 'first_game', icon: '🕹️', name: 'First Game', desc: 'Complete your first putting game', points: 50 },
    { id: 'game_sampler', icon: '🎲', name: 'Game Sampler', desc: 'Play 5 different game types', points: 100 },
    { id: 'game_enthusiast', icon: '🎯', name: 'Game Enthusiast', desc: 'Complete 10 putting games', points: 150 },
    { id: 'game_master', icon: '🏆', name: 'Game Master', desc: 'Complete all 7 different game types', points: 350 },
    { id: 'around_the_world_champ', icon: '🌍', name: 'World Champion', desc: 'Complete Around the World in under 15 mins', points: 125 },
    { id: 'horse_master', icon: '🐴', name: 'HORSE Master', desc: 'Win 3 games of HORSE', points: 100 },
    { id: 'horse_warrior', icon: '🐴', name: 'HORSE Warrior', desc: 'Win 10 games of HORSE', points: 250 },
    { id: 'perfect_streak', icon: '🔟', name: 'Perfect Streak', desc: 'Complete Perfect 10 Challenge', points: 200 },
    { id: 'distance_champion', icon: '📏', name: 'Distance Champion', desc: 'Reach 40+ feet in Distance Ladder', points: 175 },
    { id: 'par_shooter', icon: '⛳', name: 'Par Shooter', desc: 'Score par or better in Putting Par Game', points: 125 },
    { id: 'poker_pro', icon: '🃏', name: 'Poker Pro', desc: 'Score 100+ points in Points Poker', points: 150 },
    { id: 'poker_king', icon: '🃏', name: 'Poker King', desc: 'Score 150+ points in Points Poker', points: 300 },
    { id: 'putt_100_master', icon: '💯', name: 'Putt 100 Master', desc: 'Score 80+ on Putt 100', points: 250 },
    { id: 'perfect_score', icon: '💯', name: 'Perfect Score', desc: 'Score 90+ on Putt 100', points: 500 },
    { id: 'game_streak', icon: '🎮', name: 'Game Streak', desc: 'Play 5 games in a row', points: 150 },
    { id: 'competitive_spirit', icon: '🥊', name: 'Competitive Spirit', desc: 'Complete 25 total games', points: 300 },
    { id: 'game_legend', icon: '👑', name: 'Game Legend', desc: 'Complete 50 total games', points: 600 },

    // Social & Competition
    { id: 'social_butterfly', icon: '🦋', name: 'Social Butterfly', desc: 'Add 5 friends', points: 100 },
    { id: 'friend_magnet', icon: '🧲', name: 'Friend Magnet', desc: 'Add 10 friends', points: 200 },
    { id: 'squad_goals', icon: '👥', name: 'Squad Goals', desc: 'Add 20 friends', points: 350 },
    { id: 'social_network', icon: '🌐', name: 'Social Network', desc: 'Add 50 friends', points: 750 },
    { id: 'podium_finish', icon: '🥇', name: 'Podium Finish', desc: 'Reach top 3 on leaderboard', points: 400 },
    { id: 'top_five', icon: '5️⃣', name: 'Top Five', desc: 'Reach top 5 on leaderboard', points: 500 },
    { id: 'top_ten', icon: '🔟', name: 'Top Ten', desc: 'Reach top 10 on leaderboard', points: 250 },
    { id: 'top_twenty', icon: '2️⃣0️⃣', name: 'Top Twenty', desc: 'Reach top 20 on leaderboard', points: 150 },
    { id: 'number_one', icon: '1️⃣', name: 'Number One', desc: 'Reach #1 on leaderboard', points: 1000 },
    { id: 'undefeated_week', icon: '👑', name: 'Undefeated Week', desc: 'Stay in top 10 for 7 consecutive days', points: 400 },
    { id: 'challenge_accepted', icon: '✅', name: 'Challenge Accepted', desc: 'Complete a weekly challenge', points: 150 },
    { id: 'first_competitor', icon: '⚔️', name: 'First Competitor', desc: 'Complete your first multiplayer activity', points: 75 },
    { id: 'team_player', icon: '🤝', name: 'Team Player', desc: 'Log activities for 5 different friends', points: 200 },
    { id: 'coach', icon: '📋', name: 'Coach', desc: 'Log 25 activities for other players', points: 500 },
    { id: 'friendly_rivalry', icon: '⚔️', name: 'Friendly Rivalry', desc: 'Have 3+ friends also using the app', points: 150 },
    { id: 'community_leader', icon: '🏆', name: 'Community Leader', desc: 'Create a custom routine/game that gets 10 completions', points: 500 },

    // Variety & Exploration
    { id: 'distance_explorer', icon: '🗺️', name: 'Distance Explorer', desc: 'Practice from 10 different distances', points: 175 },
    { id: 'all_ranges', icon: '🎨', name: 'All Ranges', desc: 'Practice from 10ft, 20ft, 30ft, 40ft, and 50ft', points: 250 },
    { id: 'versatile_putter', icon: '🎭', name: 'Versatile Putter', desc: 'Complete at least one session, one routine, and one game', points: 200 },

    // Dedication
    { id: 'weekend_warrior', icon: '📅', name: 'Weekend Warrior', desc: 'Practice both Saturday and Sunday', points: 100 },
    { id: 'daily_grinder', icon: '⚙️', name: 'Daily Grinder', desc: 'Practice 365 total days', points: 1500 },
    { id: 'committed', icon: '💍', name: 'Committed', desc: 'Account active for 30 days', points: 200 },
    { id: 'veteran', icon: '🎖️', name: 'Veteran', desc: 'Account active for 90 days', points: 500 },
    { id: 'legend', icon: '⚡', name: 'Legend', desc: 'Account active for 365 days', points: 2000 },

    // Time-Based
    { id: 'lunch_break_putter', icon: '🥪', name: 'Lunch Break Putter', desc: 'Practice during lunch hour (11am-1pm) 10 times', points: 100 },
    { id: 'golden_hour', icon: '🌅', name: 'Golden Hour', desc: 'Practice during sunrise or sunset 5 times', points: 150 },
    { id: 'month_complete', icon: '📅', name: 'Month Complete', desc: 'Practice at least once every week for a month', points: 200 },
    { id: 'quick_session', icon: '⚡', name: 'Quick Session', desc: 'Complete a 100-putt session in under 10 minutes', points: 150 },
    { id: 'marathon_session', icon: '⏰', name: 'Marathon Session', desc: 'Practice for 60+ minutes in one session', points: 200 },
    { id: 'four_seasons', icon: '🍂', name: 'Four Seasons', desc: 'Practice in all 4 seasons of the year', points: 300 },

    // Special Challenges
    { id: 'underdog_victory', icon: '🐕', name: 'Underdog Victory', desc: 'Improve your leaderboard rank by 10+ positions in one week', points: 250 },
    { id: 'personal_best', icon: '🌟', name: 'Personal Best', desc: 'Score 150+ points in a single session', points: 75 },
    { id: 'double_trouble', icon: '2️⃣', name: 'Double Trouble', desc: 'Complete 2 sessions in one day', points: 100 },
    { id: 'triple_play', icon: '3️⃣', name: 'Triple Play', desc: 'Complete 3 sessions in one day', points: 200 },
    { id: 'new_year_resolution', icon: '🎊', name: 'New Year Resolution', desc: 'Practice on January 1st', points: 100 },
    { id: 'holiday_dedication', icon: '🎄', name: 'Holiday Dedication', desc: 'Practice on a major holiday', points: 150 },
    { id: 'birthday_putts', icon: '🎂', name: 'Birthday Putts', desc: 'Practice on your birthday', points: 100 },
    { id: 'weather_warrior', icon: '⛈️', name: 'Weather Warrior', desc: 'Practice in challenging weather conditions', points: 200 },
    { id: 'night_session', icon: '🌙', name: 'Night Session', desc: 'Complete a session after midnight', points: 150 },
    { id: 'sunrise_session', icon: '🌄', name: 'Sunrise Session', desc: 'Practice at sunrise (5-7am)', points: 150 },

    // Improvement & Progress
    { id: 'rising_star', icon: '⭐', name: 'Rising Star', desc: 'Improve accuracy by 10% over 10 sessions', points: 200 },
    { id: 'distance_progression', icon: '📈', name: 'Distance Progression', desc: 'Increase your max distance by 10 feet', points: 150 },
    { id: 'points_surge', icon: '💥', name: 'Points Surge', desc: 'Earn 500+ points in a single day', points: 250 },
    { id: 'consistency_builder', icon: '📊', name: 'Consistency Builder', desc: 'Complete the Consistency Builder routine', points: 200 },
    { id: 'volume_increase', icon: '📈', name: 'Volume Increase', desc: 'Double your average session putts', points: 150 },
    { id: 'personal_record', icon: '🏆', name: 'Personal Record', desc: 'Set a new personal best in any category', points: 100 },
    { id: 'accuracy_climb', icon: '📊', name: 'Accuracy Climb', desc: 'Achieve your best accuracy 3 sessions in a row', points: 250 },
    { id: 'points_doubler', icon: '2️⃣', name: 'Points Doubler', desc: 'Earn 2,000+ total points', points: 175 },

    // Special Achievements
    { id: 'comeback_kid', icon: '💪', name: 'Comeback Kid', desc: 'Return to practice after a 30+ day gap', points: 150 },
    { id: 'profile_complete', icon: '📝', name: 'Profile Complete', desc: 'Fill out all profile fields', points: 100 },
    { id: 'disc_collector', icon: '🥏', name: 'Disc Collector', desc: 'Add all 3 favorite discs to profile', points: 75 },
    { id: 'early_adopter', icon: '🌱', name: 'Early Adopter', desc: 'Join in the first month', points: 500 },
    { id: 'data_enthusiast', icon: '📊', name: 'Data Enthusiast', desc: 'Export your data 10 times', points: 50 },
    { id: 'feedback_contributor', icon: '💬', name: 'Feedback Contributor', desc: 'Submit feedback or a suggestion', points: 100 },
    { id: 'bug_reporter', icon: '🐛', name: 'Bug Reporter', desc: 'Report a bug that gets fixed', points: 200 },
    { id: 'feature_requester', icon: '💡', name: 'Feature Requester', desc: 'Request a feature that gets implemented', points: 500 },
    { id: 'beta_tester', icon: '🧪', name: 'Beta Tester', desc: 'Test a new feature in beta', points: 250 },

    // ========== NEW ACHIEVEMENTS v8.3.26 ==========

    // Skill-Based
    { id: 'sniper', icon: '🎯', name: 'Sniper', desc: 'Make 10 consecutive putts from 30+ feet', points: 300 },
    { id: 'clutch_performer', icon: '💪', name: 'Clutch Performer', desc: 'Hit 90%+ accuracy in a 25+ putt session from 20+ feet', points: 150 },
    { id: 'range_finder', icon: '📡', name: 'Range Finder', desc: 'Practice from 5 different distances in one week', points: 200 },
    { id: 'no_warmup_needed', icon: '🔥', name: 'No Warm-Up Needed', desc: 'Make 15+ putts at 100% accuracy', points: 200 },
    { id: 'finishing_strong', icon: '🏁', name: 'Finishing Strong', desc: 'Complete 5 sessions with 90%+ accuracy', points: 150 },

    // Streak & Consistency
    { id: 'hump_day_hero', icon: '🐪', name: 'Hump Day Hero', desc: 'Practice on 4 Wednesdays in a month', points: 150 },
    { id: 'monday_motivation', icon: '📆', name: 'Monday Motivation', desc: 'Practice on 10 Mondays', points: 125 },
    { id: 'streak_saver', icon: '🛟', name: 'Streak Saver', desc: 'Maintain an 18+ day streak', points: 150 },
    { id: 'twice_is_nice', icon: '✌️', name: 'Twice is Nice', desc: 'Complete 2 activities in one day, 10 different days', points: 200 },
    { id: 'streak_builder', icon: '🧱', name: 'Streak Builder', desc: 'Achieve a 7+ day streak 3 different times', points: 175 },

    // Game-Specific
    { id: 'atw_traveler', icon: '🌍', name: 'Around the World Traveler', desc: 'Complete Around the World 10 times', points: 200 },
    { id: 'ladder_master', icon: '🪜', name: 'Ladder Master', desc: 'Reach 50ft in Distance Ladder', points: 300 },
    { id: 'perfect_ten_legend', icon: '🔟', name: 'Perfect Ten Legend', desc: 'Get a 15+ streak in Perfect 10', points: 400 },
    { id: 'poker_face', icon: '😐', name: 'Poker Face', desc: 'Score 100+ in Points Poker 5 times', points: 250 },
    { id: 'bracket_debut', icon: '🎫', name: 'Bracket Debut', desc: 'Play in a Putting Tournament', points: 100 },
    { id: 'tournament_champion', icon: '🏆', name: 'Tournament Champion', desc: 'Win a Putting Tournament', points: 500 },
    { id: 'bracket_survivor', icon: '🧗', name: 'Bracket Survivor', desc: 'Win a tournament after losing a match', points: 750 },
    { id: 'flawless_champion', icon: '💎', name: 'Flawless Champion', desc: 'Win a tournament without losing a match', points: 750 },
    { id: 'tournament_dynasty', icon: '👑', name: 'Tournament Dynasty', desc: 'Win 5 Putting Tournaments', points: 1000 },
    { id: 'joes_regular', icon: '🍺', name: "Joe's Regular", desc: "Play Joe's Putting League game 10 times", points: 200 },
    { id: 'par_excellence', icon: '⛳', name: 'Par Excellence', desc: 'Shoot under par in Putting Par 3 times', points: 250 },
    { id: 'horse_whisperer', icon: '🐴', name: 'HORSE Whisperer', desc: 'Win 5 games of HORSE', points: 350 },

    // Routine-Specific
    { id: 'routine_machine', icon: '🤖', name: 'Routine Machine', desc: 'Complete 5 routines in one day', points: 300 },
    { id: 'perfect_routine', icon: '💎', name: 'Perfect Routine', desc: 'Complete any routine at 95%+ accuracy', points: 300 },
    { id: 'routine_speedster', icon: '⚡', name: 'Routine Speedster', desc: 'Complete a routine in under 15 minutes', points: 150 },
    { id: 'all_rounder', icon: '🎪', name: 'All-Rounder', desc: 'Complete all 9 suggested routines', points: 500 },

    // Weather & Conditions
    { id: 'heat_wave', icon: '🔥', name: 'Heat Wave', desc: 'Practice when temperature is 100°F+', points: 150 },
    { id: 'cold_blooded', icon: '🥶', name: 'Cold Blooded', desc: 'Practice when temperature is below 50°F', points: 150 },
    { id: 'wind_warrior', icon: '💨', name: 'Wind Warrior', desc: 'Practice in 15+ mph winds', points: 175 },
    { id: 'rain_or_shine', icon: '🌧️', name: 'Rain or Shine', desc: 'Practice in rainy conditions', points: 125 },
    { id: 'desert_rat', icon: '🏜️', name: 'Desert Rat', desc: 'Practice 10 times in hot weather (90°F+)', points: 250 },

    // Social & Multiplayer
    { id: 'party_host', icon: '🎉', name: 'Party Host', desc: 'Log a multiplayer session with 4+ players', points: 200 },
    { id: 'generous_logger', icon: '📝', name: 'Generous Logger', desc: 'Log 50 activities for other players', points: 300 },
    { id: 'rivalry', icon: '⚔️', name: 'Rivalry', desc: 'Complete 10 H2H challenges', points: 250 },
    { id: 'challenge_champion', icon: '🏅', name: 'Challenge Champion', desc: 'Win 10 H2H challenges', points: 300 },
    { id: 'social_scorer', icon: '📊', name: 'Social Scorer', desc: 'Have 10 friends on the app', points: 150 },

    // Stats & Milestones
    { id: 'fifty_k_club', icon: '5️⃣', name: '50K Club', desc: 'Reach 50,000 total points', points: 500 },
    { id: 'hundred_k_legend', icon: '💯', name: '100K Legend', desc: 'Reach 100,000 total points', points: 1000 },
    { id: 'twenty_five_k_makes', icon: '🎯', name: '25K Makes', desc: 'Make 25,000 total putts', points: 750 },
    { id: 'hour_logger', icon: '⏱️', name: 'Hour Logger', desc: 'Log 100 hours of practice time', points: 400 },
    { id: 'distance_traveler', icon: '🛣️', name: 'Distance Traveler', desc: 'Cumulative putting distance of 1 mile', points: 350 },

    // Fun & Quirky
    { id: 'lucky_seven', icon: '🍀', name: 'Lucky 7', desc: 'Log a session with exactly 77% accuracy', points: 77 },
    { id: 'nice', icon: '😎', name: 'Nice', desc: 'Score exactly 69 points in a session', points: 69 },
    { id: 'century_match', icon: '💯', name: 'Century Match', desc: 'Make exactly 100 putts at 100% accuracy', points: 200 },
    { id: 'palindrome', icon: '🔢', name: 'Palindrome', desc: 'Log a session at 11:11 AM or PM', points: 111 },
    { id: 'full_moon_putter', icon: '🌕', name: 'Full Moon Putter', desc: 'Practice during a full moon phase', points: 150 },

    // Season & Competition
    { id: 'season_starter', icon: '🚀', name: 'Season Starter', desc: 'Earn XP on the first day of a season', points: 100 },
    { id: 'season_finisher', icon: '🏁', name: 'Season Finisher', desc: 'Earn XP on the last day of a season', points: 100 },
    { id: 'level_25', icon: '5️⃣', name: 'Level 5', desc: 'Reach Season Level 5', points: 250 },
    { id: 'level_10', icon: '🔟', name: 'Level 10', desc: 'Reach Season Level 10', points: 500 },
    { id: 'max_level', icon: '👑', name: 'Max Level', desc: 'Reach Season Level 15 (max)', points: 1000 },

    // Special / Founder
    { id: 'founder_1', icon: '🏆', name: 'Founder', desc: 'Early supporter of Putting Improver', points: 500 },
    { id: 'community_1', icon: '🌟', name: 'Community Contributor', desc: 'Contributed to the Putting Improver community', points: 250 }
];

export const MOTIVATIONAL_QUOTES = [
    "Every putt is a new opportunity.",
    "Consistency builds champions.",
    "Practice with purpose, play with confidence.",
    "The chains don't lie.",
    "Trust your routine.",
    "Focus on the process, not the outcome.",
    "Great putters are made, not born.",
    "Your only limit is you.",
    "Confidence comes from preparation.",
    "Make every putt count."
];

export const SUGGESTED_ROUTINES = [
    // BEGINNER (5 routines)
    {
        id: 'beginner_10ft',
        name: 'Beginner 10ft',
        description: 'Build confidence from close range',
        level: 'Beginner',
        duration: '15 mins',
        drills: [
            { distance: 10, attempts: 20, description: 'Warm up - get a feel for the chains' },
            { distance: 10, attempts: 30, description: 'Focus on smooth release' }
        ]
    },
    {
        id: 'beginner_short_game',
        name: 'Short Game Foundation',
        description: 'Master the basics within 15 feet',
        level: 'Beginner',
        duration: '20 mins',
        drills: [
            { distance: 8, attempts: 20, description: 'Guaranteed makes - build confidence' },
            { distance: 12, attempts: 25, description: 'Focus on follow-through' },
            { distance: 15, attempts: 20, description: 'Slight challenge' }
        ]
    },
    {
        id: 'beginner_form_focus',
        name: 'Form & Fundamentals',
        description: 'Slow and steady, perfect your technique',
        level: 'Beginner',
        duration: '18 mins',
        drills: [
            { distance: 10, attempts: 15, description: 'Slow motion practice' },
            { distance: 15, attempts: 20, description: 'Normal speed with form checks' },
            { distance: 10, attempts: 15, description: 'Speed up while maintaining form' }
        ]
    },
    {
        id: 'beginner_circle_1',
        name: 'Circle 1 Confidence',
        description: 'Practice inside Circle 1 (33 feet)',
        level: 'Beginner',
        duration: '22 mins',
        drills: [
            { distance: 15, attempts: 20, description: 'Inner circle practice' },
            { distance: 20, attempts: 20, description: 'Mid-range confidence' },
            { distance: 25, attempts: 15, description: 'Pushing toward Circle 1 edge' }
        ]
    },
    {
        id: 'beginner_consistency',
        name: 'Consistency Drills',
        description: 'Build repeatable putting motion',
        level: 'Beginner',
        duration: '20 mins',
        drills: [
            { distance: 12, attempts: 30, description: 'Same spot, same motion' },
            { distance: 18, attempts: 25, description: 'Extend the pattern' }
        ]
    },

    // INTERMEDIATE (6 routines)
    {
        id: 'intermediate_mixed',
        name: 'Intermediate Mixed',
        description: 'Practice from multiple distances',
        level: 'Intermediate',
        duration: '25 mins',
        drills: [
            { distance: 15, attempts: 20, description: 'Build consistency' },
            { distance: 20, attempts: 20, description: 'Challenge your accuracy' },
            { distance: 25, attempts: 15, description: 'Push your range' }
        ]
    },
    {
        id: 'intermediate_ladder_up',
        name: 'Ladder Up',
        description: 'Progressive distance increases',
        level: 'Intermediate',
        duration: '28 mins',
        drills: [
            { distance: 15, attempts: 15, description: 'Warm up' },
            { distance: 20, attempts: 15, description: 'Step back' },
            { distance: 25, attempts: 15, description: 'Moderate challenge' },
            { distance: 30, attempts: 12, description: 'Long putts' }
        ]
    },
    {
        id: 'intermediate_circle_edge',
        name: 'Circle Edge Training',
        description: 'Master the 30-33 foot range',
        level: 'Intermediate',
        duration: '25 mins',
        drills: [
            { distance: 28, attempts: 20, description: 'Just inside the edge' },
            { distance: 30, attempts: 20, description: 'Right at Circle 1' },
            { distance: 33, attempts: 15, description: 'Maximum Circle 1 distance' }
        ]
    },
    {
        id: 'intermediate_pressure',
        name: 'Pressure Situations',
        description: 'Make it when it counts',
        level: 'Intermediate',
        duration: '24 mins',
        drills: [
            { distance: 20, attempts: 10, description: 'Must make 8/10' },
            { distance: 25, attempts: 10, description: 'Must make 6/10' },
            { distance: 30, attempts: 10, description: 'Must make 4/10' },
            { distance: 20, attempts: 15, description: 'Finish strong' }
        ]
    },
    {
        id: 'intermediate_angles',
        name: 'Angle Practice',
        description: 'Different approaches to the basket',
        level: 'Intermediate',
        duration: '26 mins',
        drills: [
            { distance: 20, attempts: 15, description: 'Straight on' },
            { distance: 20, attempts: 15, description: 'From left side' },
            { distance: 20, attempts: 15, description: 'From right side' },
            { distance: 20, attempts: 10, description: 'Behind obstacles' }
        ]
    },
    {
        id: 'intermediate_comeback',
        name: 'Comeback Putts',
        description: 'Practice your second putts',
        level: 'Intermediate',
        duration: '23 mins',
        drills: [
            { distance: 25, attempts: 20, description: 'First putt attempt' },
            { distance: 8, attempts: 20, description: 'Tap-in practice' },
            { distance: 15, attempts: 15, description: 'Common comeback distance' }
        ]
    },

    // ADVANCED (6 routines)
    {
        id: 'advanced_ladder',
        name: 'Advanced Ladder',
        description: 'Progressive distance challenge',
        level: 'Advanced',
        duration: '35 mins',
        drills: [
            { distance: 15, attempts: 15, description: 'Start close' },
            { distance: 20, attempts: 15, description: 'Step back' },
            { distance: 25, attempts: 15, description: 'Increase difficulty' },
            { distance: 30, attempts: 10, description: 'Long range practice' },
            { distance: 35, attempts: 10, description: 'Maximum distance' }
        ]
    },
    {
        id: 'advanced_long_range',
        name: 'Long Range Power',
        description: 'Build confidence beyond Circle 1',
        level: 'Advanced',
        duration: '30 mins',
        drills: [
            { distance: 35, attempts: 20, description: 'Circle 2 practice' },
            { distance: 40, attempts: 15, description: 'Extended range' },
            { distance: 45, attempts: 12, description: 'Long bombs' },
            { distance: 30, attempts: 15, description: 'Finish closer in' }
        ]
    },
    {
        id: 'advanced_tournament_prep',
        name: 'Tournament Prep',
        description: 'Simulate tournament pressure',
        level: 'Advanced',
        duration: '32 mins',
        drills: [
            { distance: 25, attempts: 18, description: 'Must make 15/18 (tournament %)' },
            { distance: 30, attempts: 18, description: 'Must make 12/18' },
            { distance: 20, attempts: 18, description: 'Must make 16/18' },
            { distance: 35, attempts: 10, description: 'Bonus round' }
        ]
    },
    {
        id: 'advanced_endurance',
        name: 'Putting Endurance',
        description: 'Maintain form under fatigue',
        level: 'Advanced',
        duration: '40 mins',
        drills: [
            { distance: 20, attempts: 30, description: 'Volume round 1' },
            { distance: 25, attempts: 30, description: 'Volume round 2' },
            { distance: 30, attempts: 25, description: 'Distance & fatigue' },
            { distance: 15, attempts: 20, description: 'Tired but accurate' }
        ]
    },
    {
        id: 'advanced_all_ranges',
        name: 'Complete Range Mastery',
        description: 'Every distance from 10 to 40',
        level: 'Advanced',
        duration: '38 mins',
        drills: [
            { distance: 10, attempts: 10, description: 'Tap-ins' },
            { distance: 15, attempts: 12, description: 'Easy makes' },
            { distance: 20, attempts: 15, description: 'Bread and butter' },
            { distance: 25, attempts: 15, description: 'Challenge zone' },
            { distance: 30, attempts: 12, description: 'Circle 1 edge' },
            { distance: 35, attempts: 10, description: 'Circle 2' },
            { distance: 40, attempts: 8, description: 'Long range' }
        ]
    },
    {
        id: 'advanced_speed_round',
        name: 'Speed Round',
        description: 'Fast-paced putting rhythm',
        level: 'Advanced',
        duration: '20 mins',
        drills: [
            { distance: 20, attempts: 25, description: 'Quick rhythm - 30 seconds per putt' },
            { distance: 25, attempts: 25, description: 'Maintain speed' },
            { distance: 30, attempts: 20, description: 'Fast but focused' }
        ]
    },

    // EXPERT (3 routines)
    {
        id: 'expert_ultimate_test',
        name: 'Ultimate Putting Test',
        description: 'The most comprehensive routine',
        level: 'Expert',
        duration: '50 mins',
        drills: [
            { distance: 15, attempts: 20, description: 'Perfect warm-up' },
            { distance: 20, attempts: 25, description: 'Core distance 1' },
            { distance: 25, attempts: 25, description: 'Core distance 2' },
            { distance: 30, attempts: 20, description: 'Core distance 3' },
            { distance: 35, attempts: 15, description: 'Extended range' },
            { distance: 40, attempts: 15, description: 'Long bombs' },
            { distance: 45, attempts: 10, description: 'Maximum distance' },
            { distance: 20, attempts: 20, description: 'Cool down & finish strong' }
        ]
    },
    {
        id: 'expert_100_putt_challenge',
        name: '100 Putt Challenge',
        description: 'Century of putts at various distances',
        level: 'Expert',
        duration: '45 mins',
        drills: [
            { distance: 20, attempts: 40, description: 'Volume at core distance' },
            { distance: 30, attempts: 35, description: 'Long-range volume' },
            { distance: 40, attempts: 25, description: 'Maximum challenge' }
        ]
    },
    {
        id: 'expert_perfect_practice',
        name: 'Perfect Practice Protocol',
        description: 'Every putt must count',
        level: 'Expert',
        duration: '42 mins',
        drills: [
            { distance: 15, attempts: 15, description: 'Must make 14/15' },
            { distance: 20, attempts: 20, description: 'Must make 17/20' },
            { distance: 25, attempts: 20, description: 'Must make 15/20' },
            { distance: 30, attempts: 20, description: 'Must make 12/20' },
            { distance: 35, attempts: 15, description: 'Must make 8/15' },
            { distance: 25, attempts: 15, description: 'Finish at medium range' }
        ]
    }
];

export const PUTTING_GAMES = [
    {
        id: 'around_the_world',
        name: 'Around the World',
        description: 'Make putts from 8 different positions around the basket',
        difficulty: 'Easy',
        duration: '15-20 mins',
        instructions: [
            'Set up 8 positions in a circle around the basket at 15 feet',
            'Start at position 1 and make 3 putts',
            'Move to the next position only after making 3 putts',
            'Complete all 8 positions as fast as possible'
        ],
        scoring: {
            type: 'time',
            goal: 'Complete in under 15 minutes',
            points: 'Track your best time'
        }
    },
    {
        id: 'horse',
        name: 'HORSE (Disc Golf Edition)',
        description: 'Challenge a friend to match your putting shots',
        difficulty: 'Medium',
        duration: '20-30 mins',
        instructions: [
            'Player 1 calls a distance and position, then takes a putt',
            'If they make it, Player 2 must match from the same spot',
            'If Player 2 misses, they get a letter (H-O-R-S-E)',
            'First player to spell HORSE loses',
            'Can add style points: straddle, left-hand, etc.'
        ],
        scoring: {
            type: 'elimination',
            goal: 'Avoid spelling HORSE',
            points: 'Winner gets bragging rights!'
        }
    },
    {
        id: 'ladder_challenge',
        name: 'Distance Ladder Challenge',
        description: 'Progressive distance challenge to test your range',
        difficulty: 'Hard',
        duration: '25-35 mins',
        instructions: [
            'Start at 10 feet - make 3 putts to advance',
            'Move back 5 feet after each successful round',
            'Continue until you miss 3 putts at a distance',
            'Record your maximum distance achieved'
        ],
        scoring: {
            type: 'distance',
            goal: 'Reach 40+ feet',
            points: '10 points per successful distance level'
        }
    },
    {
        id: 'par_game',
        name: 'Putting Par Game',
        description: 'Score par or better on a putting course',
        difficulty: 'Medium',
        duration: '20-25 mins',
        instructions: [
            'Set up 9 "holes" at various distances (10-30 feet)',
            'Par is 2 putts per hole (make within 2 attempts)',
            'Birdie = 1 putt, Bogey = 3+ putts',
            'Try to score par (18) or better for the course'
        ],
        scoring: {
            type: 'strokes',
            goal: 'Score par (18) or better',
            points: 'Track your score vs. par'
        }
    },
    {
        id: 'perfect_10',
        name: 'Perfect 10 Challenge',
        description: 'Make 10 putts in a row without a miss',
        difficulty: 'Hard',
        duration: '15-20 mins',
        instructions: [
            'Choose your distance (recommended 15-20 feet)',
            'Attempt to make 10 consecutive putts',
            'Any miss resets your streak to zero',
            'Track how many attempts it takes to achieve'
        ],
        scoring: {
            type: 'streak',
            goal: 'Make 10 in a row',
            points: 'Bonus: Try from longer distances'
        }
    },
    {
        id: 'points_poker',
        name: 'Points Poker',
        description: 'Earn points for different putting achievements',
        difficulty: 'Easy',
        duration: '30 mins',
        instructions: [
            'Set time limit (30 minutes)',
            'Earn points: Inside circle = 1pt, 20ft = 2pts, 30ft = 3pts, 40ft+ = 5pts',
            'Bonus: 3 in a row from same distance = 2x multiplier',
            'Try to score 100+ points in the time limit'
        ],
        scoring: {
            type: 'points',
            goal: 'Score 100+ points',
            points: 'Distance-based scoring with bonuses'
        }
    },
    {
        id: 'joes_monday_night',
        name: "Joe's Monday Night Putting",
        description: '6 stations, 2 putts each - escalating points per station',
        difficulty: 'Medium',
        duration: '15-20 mins',
        instructions: [
            'Station 1: 2 putts @ 1 point each (2 pts possible)',
            'Station 2: 2 putts @ 2 points each (4 pts possible)',
            'Station 3: 2 putts @ 3 points each (6 pts possible)',
            'Station 4: 2 putts @ 4 points each (8 pts possible)',
            'Station 5: 2 putts @ 5 points each (10 pts possible)',
            'Station 6: 2 putts @ 6 points each (12 pts possible)',
            'Total possible: 42 points - highest score wins!'
        ],
        scoring: {
            type: 'points',
            goal: 'Score 30+ points',
            points: 'Total points from all stations'
        }
    },
    {
        id: 'putt_100_by_10',
        name: 'Putt 100 by 10',
        description: '10 attempts with max 10 putts each - highest percentage wins',
        difficulty: 'Medium',
        duration: '20-30 mins',
        instructions: [
            'Choose your putting distance',
            '10 scoring attempts total',
            'Each attempt: throw up to 10 putts',
            'Log how many you made (0-10)',
            'Highest percentage wins'
        ],
        scoring: {
            type: 'percentage',
            goal: 'Achieve 70%+ accuracy',
            points: 'Percentage of total makes'
        }
    },
    {
        id: 'putt_100_by_5',
        name: 'Putt 100 by 5',
        description: '20 attempts with max 5 putts each - highest percentage wins',
        difficulty: 'Medium',
        duration: '25-35 mins',
        instructions: [
            'Choose your putting distance',
            '20 scoring attempts total',
            'Each attempt: throw up to 5 putts',
            'Log how many you made (0-5)',
            'Highest percentage wins'
        ],
        scoring: {
            type: 'percentage',
            goal: 'Achieve 70%+ accuracy',
            points: 'Percentage of total makes'
        }
    },
    {
        id: 'putt_100_by_2',
        name: 'Putt 100 by 2',
        description: '50 attempts with max 2 putts each - highest percentage wins',
        difficulty: 'Hard',
        duration: '30-45 mins',
        instructions: [
            'Choose your putting distance',
            '50 scoring attempts total',
            'Each attempt: throw up to 2 putts',
            'Log how many you made (0-2)',
            'Highest percentage wins'
        ],
        scoring: {
            type: 'percentage',
            goal: 'Achieve 70%+ accuracy',
            points: 'Percentage of total makes'
        }
    },
    {
        id: 'putting_tournament',
        name: 'Putting Tournament',
        description: 'Double-elimination bracket - head-to-head races until one putter is left standing',
        difficulty: 'Hard',
        duration: '45-90 mins',
        minPlayers: 2,
        instructions: [
            'Pick your participants - they are drawn into a random bracket',
            'Each match is a race: first to the target number of makes wins',
            'Lose once and you drop into the losers bracket',
            'Lose twice and you are out',
            'The bracket updates after every match until a champion remains'
        ],
        scoring: {
            type: 'percentage',
            goal: 'Win the tournament',
            points: 'Accuracy across all your matches, plus a placement bonus'
        }
    }
];
