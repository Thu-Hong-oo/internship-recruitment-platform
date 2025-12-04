// API Base URL - with fallback for build time
// LƯU Ý: KHÔNG để `/api` ở cuối, vì các service đã tự thêm `/api/...` vào endpoint
// Ví dụ: API_BASE_URL = http://localhost:3000  +  endpoint = /api/ai/skill-gap-analysis
//  => http://localhost:3000/api/ai/skill-gap-analysis (đúng)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
