/**
 * Business rules constants extracted from hardcoded values across the codebase.
 * Centralizes magic numbers for maintainability and discoverability.
 */

/** Escalation thresholds for approval workflow (hours) */
export const ESCALATION_HOURS = {
  LEVEL_1: 24,
  LEVEL_2: 48,
  LEVEL_3: 72,
} as const;

/** Budget threshold percentages for project budget monitoring */
export const BUDGET_THRESHOLDS = {
  WARNING_PERCENT: 80,
  CRITICAL_PERCENT: 100,
} as const;

/** Password policy for user creation */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
  MESSAGE:
    'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
} as const;

/** Pagination defaults for list endpoints */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Token expiry durations */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_DAYS: 7,
  CSRF_COOKIE_MS: 24 * 60 * 60 * 1000, // 24 hours
  PRESIGNED_URL_SECONDS: 3600, // 1 hour
  DEFAULT_TTL_SECONDS: 3600, // 1 hour
} as const;

/** Strategic brief configuration */
export const STRATEGIC_BRIEF = {
  TOTAL_SECTIONS: 16,
  COMPLETION_100: 100,
} as const;

/** File upload limits */
export const FILE_LIMITS = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
} as const;

/** Rate limiting */
export const RATE_LIMITS = {
  GLOBAL_TTL_SECONDS: 60,
  GLOBAL_LIMIT: 100,
} as const;
