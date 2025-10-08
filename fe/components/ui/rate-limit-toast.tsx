"use client";

import React from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RateLimitToastProps {
  isVisible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  retryAfter?: number; // seconds
}

export function RateLimitToast({
  isVisible,
  onRetry,
  onDismiss,
  retryAfter = 60,
}: RateLimitToastProps) {
  const [countdown, setCountdown] = React.useState(retryAfter);

  React.useEffect(() => {
    if (!isVisible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdown]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-orange-800 text-sm">
              Quá nhiều yêu cầu
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-orange-700 text-sm mb-3">
            Bạn đang gửi quá nhiều yêu cầu. Vui lòng chờ một chút trước khi thử
            lại.
          </CardDescription>

          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              Có thể thử lại sau: {countdown}s
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={countdown > 0}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Thử lại
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-orange-600 hover:text-orange-700"
            >
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
