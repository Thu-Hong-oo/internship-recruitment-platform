import { useCallback, useRef } from "react";

interface RateLimitOptions {
  maxRequests?: number;
  timeWindow?: number; // in milliseconds
  delayBetweenRequests?: number; // in milliseconds
}

export const useApiRateLimit = (options: RateLimitOptions = {}) => {
  const {
    maxRequests = 10,
    timeWindow = 60000, // 1 minute
    delayBetweenRequests = 1000, // 1 second
  } = options;

  const requestHistory = useRef<number[]>([]);
  const lastRequestTime = useRef<number>(0);

  const canMakeRequest = useCallback(() => {
    const now = Date.now();

    // Clean old requests outside the time window
    requestHistory.current = requestHistory.current.filter(
      (timestamp) => now - timestamp < timeWindow
    );

    // Check if we've exceeded the rate limit
    if (requestHistory.current.length >= maxRequests) {
      return false;
    }

    return true;
  }, [maxRequests, timeWindow]);

  const makeRequest = useCallback(
    async <T>(requestFn: () => Promise<T>): Promise<T> => {
      if (!canMakeRequest()) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      const now = Date.now();

      // Add delay if needed
      if (now - lastRequestTime.current < delayBetweenRequests) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            delayBetweenRequests - (now - lastRequestTime.current)
          )
        );
      }

      // Record this request
      requestHistory.current.push(Date.now());
      lastRequestTime.current = Date.now();

      try {
        return await requestFn();
      } catch (error) {
        // If it's a 429 error, remove the last request from history
        if (error instanceof Error && error.message.includes("429")) {
          requestHistory.current.pop();
        }
        throw error;
      }
    },
    [canMakeRequest, delayBetweenRequests]
  );

  return { makeRequest, canMakeRequest };
};
