import { ROUTES } from '../utils/constants'

/**
 * Route configuration
 * Define all application routes here
 */
export const appRoutes = [
  {
    path: ROUTES.LOGIN,
    element: 'Login', // Will be replaced with actual component
    public: true,
  },
  {
    path: ROUTES.REGISTER,
    element: 'Register', // Will be replaced with actual component
    public: true,
  },
  {
    path: ROUTES.DASHBOARD,
    element: 'Dashboard', // Will be replaced with actual component
    public: false,
    requiresAuth: true,
  },
  {
    path: ROUTES.PROFILE,
    element: 'Profile', // Will be replaced with actual component
    public: false,
    requiresAuth: true,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: 'ForgotPassword', // Will be replaced with actual component
    public: true,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: 'ResetPassword', // Will be replaced with actual component
    public: true,
  },
]

/**
 * Get route by path
 */
export const getRouteByPath = (path) => {
  return appRoutes.find((route) => route.path === path)
}

/**
 * Check if route requires authentication
 */
export const isProtectedRoute = (path) => {
  const route = getRouteByPath(path)
  return route && route.requiresAuth === true
}

