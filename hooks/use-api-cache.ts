import { useState, useEffect, useCallback } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

// Custom hook for cached API calls
export function useCachedAPI<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (force = false) => {
      // Try to get from cache first
      if (!force) {
        const cached = apiCache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        apiCache.set(key, result, ttl);
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [key, fetchFn, ttl]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);
  const invalidate = useCallback(() => {
    apiCache.delete(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  data: T[],
  keyExtractor: (item: T) => string
) {
  const [optimisticData, setOptimisticData] = useState<T[]>(data);

  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  const addOptimistic = useCallback((item: T) => {
    setOptimisticData((prev) => [...prev, item]);
  }, []);

  const updateOptimistic = useCallback(
    (key: string, updater: (item: T) => T) => {
      setOptimisticData((prev) =>
        prev.map((item) => (keyExtractor(item) === key ? updater(item) : item))
      );
    },
    [keyExtractor]
  );

  const removeOptimistic = useCallback(
    (key: string) => {
      setOptimisticData((prev) =>
        prev.filter((item) => keyExtractor(item) !== key)
      );
    },
    [keyExtractor]
  );

  const resetOptimistic = useCallback(() => {
    setOptimisticData(data);
  }, [data]);

  return {
    optimisticData,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    resetOptimistic,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log slow operations
      if (duration > 1000) {
        console.warn(
          `🐌 [Performance] ${name} took ${duration.toFixed(
            2
          )}ms - Consider optimization`
        );
      }
    };
  }, [name]);
}

// Cleanup cache periodically
setInterval(() => {
  apiCache.cleanup();
}, 60000); // Every minute
