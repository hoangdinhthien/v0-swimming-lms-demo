/**
 * Global Performance Cache System
 * Optimizes API calls and reduces loading times
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

class PerformanceCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Remove item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  // Preload common data for better UX
  async preloadCommonData() {
    try {
      // Preload tenant data if available
      const tenantKey = "tenant_info";
      if (!this.get(tenantKey)) {
        // This would be replaced with actual tenant API call
      }

      // Preload user permissions
      const permissionsKey = "user_permissions";
      if (!this.get(permissionsKey)) {
        // Preload user permissions
      }
    } catch (error) {
      // Failed to preload common data
    }
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

/**
 * Cache decorator for API functions
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: CacheOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = options.key || `${fn.name}-${JSON.stringify(args)}`;

    // Try to get from cache first
    const cached = performanceCache.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const result = await fn(...args);

    // Cache the result
    performanceCache.set(cacheKey, result, options.ttl);

    return result;
  };
}

/**
 * Batch API requests to reduce number of calls
 */
export class APIBatcher {
  private batches = new Map<
    string,
    {
      requests: Array<{
        resolve: (value: any) => void;
        reject: (error: any) => void;
        params: any;
      }>;
      timeout: NodeJS.Timeout;
    }
  >();

  /**
   * Add request to batch
   */
  batch<T>(
    batchKey: string,
    executor: (params: any[]) => Promise<T[]>,
    params: any,
    delay: number = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, {
          requests: [],
          timeout: setTimeout(
            () => this.executeBatch(batchKey, executor),
            delay
          ),
        });
      }

      const batch = this.batches.get(batchKey)!;
      batch.requests.push({ resolve, reject, params });
    });
  }

  /**
   * Execute batched requests
   */
  private async executeBatch<T>(
    batchKey: string,
    executor: (params: any[]) => Promise<T[]>
  ) {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);

    try {
      const allParams = batch.requests.map((req) => req.params);
      const results = await executor(allParams);

      // Resolve individual requests
      batch.requests.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      // Reject all requests
      batch.requests.forEach((req) => {
        req.reject(error);
      });
    }
  }
}

export const apiBatcher = new APIBatcher();

// Auto cleanup every 10 minutes
setInterval(() => {
  performanceCache.cleanup();
}, 10 * 60 * 1000);
