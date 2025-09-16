"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import {
  verifyEmail as employerVerifyEmail,
  resendEmailVerification as employerResendEmailVerification,
  getUnverifiedAccount as employerGetUnverifiedAccount,
} from "@/lib/api";

export default function EmployerEmailVerificationPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [emailStatus, setEmailStatus] = useState<
    "checking" | "valid" | "invalid" | "unknown"
  >("checking");
  const [emailError, setEmailError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const storedEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("pendingEmail")
        : null;
    if (storedEmail) {
      setEmail(storedEmail);
      checkUnverifiedAccount(storedEmail);
    } else {
      router.push("/");
    }
  }, [router]);

  const checkUnverifiedAccount = async (emailToCheck: string) => {
    try {
      const data = await employerGetUnverifiedAccount(emailToCheck);
      if (data.success && data.data) {
        setEmailStatus("valid");
      } else if (data.expired) {
        setEmailStatus("invalid");
        setEmailError("Mã xác thực đã hết hạn. Vui lòng đăng ký lại.");
      } else {
        setEmailStatus("unknown");
        setEmailError("Không tìm thấy tài khoản chưa xác thực với email này.");
      }
    } catch (e) {
      setEmailStatus("unknown");
      setEmailError("Lỗi khi kiểm tra tài khoản. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }
    if (!email) {
      setError("Không tìm thấy email");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const resp = await employerVerifyEmail(email, otp);
      if (resp.success) {
        setSuccess(resp.message || "Xác thực email thành công!");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(resp.error || resp.message || "Xác thực email thất bại");
      }
    } catch (e: any) {
      setError(e?.message || "Xác thực email thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;
    setCountdown(60);
    setError("");
    setSuccess("");
    try {
      const resp = await employerResendEmailVerification(email);
      if (resp.success) {
        setSuccess(resp.message || "Mã OTP đã được gửi lại!");
      } else {
        setError(resp.error || resp.message || "Không thể gửi lại mã OTP");
      }
    } catch (e: any) {
      setError(e?.message || "Không thể gửi lại mã OTP");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang tải...</div>
      </div>
    );
  }

  if (emailStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            Đang kiểm tra email...
          </h1>
          <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (emailStatus === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-red-600">
              Email không hợp lệ
            </h1>
            <p className="text-muted-foreground text-lg">{emailError}</p>
            <p className="text-sm text-muted-foreground">
              Email: <strong className="text-red-600">{email}</strong>
            </p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => {
                if (typeof window !== "undefined")
                  localStorage.removeItem("pendingEmail");
                router.push("/register");
              }}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
            >
              Đăng ký với email khác
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined")
                  localStorage.removeItem("pendingEmail");
                router.push("/login");
              }}
              className="w-full h-12"
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (emailStatus !== "valid" && emailStatus !== "unknown") {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-[3] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Xác thực email</h1>
            <p className="text-muted-foreground text-lg">
              Chúng tôi đã gửi mã OTP đến email của bạn
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>{email}</strong>
              </p>
              {emailStatus === "unknown" && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ Không thể xác minh email, vui lòng kiểm tra hộp thư
                </p>
              )}
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {emailStatus === "valid" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="otp"
                  className="text-sm font-medium text-foreground"
                >
                  Mã OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Nhập mã OTP 6 số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-12 text-center text-lg font-mono tracking-widest border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Nhập mã 6 số được gửi đến email của bạn
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Xác thực email"}
              </Button>
            </form>
          )}

          {emailStatus === "valid" && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Không nhận được mã?
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className="w-full"
              >
                {countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gửi lại mã ({countdown}s)
                  </>
                ) : (
                  "Gửi lại mã OTP"
                )}
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/register"
              className="text-primary hover:underline font-medium flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại trang đăng ký
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-[2] relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/job-recruitment-celebration.png"
            alt="InternBridge Banner - Kết nối thực tập, xây dựng tương lai"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              InternBridge
            </h1>
          </div>
          <div className="mb-6 space-y-2">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Xác thực email
            </h2>
            <h3 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Hoàn tất đăng ký
            </h3>
          </div>
          <p className="text-xl text-white/95 max-w-md leading-relaxed drop-shadow-lg">
            Bước cuối cùng để hoàn tất quá trình đăng ký và bắt đầu hành trình
            tuyển dụng
          </p>
        </div>
        <div className="absolute bottom-8 right-8 flex items-center space-x-2 text-white/80">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Bảo mật - Điều khoản</span>
        </div>
      </div>
    </div>
  );
}
