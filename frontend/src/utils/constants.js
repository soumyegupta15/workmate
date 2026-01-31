/**
 * API Configuration
 * Update these values based on your backend API
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  TIMEOUT: 30000, // 30 seconds
}

/**
 * API Endpoints
 * Define all API endpoints here
 */
export const API_ENDPOINTS = {
  AUTH: {
    BASE: '/auth',
    SIGNUP: '/auth/signup',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    SEARCH: '/users/search',
  },
  ORG: {
    // All org routes are protected (auth cookie / Bearer token)
    LIST: '/orgs', // legacy: lists all orgs (admin-only usage recommended)
    LIST_ADMIN: '/orgs/admin', // lists orgs where current user is admin
    CREATE: '/orgs',
  },
  PROJECT: {
    LIST: '/projects',
    CREATE: '/projects',
  },
  PROJECT_MEMBER: {
    LIST: '/project-members',
  },
  TASK: {
    LIST: '/tasks',
    CREATE: '/tasks',
  },
  COMMENT: {
    LIST: '/comments',
    CREATE: '/comments',
  },
  ATTACHMENT: {
    UPLOAD: '/attachments/upload',
    LIST: '/attachments',
  },
  AI: {
    PROCESS: '/ai/process',
  },
}

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  USER: 'user',
  SIGNUP_EMAIL: 'signup_email',
  FORGOT_PASSWORD_EMAIL: 'forgot_password_email',
}

/**
 * Route Paths
 */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  OTP_VERIFICATION: '/otp',
  DASHBOARD: '/dashboard',
  EMPLOYEE_DASHBOARD: '/employee',
  ORGANISATIONS: '/organisations',
  CREATE_ORGANISATION: '/organisations/create',
  ORGANISATION_DETAIL: '/organisations/:id/:section',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AI_ASSISTANT: '/organisations/:id/ai-assistant',
}

