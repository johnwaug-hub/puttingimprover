/**
 * Application Constants
 * All magic numbers and configuration values in one place
 */

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
    { type: 'accuracy', target: 80, desc: 'Achieve 80%+ accuracy in a session', reward: 500 },
    { type: 'distance', target: 30, desc: 'Make 5+ putts from 30+ feet', reward: 400 },
    { type: 'volume', target: 50, desc: 'Make 50+ total putts this week', reward: 600 },
    { type: 'streak', target: 5, desc: 'Practice 5 days this week', reward: 700 },
    { type: 'points', target: 500, desc: 'Score 500+ points in one session', reward: 800 }
];

export const ACHIEVEMENTS_CONFIG = [
    { id: 'first_steps', icon: '🎯', name: 'First Steps', desc: 'Complete your first practice session', points: 50 },
    { id: 'perfect_10', icon: '💯', name: 'Perfect 10', desc: 'Make 10 putts in a row at 100%', points: 100 },
    { id: 'century_club', icon: '💪', name: 'Century Club', desc: 'Score 100+ points in one session', points: 150 },
    { id: 'week_warrior', icon: '🔥', name: 'Week Warrior', desc: 'Practice 7 days in a row', points: 200 },
    { id: 'month_master', icon: '👑', name: 'Month Master', desc: 'Practice 30 days in a row', points: 500 },
    { id: 'distance_demon', icon: '🚀', name: 'Distance Demon', desc: 'Make 5+ putts from 40+ feet', points: 300 },
    { id: 'social_butterfly', icon: '🦋', name: 'Social Butterfly', desc: 'Add 5 friends', points: 100 },
    { id: 'point_king', icon: '⭐', name: 'Point King', desc: 'Earn 1000+ total points', points: 250 },
    { id: 'podium_finish', icon: '🥇', name: 'Podium Finish', desc: 'Reach top 3 on leaderboard', points: 400 },
    { id: 'challenge_accepted', icon: '✅', name: 'Challenge Accepted', desc: 'Complete a weekly challenge', points: 150 }
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
        id: 'consistency_builder',
        name: 'Consistency Builder',
        description: 'Lock in your form from one distance',
        level: 'All Levels',
        duration: '20 mins',
        drills: [
            { distance: 20, attempts: 50, description: 'Find your rhythm and repeat' }
        ]
    }
];
