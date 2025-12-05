const USE_MOCK =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_USE_MOCK === "1"
    : process.env.NEXT_PUBLIC_USE_MOCK === "1";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function http<T>(
  url: string,
  options?: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<T> {
  if (USE_MOCK) {
    // In mock mode, caller should use mock services instead of http.
    // This is a safeguard to avoid accidental network calls.
    throw new Error(
      "http() should not be called in mock mode. Use mock services instead."
    );
  }
  const res = await fetch(`${BASE_URL}${url}`, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  // try json first
  try {
    return (await res.json()) as T;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-anyd
    return (await res.text()) as T;
  }
}

export const mock = {
  enabled: USE_MOCK,
  // Simulate latency for any mock call
  async withLatency<T>(value: T, ms = 300): Promise<T> {
    await sleep(ms);
    return value;
  },
};

import { API_BASE_URL } from "./config";

export class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    // Use API_BASE_URL with fallback
    // Only warn at runtime (client-side) if URL is not configured, not at build time
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!envUrl) {
        console.warn(
          "NEXT_PUBLIC_API_URL is not configured. Using fallback URL: http://localhost:3000/api"
        );
        console.warn(
          "Please create .env.local file with NEXT_PUBLIC_API_URL=your-backend-url"
        );
      }
    }
    this.baseURL = API_BASE_URL || 'http://localhost:3000/api';
    this.token = null; // Initialize as null, will be set when needed
  }

  // Method to get token from localStorage
  private getTokenFromStorage(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  // Method to update token from localStorage
  private updateTokenFromStorage() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Update token from localStorage before each request
    this.updateTokenFromStorage();

    // Ensure baseURL is absolute (starts with http:// or https://)
    // This prevents Next.js from treating it as an internal route
    let url = `${this.baseURL}${endpoint}`;
    
    // If baseURL doesn't start with http:// or https://, it might be relative
    // In Server Components, we need absolute URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn('API URL is not absolute. This may cause Next.js to route it internally.');
    }

    // Debug logging
    console.log("API Request:", {
      url,
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
    });

    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Add Content-Type only if not FormData
    if (!(options.body instanceof FormData)) {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
    }

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      // Add cache: 'no-store' to prevent browser/Next.js caching
      // Use absolute URL to prevent Next.js from intercepting as internal route
      const response = await fetch(url, {
        ...config,
        cache: 'no-store',
        // Remove next: { revalidate: 0 } as it's for Next.js internal routes
        // For external API calls, we just use cache: 'no-store'
      });

      console.log("API Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        //200-299 >< 400, 401, 403, 404, 500, ...
        let errorData: any;
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch {
          errorData = {};
        }
        
        console.error("API Error Response:", errorData);
        
        // If the error response has a structured format with success: false,
        // return it instead of throwing (this allows callers to handle it gracefully)
        if (errorData && typeof errorData === 'object' && errorData.success === false) {
          return errorData;
        }
        
        // Otherwise, throw an error with the message
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ API Success Response:", result);
      return result;
    } catch (error: unknown) {
      console.error("API request failed:", error);
      const errorDetails =
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { name: "UnknownError", message: String(error), stack: undefined };
      console.error("Error details:", errorDetails);
      throw error instanceof Error
        ? error
        : new Error("Unknown error occurred during API request");
    }
  }

  // Basic helpers
  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body:
        body instanceof FormData ? (body as any) : JSON.stringify(body ?? {}),
    });
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body:
        body instanceof FormData ? (body as any) : JSON.stringify(body ?? {}),
    });
  }

  public async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body:
        body instanceof FormData ? (body as any) : JSON.stringify(body ?? {}),
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
