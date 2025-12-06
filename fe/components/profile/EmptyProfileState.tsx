"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  ArrowRight,
  Upload,
  Edit,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyProfileStateProps {
  message?: string;
  onUploadCV?: () => void;
  onUpdateProfile?: () => void;
}

export function EmptyProfileState({
  message = "Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.",
  onUploadCV,
  onUpdateProfile,
}: EmptyProfileStateProps) {
  const router = useRouter();

  const handleUploadCV = () => {
    if (onUploadCV) {
      onUploadCV();
    } else {
      router.push("/profile?tab=cv");
    }
  };

  const handleUpdateProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile();
    } else {
      router.push("/profile");
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/80 shadow-lg">
      <CardContent className="pt-12 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon with pulse animation */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-lg opacity-40 animate-ping"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-4 shadow-xl transform hover:scale-105 transition-transform">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Bắt đầu với hồ sơ của bạn
          </h2>

          {/* Message with alert icon */}
          <div className="flex items-start justify-center gap-3 mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-base text-slate-700 leading-relaxed flex-1">
              {message}
            </p>
          </div>

          {/* Action Buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button
              onClick={handleUploadCV}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <Upload className="w-5 h-5 mr-2" />
              Tải CV lên
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleUpdateProfile}
              size="lg"
              variant="outline"
              className="border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 text-blue-700 hover:text-blue-800"
            >
              <Edit className="w-5 h-5 mr-2" />
              Cập nhật hồ sơ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Guide Steps */}
          <div className="mt-10 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">
              Hướng dẫn nhanh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={handleUploadCV}>
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                    Bước 1: Tải CV
                  </h4>
                  <p className="text-sm text-slate-600">
                    Upload CV của bạn (PDF, DOC, DOCX) để hệ thống phân tích và trích xuất thông tin tự động
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 rounded-lg hover:bg-indigo-50/50 transition-colors cursor-pointer group" onClick={handleUpdateProfile}>
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                    Bước 2: Cập nhật thông tin
                  </h4>
                  <p className="text-sm text-slate-600">
                    Bổ sung kỹ năng, kinh nghiệm làm việc, học vấn để hệ thống hiểu rõ hơn về bạn
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-4 rounded-lg hover:bg-purple-50/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">
                    Bước 3: Nhận gợi ý
                  </h4>
                  <p className="text-sm text-slate-600">
                    Hệ thống AI sẽ phân tích và gợi ý những việc làm phù hợp nhất với hồ sơ của bạn
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              Hoặc truy cập nhanh các mục sau:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile?tab=cv")}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all transform hover:scale-105"
              >
                <FileText className="w-4 h-4 mr-2" />
                Quản lý CV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile?tab=skills")}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all transform hover:scale-105"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Kỹ năng
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile?tab=experience")}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all transform hover:scale-105"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Kinh nghiệm
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

