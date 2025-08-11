// Simple in-memory cache for API responses
interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

class SimpleApiCache {
  private cache = new Map<string, CacheItem>();

  set(key: string, data: any, ttl = 60000) {
    // Default 1 minute TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  // Generate cache key from URL and params
  generateKey(url: string, params?: Record<string, any>) {
    const paramString = params ? JSON.stringify(params) : "";
    return `${url}${paramString}`;
  }
}

export const apiCache = new SimpleApiCache();
