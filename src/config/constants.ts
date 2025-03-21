// API Configuration
export const API_CONFIG = {
  SUPABASE: {
    SCHEMA: 'public',
    TABLES: {
      EMAIL_METADATA: 'email_metadata'
    }
  },
  GMAIL: {
    SCOPES: [
      'https://www.googleapis.com/auth/gmail.modify',
      'profile',
      'email'
    ],
    VERSION: 'v1',
    BASE_URL: 'https://gmail.googleapis.com/gmail/v1',
    AUTH_ENDPOINTS: {
      TOKEN: 'https://oauth2.googleapis.com/token',
      AUTH: 'https://accounts.google.com/o/oauth2/v2/auth'
    }
  },
  SMARTLEAD: {
    VERSION: '2024-01',
    BASE_URL: 'https://server.smartlead.ai'
  }
} as const;

// Email Processing
export const EMAIL_PRIORITIES = {
  HIGH: 7,
  MEDIUM: 4,
  LOW: 1
} as const;

export const EMAIL_CATEGORIES = {
  MEETING_READY_LEAD: 'Meeting_Ready_Lead',
  POWER: 'Power',
  QUESTION: 'Question',
  UNSUBSCRIBE: 'Unsubscribe',
  OOO: 'OOO',
  NO_LONGER_WORKS: 'No_Longer_Works',
  NOT_INTERESTED: 'Not_Interested',
  INFO: 'Info'
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,
  FCP: 1800,
  TTI: 3800
} as const;

// Error Codes
export const ERROR_CODES = {
  SUPABASE: {
    AUTH_ERROR: 'AUTH_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR'
  },
  GMAIL: {
    API_ERROR: 'GMAIL_API_ERROR',
    AUTH_ERROR: 'GMAIL_AUTH_ERROR',
    REDIRECT_ERROR: 'REDIRECT_ERROR',
    TOKEN_ERROR: 'TOKEN_ERROR'
  },
  SMARTLEAD: {
    API_ERROR: 'SMARTLEAD_API_ERROR'
  },
  GENERAL: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  }
} as const;