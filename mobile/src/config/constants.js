// App constants and configuration

export const APP_CONFIG = {
  APP_NAME: 'Putting Improver',
  ORGANIZATION: 'Lock Jaw Disc Golf',
  LOCATION: 'Tucson, AZ',
  VERSION: '2.0.0',
  BUILD_NUMBER: 1,
  
  // Support
  SUPPORT_EMAIL: 'support@lockjawdiscgolf.com',
  WEBSITE: 'https://lockjawdiscgolf.com',
  
  // Social
  INSTAGRAM: '@lockjawdiscgolf',
  FACEBOOK: 'LockJawDiscGolf',
};

// Point calculation configuration
export const POINTS_CONFIG = {
  DISTANCE_MULTIPLIER: 0.1,
  ACCURACY_MULTIPLIER: 0.01,
  BASE_MULTIPLIER: 10,
  CHALLENGE_BONUS: 50,
  STREAK_BONUS_PER_DAY: 5,
};

// Validation limits
export const LIMITS = {
  MAX_DISTANCE: 100, // feet
  MIN_DISTANCE: 5,   // feet
  MAX_ATTEMPTS: 100,
  MIN_ATTEMPTS: 1,
  MAX_MAKES: 100,
  MIN_MAKES: 0,
};

// Achievement thresholds
export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first practice session',
    icon: '🎯',
    requirement: 1,
  },
  PERFECT_10: {
    id: 'perfect_10',
    name: 'Perfect 10',
    description: 'Make 10 putts in a row at 100%',
    icon: '💯',
    requirement: 10,
  },
  CENTURY_CLUB: {
    id: 'century_club',
    name: 'Century Club',
    description: 'Score 100+ points in one session',
    icon: '💪',
    requirement: 100,
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Practice 7 days in a row',
    icon: '🔥',
    requirement: 7,
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Practice 30 days in a row',
    icon: '👑',
    requirement: 30,
  },
  DISTANCE_DEMON: {
    id: 'distance_demon',
    name: 'Distance Demon',
    description: 'Make 5+ putts from 40+ feet',
    icon: '🚀',
    requirement: 5,
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: '🦋',
    requirement: 5,
  },
  POINT_KING: {
    id: 'point_king',
    name: 'Point King',
    description: 'Earn 1000+ total points',
    icon: '⭐',
    requirement: 1000,
  },
  PODIUM_FINISH: {
    id: 'podium_finish',
    name: 'Podium Finish',
    description: 'Reach top 3 on leaderboard',
    icon: '🥇',
    requirement: 3,
  },
  CHALLENGE_ACCEPTED: {
    id: 'challenge_accepted',
    name: 'Challenge Accepted',
    description: 'Complete a weekly challenge',
    icon: '✅',
    requirement: 1,
  },
};

// Lock Jaw Disc Golf color palette
export const COLORS = {
  // Primary colors
  primary: '#FF6B35',
  primaryDark: '#D9534F',
  primaryLight: '#FF8C69',
  
  // Secondary colors
  secondary: '#00CED1',
  secondaryDark: '#20B2AA',
  secondaryLight: '#40E0D0',
  
  // Accent colors
  accent: '#F4A460',
  accentDark: '#D2691E',
  accentLight: '#FFB347',
  
  // Background colors
  background: '#FFE4B5',
  backgroundDark: '#D2B48C',
  backgroundLight: '#FFF8DC',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  lightGray: '#D3D3D3',
  darkGray: '#4A4A4A',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Text colors
  text: '#333333',
  textLight: '#666666',
  textDark: '#000000',
  textInverse: '#FFFFFF',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Screen sizes
export const SCREEN_SIZES = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
};

// Animation durations (ms)
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Distance presets for quick entry
export const DISTANCE_PRESETS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

// Weekly challenge types
export const CHALLENGE_TYPES = {
  VOLUME: 'volume',        // Make X putts this week
  ACCURACY: 'accuracy',    // Achieve X% accuracy
  DISTANCE: 'distance',    // Make putts from X+ feet
  STREAK: 'streak',        // Practice X days in a row
  POINTS: 'points',        // Score X points this week
};

// Notification types
export const NOTIFICATION_TYPES = {
  ACHIEVEMENT: 'achievement',
  CHALLENGE: 'challenge',
  FRIEND_REQUEST: 'friend_request',
  LEADERBOARD: 'leaderboard',
  REMINDER: 'reminder',
};

// Date formats
export const DATE_FORMATS = {
  short: 'M/d/yyyy',
  medium: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  time: 'h:mm a',
  dateTime: 'MMM d, yyyy h:mm a',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  AUTH: 'Authentication failed. Please try again.',
  PERMISSION: 'Permission denied. Please enable required permissions.',
  VALIDATION: 'Invalid input. Please check your data.',
  UNKNOWN: 'An unexpected error occurred.',
};

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  USER_ID: '@user_id',
  USER_PROFILE: '@user_profile',
  SETTINGS: '@settings',
  CACHE: '@cache',
  ONBOARDING_COMPLETE: '@onboarding_complete',
};

export default {
  APP_CONFIG,
  POINTS_CONFIG,
  LIMITS,
  ACHIEVEMENTS,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SCREEN_SIZES,
  ANIMATION,
  DISTANCE_PRESETS,
  CHALLENGE_TYPES,
  NOTIFICATION_TYPES,
  DATE_FORMATS,
  ERROR_MESSAGES,
  STORAGE_KEYS,
};
