"use client";

import { useState } from "react";
import { authAPI, apiClient } from "@/lib/api";
import { useAuth } from "./useAuth";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      // Load Google Identity Services
      if (typeof window === "undefined") {
        throw new Error("Google Auth chỉ hoạt động trên client side");
      }

      // Check if Google Client ID is configured
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId ) {
        throw new Error("Google Client ID chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào .env.local");
      }

      // Check if Google Identity Services is loaded
      if (!window.google) {
        // Load Google Identity Services script
        await loadGoogleScript();
        
        // Wait a bit for Google to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Double check Google is available
      if (!window.google?.accounts?.id) {
        throw new Error("Google Identity Services chưa sẵn sàng. Vui lòng thử lại.");
      }

      // If Google origin is not allowed, fallback to backend redirect flow
      try {
        // Initialize GSI (may fail later due to origin restriction)
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });

        const buttonElement = document.getElementById("google-signin-button");
        if (buttonElement && window.google?.accounts?.id) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
          });
        }
      } catch (_) {
        // Ignore and rely on redirect flow below
      }

      // No redirect fallback; rely on official GSI popup button rendered above
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setError(error.message || "Lỗi khi đăng nhập với Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      setError("");

      // Send ID token to backend
      const result = await authAPI.googleAuth(response.credential);

      if (result.success && result.user) {
        setUser(result.user);
        
        // Redirect based on user role
        if (result.isNew) {
          // New user - redirect to profile setup
          window.location.href = "/profile";
        } else {
          // Existing user - redirect to dashboard
          window.location.href = "/dashboard";
        }
      } else {
        setError(result.error || "Đăng nhập Google thất bại");
      }
    } catch (error: any) {
      console.error("Google Auth Response Error:", error);
      setError(error.message || "Lỗi khi xử lý phản hồi từ Google");
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById("google-identity-script")) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "google-identity-script";
      // Note: do NOT set crossOrigin to avoid triggering CORS checks on some setups
      // Keep plain script include as recommended by Google
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log("Google Identity Services loaded successfully");
        resolve();
      };
      script.onerror = (error) => {
        console.error("Failed to load Google Identity Services:", error);
        // Common local dev issue: CORS shown for <script> loads if crossOrigin was set or extensions interfered
        // Fallback: instruct caller to use backend OAuth redirect flow
        reject(new Error("Không thể tải Google Identity Services. Vui lòng thử lại hoặc dùng nút Đăng nhập Google (redirect)."));
      };

      document.head.appendChild(script);
    });
  };

  return {
    signInWithGoogle,
    loading,
    error,
  };
};

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
        };
      };
    };
  }
}
