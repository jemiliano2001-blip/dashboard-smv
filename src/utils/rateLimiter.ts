/**
 * Simple rate limiter for client-side operations
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if a request is allowed
   * @param key - Unique key for the rate limit (e.g., user ID, IP, action type)
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((timestamp) => now - timestamp < this.config.windowMs)

    if (validRequests.length >= this.config.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    return true
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    const validRequests = requests.filter((timestamp) => now - timestamp < this.config.windowMs)
    return Math.max(0, this.config.maxRequests - validRequests.length)
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key)
  }
}

// Default rate limiters
export const formSubmissionLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
})

export const apiRequestLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60000, // 1 minute
})

export const searchLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60000, // 1 minute
})
