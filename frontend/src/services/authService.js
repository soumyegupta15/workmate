import { apiClient } from '../utils/apiClient'
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

/**
 * Login user
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<object>} User data and tokens
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    // Backend sets HTTP-only cookie; we only persist user profile (if returned)
    if (response && response.profile) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.profile))
    } else if (response && response.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user))
    }
    return response
  } catch (error) {
    throw new Error(error.message || 'Login failed')
  }
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout API call failed:', error)
  } finally {
    // Clear local storage
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}

/**
 * Begin signup (send OTP)
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>} API response
 */
export const register = async (userData) => {
  try {
    // Backend /auth/signup sends OTP and does not log the user in
    const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData)
    // Store the email to use during OTP verification
    if (userData?.email) {
      localStorage.setItem(STORAGE_KEYS.SIGNUP_EMAIL, userData.email)
    }
    return response
  } catch (error) {
    throw new Error(error.message || 'Registration failed')
  }
}

/**
 * Verify signup OTP
 * @param {object} data - { email, otp }
 * @returns {Promise<object>}
 */
export const verifyOtp = async (data) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data)
    // On successful verification, we can clear the stored signup email
    localStorage.removeItem(STORAGE_KEYS.SIGNUP_EMAIL)
    return response
  } catch (error) {
    throw new Error(error.message || 'OTP verification failed')
  }
}

/**
 * Request password reset (sends OTP)
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    // Store email for OTP verification
    if (email) {
      localStorage.setItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL, email)
    }
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to send password reset OTP')
  }
}

/**
 * Verify forgot password OTP
 * @param {object} data - { email, otp }
 * @returns {Promise<object>} Contains token for password reset
 */
export const verifyForgotPasswordOtp = async (data) => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.AUTH.BASE}/forgot-password/verify-otp`, data)
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to verify OTP')
  }
}

/**
 * Reset password with token
 * @param {object} resetData - Password reset data
 * @param {string} resetData.email - User email
 * @param {string} resetData.token - Reset token (Supabase access token)
 * @param {string} resetData.newPassword - New password
 * @returns {Promise<void>}
 */
export const resetPassword = async (resetData) => {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, resetData)
  } catch (error) {
    throw new Error(error.message || 'Failed to reset password')
  }
}

/**
 * Get current authenticated user (based on cookie)
 * @returns {Promise<object>} User/profile data
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
    if (response && response.profile) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.profile))
    } else if (response && response.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user))
    }
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to get current user')
  }
}

// Change password (OTP) - requires logged in user (cookie)
export const sendChangePasswordOtp = async () => {
  return apiClient.post(`${API_ENDPOINTS.AUTH.BASE}/change-password/send-otp`)
}

export const verifyChangePasswordOtp = async ({ otp }) => {
  if (!otp) throw new Error('otp is required')
  return apiClient.post(`${API_ENDPOINTS.AUTH.BASE}/change-password/verify-otp`, { otp })
}

export const resetChangePassword = async ({ token, newPassword }) => {
  if (!token) throw new Error('token is required')
  if (!newPassword) throw new Error('newPassword is required')
  return apiClient.post(`${API_ENDPOINTS.AUTH.BASE}/change-password/reset`, {
    token,
    newPassword,
  })
}

