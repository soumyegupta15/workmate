/**
 * API Response Cache
 * Provides caching for API responses with TTL and invalidation support
 */

class ApiCache {
  constructor() {
    // Cache storage: key -> { data, expiresAt, timestamp }
    this.cache = new Map()
    
    // Default TTL: 5 minutes
    this.defaultTTL = 5 * 60 * 1000
    
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Generate cache key from endpoint and params
   */
  getKey(endpoint, params = {}) {
    // Extract query string from endpoint if present
    const [baseEndpoint, existingQuery] = endpoint.split('?')
    
    // Merge existing query params with provided params
    const allParams = { ...params }
    if (existingQuery) {
      const existingParams = new URLSearchParams(existingQuery)
      for (const [key, value] of existingParams.entries()) {
        if (!allParams[key]) {
          allParams[key] = value
        }
      }
    }
    
    // Sort and stringify params
    const sortedParams = Object.keys(allParams)
      .sort()
      .map(key => `${key}=${JSON.stringify(allParams[key])}`)
      .join('&')
    return `${baseEndpoint}${sortedParams ? `?${sortedParams}` : ''}`
  }

  /**
   * Get cached data if available and not expired
   */
  get(endpoint, params = {}) {
    const key = this.getKey(endpoint, params)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  /**
   * Set cache entry with optional TTL
   */
  set(endpoint, params = {}, data, ttl = null) {
    const key = this.getKey(endpoint, params)
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    
    this.cache.set(key, {
      data,
      expiresAt,
      timestamp: Date.now()
    })
  }

  /**
   * Invalidate cache by endpoint pattern
   * Supports wildcard patterns like '/projects/*' or exact matches
   */
  invalidate(pattern) {
    if (pattern.includes('*')) {
      // Wildcard pattern
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Exact match or prefix match
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern)) {
          this.cache.delete(key)
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const apiCache = new ApiCache()
export default apiCache

