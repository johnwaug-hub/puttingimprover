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
    // Getting Started
    { id: 'first_steps', icon: '🎯', name: 'First Steps', desc: 'Complete your first practice session', points: 50 },
    { id: 'early_bird', icon: '🌅', name: 'Early Bird', desc: 'Practice before 8am', points: 75 },
    { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Practice after 8pm', points: 75 },
    
    // Accuracy Achievements
    { id: 'perfect_10', icon: '💯', name: 'Perfect 10', desc: 'Make 10 putts in a row at 100%', points: 100 },
    { id: 'ninety_percent_club', icon: '🎖️', name: '90% Club', desc: 'Achieve 90%+ accuracy in a session', points: 125 },
    { id: 'flawless', icon: '✨', name: 'Flawless', desc: 'Complete a 50-putt session at 100%', points: 250 },
    { id: 'sharpshooter', icon: '🎪', name: 'Sharpshooter', desc: 'Hit 95%+ accuracy from 20+ feet', points: 200 },
    
    // Points & Sessions
    { id: 'century_club', icon: '💪', name: 'Century Club', desc: 'Score 100+ points in one session', points: 150 },
    { id: 'half_century', icon: '⚡', name: 'Half Century', desc: 'Complete 50 practice sessions', points: 300 },
    { id: 'centurion', icon: '🏛️', name: 'Centurion', desc: 'Complete 100 practice sessions', points: 500 },
    { id: 'point_king', icon: '⭐', name: 'Point King', desc: 'Earn 1000+ total points', points: 250 },
    { id: 'point_legend', icon: '💎', name: 'Point Legend', desc: 'Earn 5000+ total points', points: 750 },
    
    // Streaks
    { id: 'week_warrior', icon: '🔥', name: 'Week Warrior', desc: 'Practice 7 days in a row', points: 200 },
    { id: 'two_week_streak', icon: '🔥🔥', name: 'Two Week Streak', desc: 'Practice 14 days in a row', points: 350 },
    { id: 'month_master', icon: '👑', name: 'Month Master', desc: 'Practice 30 days in a row', points: 500 },
    { id: 'iron_will', icon: '🛡️', name: 'Iron Will', desc: 'Practice 60 days in a row', points: 1000 },
    { id: 'unstoppable', icon: '🌟', name: 'Unstoppable', desc: 'Practice 100 days in a row', points: 2000 },
    
    // Distance
    { id: 'long_ranger', icon: '📍', name: 'Long Ranger', desc: 'Practice from 30+ feet', points: 100 },
    { id: 'distance_demon', icon: '🚀', name: 'Distance Demon', desc: 'Make 5+ putts from 40+ feet', points: 300 },
    { id: 'downtown_driver', icon: '🏙️', name: 'Downtown Driver', desc: 'Make a putt from 50+ feet', points: 400 },
    { id: 'extreme_range', icon: '🎯', name: 'Extreme Range', desc: 'Make 3+ putts from 60+ feet', points: 600 },
    
    // Volume
    { id: 'hundred_club', icon: '💯', name: 'Hundred Club', desc: 'Make 100 putts in one session', points: 200 },
    { id: 'two_hundred_club', icon: '🎊', name: 'Two Hundred Club', desc: 'Make 200 putts in one session', points: 350 },
    { id: 'marathon_putter', icon: '🏃', name: 'Marathon Putter', desc: 'Attempt 500 putts in one session', points: 400 },
    { id: 'iron_man', icon: '🦾', name: 'Iron Man', desc: 'Attempt 1000 putts in one session', points: 750 },
    
    // Routine Achievements
    { id: 'routine_rookie', icon: '📋', name: 'Routine Rookie', desc: 'Complete your first routine', points: 75 },
    { id: 'routine_regular', icon: '📚', name: 'Routine Regular', desc: 'Complete 5 different routines', points: 150 },
    { id: 'routine_master', icon: '🎓', name: 'Routine Master', desc: 'Complete all 4 routines', points: 200 },
    { id: 'ladder_climber', icon: '🪜', name: 'Ladder Climber', desc: 'Complete the Advanced Ladder routine', points: 100 },
    { id: 'consistency_king', icon: '♾️', name: 'Consistency King', desc: 'Complete Consistency Builder 3 times', points: 150 },
    { id: 'routine_addict', icon: '🔄', name: 'Routine Addict', desc: 'Complete 25 total routines', points: 300 },
    
    // Games Achievements  
    { id: 'game_on', icon: '🎮', name: 'Game On', desc: 'View the Games tab', points: 25 },
    { id: 'first_game', icon: '🕹️', name: 'First Game', desc: 'Complete your first putting game', points: 50 },
    { id: 'game_enthusiast', icon: '🎯', name: 'Game Enthusiast', desc: 'Complete 10 putting games', points: 150 },
    { id: 'game_master', icon: '🏆', name: 'Game Master', desc: 'Complete all 7 different game types', points: 350 },
    { id: 'around_the_world_champ', icon: '🌍', name: 'World Champion', desc: 'Complete Around the World in under 15 mins', points: 125 },
    { id: 'horse_master', icon: '🐴', name: 'HORSE Master', desc: 'Win 3 games of HORSE', points: 100 },
    { id: 'perfect_streak', icon: '🔟', name: 'Perfect Streak', desc: 'Complete Perfect 10 Challenge', points: 200 },
    { id: 'distance_champion', icon: '📏', name: 'Distance Champion', desc: 'Reach 40+ feet in Distance Ladder', points: 175 },
    { id: 'par_shooter', icon: '⛳', name: 'Par Shooter', desc: 'Score par or better in Putting Par Game', points: 125 },
    { id: 'poker_pro', icon: '🃏', name: 'Poker Pro', desc: 'Score 100+ points in Points Poker', points: 150 },
    { id: 'putt_100_master', icon: '💯', name: 'Putt 100 Master', desc: 'Score 80+ on Putt 100', points: 250 },
    
    // Social & Competition
    { id: 'social_butterfly', icon: '🦋', name: 'Social Butterfly', desc: 'Add 5 friends', points: 100 },
    { id: 'friend_magnet', icon: '🧲', name: 'Friend Magnet', desc: 'Add 10 friends', points: 200 },
    { id: 'podium_finish', icon: '🥇', name: 'Podium Finish', desc: 'Reach top 3 on leaderboard', points: 400 },
    { id: 'top_ten', icon: '🔟', name: 'Top Ten', desc: 'Reach top 10 on leaderboard', points: 250 },
    { id: 'number_one', icon: '1️⃣', name: 'Number One', desc: 'Reach #1 on leaderboard', points: 1000 },
    { id: 'challenge_accepted', icon: '✅', name: 'Challenge Accepted', desc: 'Complete a weekly challenge', points: 150 },
    
    // Variety & Exploration
    { id: 'distance_explorer', icon: '🗺️', name: 'Distance Explorer', desc: 'Practice from 10 different distances', points: 175 },
    { id: 'all_ranges', icon: '🎨', name: 'All Ranges', desc: 'Practice from 10ft, 20ft, 30ft, 40ft, and 50ft', points: 250 },
    { id: 'versatile_putter', icon: '🎭', name: 'Versatile Putter', desc: 'Complete sessions, routines, and games', points: 200 },
    
    // Dedication
    { id: 'weekend_warrior', icon: '📅', name: 'Weekend Warrior', desc: 'Practice both Saturday and Sunday', points: 100 },
    { id: 'daily_grinder', icon: '⚙️', name: 'Daily Grinder', desc: 'Practice 365 total days', points: 1500 },
    { id: 'committed', icon: '💍', name: 'Committed', desc: 'Account active for 30 days', points: 200 },
    { id: 'veteran', icon: '🎖️', name: 'Veteran', desc: 'Account active for 90 days', points: 500 },
    { id: 'legend', icon: '⚡', name: 'Legend', desc: 'Account active for 365 days', points: 2000 },
    
    // Special Achievements
    { id: 'comeback_kid', icon: '💪', name: 'Comeback Kid', desc: 'Return to practice after 30+ day break', points: 150 },
    { id: 'profile_complete', icon: '📝', name: 'Profile Complete', desc: 'Fill out all profile fields', points: 100 },
    { id: 'disc_collector', icon: '🥏', name: 'Disc Collector', desc: 'Add all 3 favorite discs to profile', points: 75 },
    { id: 'early_adopter', icon: '🌱', name: 'Early Adopter', desc: 'Join in the first month', points: 500 }
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
        id: 'putt_100',
        name: 'Putt 100',
        description: 'Track 10 separate turns of putting - each turn can have custom attempts',
        difficulty: 'Medium',
        duration: '30-40 mins',
        instructions: [
            'Choose your putting distance (15-25 feet recommended)',
            'Throw putts in 10 separate turns (usually 10 attempts per turn)',
            'After each turn, log makes and attempts (e.g., 7/10, 8/10, etc.)',
            'Can customize attempts per turn (throw 5, 10, 15, or any amount)',
            'Goal is to achieve high accuracy across all 10 turns'
        ],
        scoring: {
            type: 'rotations',
            goal: 'Make 70+ out of 100',
            points: 'Track total makes, attempts, and percentage'
        }
    }
];
