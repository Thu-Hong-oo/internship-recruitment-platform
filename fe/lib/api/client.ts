import { API_BASE_URL } from "./config";

export class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
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

    const url = `${this.baseURL}${endpoint}`;

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
      const response = await fetch(url, config);

      if (!response.ok) {
        //200-299 >< 400, 401, 403, 404, 500, ...
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
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
