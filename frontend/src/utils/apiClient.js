import { API_CONFIG, ROUTES, STORAGE_KEYS } from './constants'
import { apiCache } from './apiCache'

/**
 * API Client for making HTTP requests
 * This will be used by all service functions
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  /**
   * Get default headers
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    return headers
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      // If the user is not authenticated or session expired, clear local auth and redirect
      if (response.status === 401) {
        const isAuthEndpoint = typeof response.url === 'string' && response.url.includes('/auth/')
        const AUTH_ROUTES = [
          ROUTES.LOGIN,
          ROUTES.REGISTER,
          ROUTES.FORGOT_PASSWORD,
          ROUTES.RESET_PASSWORD,
          ROUTES.OTP_VERIFICATION,
        ]
        const isOnAuthRoute = AUTH_ROUTES.includes(window.location.pathname)

        try {
          localStorage.removeItem(STORAGE_KEYS.USER)
        } catch {
          // ignore storage errors
        }

        // Only redirect to login if we are not already on an auth page
        // and the failing call was not itself an auth endpoint.
        if (!isAuthEndpoint && !isOnAuthRoute && window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN
        }
      }

      const errorBody = await response.json().catch(() => ({
        message: response.statusText || 'An error occurred',
      }))
      const message =
        errorBody?.message ||
        errorBody?.error ||
        response.statusText ||
        'An error occurred'
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Make GET request with caching
   */
  async get(endpoint, options = {}) {
    // Check cache first (only for GET requests)
    const useCache = options.useCache !== false // Default to true
    const cacheParams = options.cacheParams || {}
    const cacheTTL = options.cacheTTL || null // Use default TTL if not specified

    if (useCache) {
      const cached = apiCache.get(endpoint, cacheParams)
      if (cached !== null) {
        return cached
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(options.headers),
        credentials: 'include',
        signal: controller.signal,
        ...options,
      })
      clearTimeout(timeoutId)
      const data = await this.handleResponse(response)
      
      // Cache successful responses
      if (useCache && response.ok) {
        apiCache.set(endpoint, cacheParams, data, cacheTTL)
      }
      
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Make POST request (invalidates related cache)
   */
  async post(endpoint, data, options = {}) {
    // Invalidate related cache patterns
    if (options.invalidateCache) {
      const patterns = Array.isArray(options.invalidateCache) 
        ? options.invalidateCache 
        : [options.invalidateCache]
      patterns.forEach(pattern => apiCache.invalidate(pattern))
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isFormData ? { ...(options.headers || {}) } : this.getHeaders(options.headers),
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include',
        signal: controller.signal,
        ...options,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Make PUT request (invalidates related cache)
   */
  async put(endpoint, data, options = {}) {
    // Invalidate related cache patterns
    if (options.invalidateCache) {
      const patterns = Array.isArray(options.invalidateCache) 
        ? options.invalidateCache 
        : [options.invalidateCache]
      patterns.forEach(pattern => apiCache.invalidate(pattern))
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: isFormData ? { ...(options.headers || {}) } : this.getHeaders(options.headers),
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include',
        signal: controller.signal,
        ...options,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Make PATCH request (invalidates related cache)
   */
  async patch(endpoint, data, options = {}) {
    // Invalidate related cache patterns
    if (options.invalidateCache) {
      const patterns = Array.isArray(options.invalidateCache) 
        ? options.invalidateCache 
        : [options.invalidateCache]
      patterns.forEach(pattern => apiCache.invalidate(pattern))
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: isFormData ? { ...(options.headers || {}) } : this.getHeaders(options.headers),
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include',
        signal: controller.signal,
        ...options,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Make DELETE request (invalidates related cache)
   */
  async delete(endpoint, options = {}) {
    // Invalidate related cache patterns
    if (options.invalidateCache) {
      const patterns = Array.isArray(options.invalidateCache) 
        ? options.invalidateCache 
        : [options.invalidateCache]
      patterns.forEach(pattern => apiCache.invalidate(pattern))
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(options.headers),
        credentials: 'include',
        signal: controller.signal,
        ...options,
      })
      clearTimeout(timeoutId)
      return this.handleResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient

