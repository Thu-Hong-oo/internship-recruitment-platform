"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveToken, saveUserData } from "@/lib/userStorage";
import { googleAuth } from "@/lib/api";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleMismatchModal, setShowRoleMismatchModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const router = useRouter();

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadGoogleScript = () => {
      if (document.getElementById("google-identity-script")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      setLoading(true);
      setError(null);

      // Send ID token to backend
      const result = await googleAuth(response.credential) as {
        success: boolean;
        token?: string;
        user?: any;
        isNew?: boolean;
        message?: string;
        error?: string;
        errorType?: string;
      };

      console.log("Google Auth Result:", result);

      // Handle ROLE_MISMATCH error from backend (403 response)
      if (result.errorType === 'ROLE_MISMATCH' || (!result.success && result.error && result.error.includes('role'))) {
        const isLocalhost = typeof window !== "undefined" && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const candidateUrl = isLocalhost 
          ? 'http://localhost:3001' 
          : 'https://internbridge.web.app';
        console.error("Role mismatch:", result);
        
        // Clear any saved data
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
        }
        
        // Set modal state
        setRedirectUrl(candidateUrl);
        setShowRoleMismatchModal(true);
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = candidateUrl;
          }
        }, 3000);
        return;
      }

      // Check if we have user data (even if success field is missing)
      if (result.user) {
        // Check if user role is employer
        if (result.user.role !== 'employer') {
          const isLocalhost = typeof window !== "undefined" && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          const candidateUrl = isLocalhost 
            ? 'http://localhost:3001' 
            : 'https://internbridge.web.app';
          console.error("Role mismatch:", result.user.role);
          
          // Clear any saved data
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
          }
          
          // Set modal state
          setRedirectUrl(candidateUrl);
          setShowRoleMismatchModal(true);
          
          // Auto redirect after 3 seconds
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = candidateUrl;
            }
          }, 3000);
          return;
        }

        // User is employer - proceed with login
        // Save token and user data
        if (result.token) {
          saveToken(result.token, true);
        }
        if (result.user) {
          saveUserData(result.user, true);
        }

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else if (result.success === false || result.error) {
        // Handle actual errors (not role mismatch)
        const errorMsg = result.error || result.message || "Đăng nhập Google thất bại";
        console.error("Google Auth Error:", errorMsg, result);
        setError(errorMsg);
      } else {
        // Unexpected response format
        console.error("Unexpected Google Auth response:", result);
        setError("Phản hồi không hợp lệ từ server. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Google Auth Response Error:", err);
      const errorMsg = err.message || "Lỗi khi xử lý phản hồi từ Google";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'your-google-client-id-here') {
        const errorMsg = "Google Client ID chưa được cấu hình. Vui lòng:\n1. Tạo file .env.local trong thư mục fe-employer/\n2. Thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id\n3. Lấy Google Client ID từ: https://console.cloud.google.com/apis/credentials";
        console.error(errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Wait for Google Identity Services to load
      let retries = 0;
      while (!window.google?.accounts?.id && retries < 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        retries++;
      }

      if (!window.google?.accounts?.id) {
        throw new Error(
          "Google Identity Services chưa sẵn sàng. Vui lòng tải lại trang và thử lại."
        );
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      // Trigger the One Tap prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is not available, show a popup
          // We'll use a custom button click handler instead
          setLoading(false);
        }
      });
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Lỗi khi đăng nhập với Google");
      setLoading(false);
    }
  };

  // Render Google Sign In Button
  const renderGoogleButton = (elementId: string) => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
    });

    // Render button - don't use width: "100%" as it's invalid
    // Let Google button auto-size or use a number
    const buttonConfig: any = {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
    };
    
    // Only add width if element has a valid numeric width (not percentage)
    const elementWidth = element.offsetWidth;
    if (elementWidth && elementWidth > 0) {
      buttonConfig.width = elementWidth;
    }
    // If no width, Google will auto-size the button
    
    window.google.accounts.id.renderButton(element, buttonConfig);
  };

  return {
    handleGoogleSignIn,
    renderGoogleButton,
    loading,
    error,
    showRoleMismatchModal,
    setShowRoleMismatchModal,
    redirectUrl,
  };
};

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (callback: (notification: any) => void) => void;
          renderButton: (
            element: HTMLElement | null,
            config: any
          ) => void;
        };
        oauth2?: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

