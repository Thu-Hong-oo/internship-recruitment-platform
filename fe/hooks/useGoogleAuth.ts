"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api";
import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    // Clean up temp button if it exists
    const tempDiv = document.getElementById('temp-google-button');
    if (tempDiv && document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }

    try {
      setLoading(true);
      setError(null);

      // Send ID token to backend
      const result = await authAPI.googleAuth(response.credential);

      console.log("Google Auth Result:", result);

      if (result.success && result.user) {
        // Check if user role is candidate
        if (result.user.role !== 'candidate') {
          const errorMsg = "Tài khoản này là tài khoản employer. Đang chuyển hướng...";
          console.error("Role mismatch:", result.user.role);
          
          // Clear any saved data
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            
            // Redirect to employer frontend
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const employerUrl = isLocalhost 
              ? 'http://localhost:3002' 
              : 'https://internbridge-employer.web.app';
            
            toast({
              title: "Đang chuyển hướng",
              description: "Tài khoản này là tài khoản employer. Đang chuyển đến trang employer...",
            });
            
            setTimeout(() => {
              window.location.href = employerUrl;
            }, 2000);
          }
          return;
        }

        // Set user in auth context
        setUser(result.user);

        // Token is already stored by apiClient.setToken in authService
        // No need to check for token here

        toast({
          title: "Đăng nhập thành công",
          description: result.isNew
            ? "Chào mừng bạn đến với InternBridge!"
            : "Đăng nhập thành công",
        });

        // Redirect based on user status
        setTimeout(() => {
          if (result.isNew) {
            router.push("/profile");
          } else {
            router.push("/");
          }
        }, 500);
      } else {
        const errorMsg = result.error || result.message || "Đăng nhập Google thất bại";
        console.error("Google Auth Error:", errorMsg, result);
        setError(errorMsg);
        toast({
          title: "Đăng nhập thất bại",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Google Auth Response Error:", err);
      const errorMsg = err.message || "Lỗi khi xử lý phản hồi từ Google";
      setError(errorMsg);
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
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
        const errorMsg = "Google Client ID chưa được cấu hình. Vui lòng:\n1. Tạo file .env.local trong thư mục fe/\n2. Thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id\n3. Lấy Google Client ID từ: https://console.cloud.google.com/apis/credentials";
        console.error(errorMsg);
        toast({
          title: "Cấu hình thiếu",
          description: "Google Client ID chưa được cấu hình. Vui lòng xem console để biết thêm chi tiết.",
          variant: "destructive",
        });
        setLoading(false);
        return;
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
        use_fedcm_for_prompt: true, // Opt-in to FedCM
      });

      // Create a hidden div and render Google button into it
      let tempDiv = document.getElementById('temp-google-button');
      if (tempDiv) {
        document.body.removeChild(tempDiv);
      }
      
      tempDiv = document.createElement('div');
      tempDiv.id = 'temp-google-button';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.opacity = '0';
      tempDiv.style.pointerEvents = 'none';
      document.body.appendChild(tempDiv);

      // Render Google button
      try {
        window.google.accounts.id.renderButton(tempDiv, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 300,
        });

        // Wait for button to render, then trigger click
        setTimeout(() => {
          const googleButton = tempDiv?.querySelector('div[role="button"]') as HTMLElement;
          if (googleButton) {
            // Use a user gesture to trigger the button
            // Create a synthetic click event that should work
            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            googleButton.dispatchEvent(event);
            
            // Clean up after a delay
            setTimeout(() => {
              if (tempDiv && document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
              }
            }, 1000);
          } else {
            setLoading(false);
            if (tempDiv && document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
          }
        }, 300);
      } catch (renderError) {
        console.error("Error rendering Google button:", renderError);
        setError("Không thể khởi tạo đăng nhập Google. Vui lòng tải lại trang và thử lại.");
        toast({
          title: "Lỗi",
          description: "Không thể khởi tạo đăng nhập Google. Vui lòng tải lại trang và thử lại.",
          variant: "destructive",
        });
        setLoading(false);
        if (tempDiv && document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Lỗi khi đăng nhập với Google");
      toast({
        title: "Lỗi",
        description: err.message || "Lỗi khi đăng nhập với Google",
        variant: "destructive",
      });
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
