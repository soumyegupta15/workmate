import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'

/**
 * Private Route Component
 * Protects routes that require authentication
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div> // Replace with proper loading component
  }

  if (!isAuthenticated) {
    // Redirect to login - will be handled by router
    window.location.href = ROUTES.LOGIN
    return null
  }

  return <>{children}</>
}

export default PrivateRoute

