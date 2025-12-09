import { apiClient } from "../client";

export interface NavigationIntentRequest {
  input: string;
  frontend?: 'fe' | 'fe-employer';
  sessionId?: string;
}

export interface NavigationIntentResponse {
  success: boolean;
  intent?: string;
  route?: string;
  url?: string;
  params?: Record<string, any>;
  confidence?: number;
  method?: string;
  fulfillmentText?: string;
  error?: string;
  suggestions?: string[];
  originalInput?: string;
}

class NavigationService {
  /**
   * Recognize navigation intent từ natural language input
   * @param input - User input text
   * @param frontend - 'fe' (candidate) hoặc 'fe-employer'
   * @param sessionId - Optional session ID for Dialogflow context
   */
  async recognizeIntent(
    input: string,
    frontend: 'fe' | 'fe-employer' = 'fe',
    sessionId?: string
  ): Promise<NavigationIntentResponse> {
    try {
      return await apiClient.post<NavigationIntentResponse>('/ai/navigate-intent', {
        input,
        frontend,
        sessionId
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to recognize intent',
        suggestions: [
          'Tìm việc làm',
          'Tạo CV online',
          'Xem thông tin cá nhân'
        ]
      };
    }
  }
}

export const navigationService = new NavigationService();


