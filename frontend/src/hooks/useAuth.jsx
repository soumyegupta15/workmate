import { useState, useEffect, useContext, createContext } from 'react'
import { STORAGE_KEYS } from '../utils/constants'
import * as authService from '../services/authService'

/**
 * Auth Context
 */
const AuthContext = createContext(null)

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Initialize auth state from storage
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Prefer server-verified auth based on HTTP-only cookie
        const current = await authService.getCurrentUser()
        if (current && (current.profile || current.user)) {
          setUser(current.profile || current.user)
          setIsAuthenticated(true)
          return
        }
      } catch (error) {
        // If server says not authenticated or any error occurs, fall back to local storage
        try {
          const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
          if (storedUser) {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
            return
          }
        } catch (storageError) {
          console.error('Error reading auth from storage:', storageError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  /**
   * Login function
   */
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials)
      // Backend returns { message, session, user, profile }
      const nextUser = response.profile || response.user || null
      if (nextUser) {
        setUser(nextUser)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser))
      }
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  /**
   * Register function
   */
  const register = async (userData) => {
    try {
      // Registration is an OTP-based flow; this step only triggers OTP
      const response = await authService.register(userData)
      // Do NOT mark user as authenticated yet; they still need to verify OTP and then log in
      return response
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

