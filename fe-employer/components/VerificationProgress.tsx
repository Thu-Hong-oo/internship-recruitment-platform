"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Circle,
  User,
  Building2,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  url: string;
}

export default function VerificationProgress() {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    loading,
    verificationData,
    isFullyVerified,
    completedSteps,
    totalSteps,
    progressPercentage,
  } = useVerificationStatus();

  // Check if verification is dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("verification-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("verification-dismissed", "true");
  };

  const handleCompleteStep = (url: string) => {
    router.push(url);
  };

  // Show component if we have verification data and it's not fully verified
  // Also show if needsProfile is true (400 status from API)
  if (
    loading ||
    isDismissed ||
    (verificationData && isFullyVerified && !verificationData.needsProfile)
  ) {
    return null;
  }

  // Don't show if we have no verification data and no needsProfile flag
  if (!verificationData && !loading) {
    return null;
  }

  const steps: VerificationStep[] = [
    {
      id: "profile",
      title: "Thông tin cá nhân",
      description: "Cập nhật thông tin cá nhân của bạn",
      icon: <User className="w-5 h-5" />,
      completed: verificationData.profileCompleted,
      url: "/profile",
    },
    {
      id: "company",
      title: "Thông tin công ty",
      description: "Cập nhật thông tin công ty và người đại diện",
      icon: <Building2 className="w-5 h-5" />,
      completed: verificationData.companyCompleted,
      url: "/company",
    },
    {
      id: "documents",
      title: "Tài liệu công ty",
      description: "Tải lên các tài liệu pháp lý cần thiết",
      icon: <FileText className="w-5 h-5" />,
      completed: verificationData.documentsCompleted,
      url: "/company/documents",
    },
  ];

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">
                Hoàn thiện hồ sơ của bạn
              </CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                Hoàn thành các bước sau để tối ưu hóa trải nghiệm tuyển dụng
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Tiến độ hoàn thiện
            </span>
            <span className="text-sm text-blue-700">
              {completedSteps}/{totalSteps} bước
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                step.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.completed
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`${
                      step.completed ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <h4
                    className={`font-medium ${
                      step.completed ? "text-green-900" : "text-gray-900"
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.completed && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Hoàn thành
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-sm mt-1 ${
                    step.completed ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {!step.completed && (
                <Button
                  size="sm"
                  onClick={() => handleCompleteStep(step.url)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Hoàn thành
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        {completedSteps < totalSteps && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              Hoàn thành tất cả các bước để mở khóa đầy đủ các tính năng tuyển
              dụng
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
