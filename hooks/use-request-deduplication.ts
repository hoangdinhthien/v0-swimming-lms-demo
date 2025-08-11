import { useRef, useCallback } from "react";

// Hook to prevent duplicate API calls
export const useRequestDeduplication = () => {
  const pendingRequests = useRef(new Map<string, Promise<any>>());

  const deduplicatedRequest = useCallback(
    <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
      // If request is already pending, return the existing promise
      if (pendingRequests.current.has(key)) {
        return pendingRequests.current.get(key)!;
      }

      // Create new request
      const promise = requestFn().finally(() => {
        // Clean up after request completes
        pendingRequests.current.delete(key);
      });

      // Store the promise
      pendingRequests.current.set(key, promise);

      return promise;
    },
    []
  );

  const clearPendingRequests = useCallback(() => {
    pendingRequests.current.clear();
  }, []);

  return { deduplicatedRequest, clearPendingRequests };
};
