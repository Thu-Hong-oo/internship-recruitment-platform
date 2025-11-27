// API Base URL - with fallback for build time
// Default to localhost for build, will be overridden by env var in production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
