"use client";

import React from "react";
import { AlertCircle, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function EmailVerificationBanner() {
  const { user, needsEmailVerification } = useAuth();
  const router = useRouter();

  // Don't show banner if user is not logged in or email is verified
  if (!user || !needsEmailVerification()) {
    return null;
  }

  const handleVerifyEmail = () => {
    // Store current user email for verification
    localStorage.setItem("pendingEmail", user.email);
    router.push("/email-verification");
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Xác thực email của bạn
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Vui lòng xác thực email <strong>{user.email}</strong> để có thể
                  sử dụng đầy đủ các tính năng của hệ thống.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleVerifyEmail}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Mail className="w-4 h-4 mr-1" />
                Xác thực ngay
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
