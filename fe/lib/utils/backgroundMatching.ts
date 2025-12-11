/**
 * Background Matching Scores Utility
 * 
 * Tự động tính matching scores ngầm khi:
 * - Upload CV
 * - Cập nhật profile
 * 
 * Sử dụng debounce và error handling để không block UI
 */

import { apiClient } from "../api/client";

// Debounce queue để tránh tính quá nhiều lần
let matchingQueue: NodeJS.Timeout | null = null;
let isCalculating = false;

const DEBOUNCE_DELAY = 2000; // 2 giây

/**
 * Tính matching scores cho tất cả jobs (background)
 * Không block UI, không hiển thị lỗi cho user
 */
export async function calculateMatchingScoresBackground(): Promise<void> {
  // Clear existing queue
  if (matchingQueue) {
    clearTimeout(matchingQueue);
  }

  // Debounce: chỉ tính sau 2 giây không có thay đổi
  matchingQueue = setTimeout(async () => {
    if (isCalculating) {
      console.log("⏳ Matching scores calculation already in progress, skipping...");
      return;
    }

    try {
      isCalculating = true;
      console.log("🔄 Starting background matching scores calculation...");

      // Gọi API để tính toán matching scores cho tất cả active jobs
      // Endpoint: POST /api/nlp/calculate-all-matches
      await apiClient.post("/nlp/calculate-all-matches", {});

      console.log("✅ Background matching scores calculation triggered successfully");
    } catch (error: any) {
      // Silent fail - không hiển thị lỗi cho user
      console.warn("⚠️ Background matching scores calculation failed (silent):", error?.message || error);
    } finally {
      isCalculating = false;
      matchingQueue = null;
    }
  }, DEBOUNCE_DELAY);
}

/**
 * Tính matching scores ngay lập tức (không debounce)
 * Dùng khi upload CV thành công
 */
export async function calculateMatchingScoresImmediate(): Promise<void> {
  if (isCalculating) {
    console.log("⏳ Matching scores calculation already in progress, skipping...");
    return;
  }

  try {
    isCalculating = true;
    console.log("🔄 Starting immediate matching scores calculation...");

    // Gọi API để tính toán matching scores cho tất cả active jobs
    // Endpoint: POST /api/nlp/calculate-all-matches
    await apiClient.post("/nlp/calculate-all-matches", {});

    console.log("✅ Immediate matching scores calculation triggered successfully");
  } catch (error: any) {
    // Silent fail - không hiển thị lỗi cho user
    console.warn("⚠️ Immediate matching scores calculation failed (silent):", error?.message || error);
  } finally {
    isCalculating = false;
  }
}

/**
 * Clear debounce queue (dùng khi unmount component)
 */
export function clearMatchingQueue(): void {
  if (matchingQueue) {
    clearTimeout(matchingQueue);
    matchingQueue = null;
  }
}

