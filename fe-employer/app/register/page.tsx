"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { registerEmployer } from "@/lib/api";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmployerRegisterPage() {
  const router = useRouter();
  const { 
    handleGoogleSignIn, 
    renderGoogleButton, 
    loading: googleLoading, 
    error: googleError,
    showRoleMismatchModal: googleShowRoleMismatchModal,
    setShowRoleMismatchModal: setGoogleShowRoleMismatchModal,
    redirectUrl: googleRedirectUrl,
  } = useGoogleAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Render Google button when component mounts and Google script is loaded
  useEffect(() => {
    if (googleButtonRef.current && typeof window !== "undefined") {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          const element = document.getElementById("google-register-button");
          if (element && !googleButtonRendered) {
            renderGoogleButton("google-register-button");
            setGoogleButtonRendered(true);
            clearInterval(checkGoogle);
          }
        }
      }, 100);

      // Cleanup after 5 seconds if Google script doesn't load
      const timeout = setTimeout(() => {
        clearInterval(checkGoogle);
      }, 5000);

      return () => {
        clearInterval(checkGoogle);
        clearTimeout(timeout);
      };
    }
  }, [renderGoogleButton, googleButtonRendered]);

  const validate = (): string | null => {
    if (!fullName.trim()) return "Vui lòng nhập họ và tên";
    if (!email) return "Vui lòng nhập email";
    if (!password || password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";
    if (!agree) return "Vui lòng đồng ý với điều khoản dịch vụ";
    return null;
  };

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    try {
      setSubmitting(true);
      const res = await registerEmployer({ email, password, fullName });
      if (res.success) {
        const msg =
          res.message ||
          "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.";
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("pendingEmail", email);
          } catch {}
        }
        router.push("/email-verification");
      } else {
        const msg = res.error || "Đăng ký thất bại";
        // Nếu email đã đăng ký trước (chưa xác thực hoặc đang trong quá trình), lưu pendingEmail và chuyển sang xác thực
        const lower = String(msg).toLowerCase();
        const shouldForwardToVerification =
          lower.includes("đang trong quá trình đăng ký") ||
          lower.includes("chưa xác thực") ||
          lower.includes("chua xac thuc") ||
          lower.includes("đã được đăng ký") ||
          lower.includes("da duoc dang ky");

        if (shouldForwardToVerification) {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("pendingEmail", email);
            } catch {}
          }
          router.push("/email-verification");
        } else {
          setError(msg);
        }
      }
    } catch (e: any) {
      const msg = e?.message || "Không thể kết nối máy chủ";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-2xl mx-auto w-full">

          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Đăng ký nhà tuyển dụng
          </h1>
          <p className="text-slate-600 text-sm mb-6">
            Tạo tài khoản để đăng tuyển và quản lý ứng viên hiệu quả.
          </p>

          {/* Google register */}
          <div className="mb-6">
            {/* Google Identity Services Button */}
            <div
              id="google-register-button"
              ref={googleButtonRef}
              className={`w-full flex items-center justify-center ${googleButtonRendered ? '' : 'hidden'}`}
            />
            {/* Fallback Button - only show if Google button not rendered */}
            {!googleButtonRendered && (
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || submitting}
                className="w-full h-12 bg-primary hover:brightness-110 text-white border-primary disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? "Đang xử lý..." : "Đăng ký bằng Google"}
              </Button>
            )}
          </div>

          {/* Thông báo kết quả */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}
          {/* Show Google Auth error if exists */}
          {googleError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div className="flex-1">
                <div className="font-medium">{googleError}</div>
                {googleError.includes("chuyển đến trang candidate") && (
                  <div className="mt-1 text-red-500 text-xs">
                    Đang chuyển hướng trong 2 giây...
                  </div>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">hoặc bằng email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Account section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <Label className="mb-2 block">Email đăng nhập</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Nhập lại mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>

          {/* Recruiter info (API 1 fields only) */}
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Thông tin tài khoản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <Label className="mb-2 block">Họ và tên</Label>
              <Input
                placeholder="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 mb-6">
            <Checkbox
              id="agree"
              checked={agree}
              onCheckedChange={(v) => setAgree(Boolean(v))}
            />
            <Label htmlFor="agree" className="text-sm text-slate-600">
              Tôi đã đọc và đồng ý với{" "}
              <a href="#" className="text-primary underline">
                Điều khoản dịch vụ
              </a>{" "}
              và
              <a href="#" className="text-primary underline">
                {" "}
                Chính sách bảo mật
              </a>
            </Label>
          </div>

          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full h-12 bg-primary hover:brightness-110 text-white"
          >
            {submitting ? "Đang xử lý..." : "Hoàn tất"}
          </Button>

          {/* status ? (
            <div
              className={`mt-3 text-sm ${
                status.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {status.message}
            </div>
          ) : null} */}

          <div className="text-center mt-4">
            <span className="text-slate-600 text-sm">Đã có tài khoản? </span>
            <Link href="/" className="text-primary text-sm font-medium">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-primary text-sm">
            ©2014-2025 InternBridge Vietnam JSC. All rights reserved.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden shadow-2xl rounded-xl mx-6 my-8 transition-all duration-700">
        {/* Background Image */}
        <img
          src="/images/side.jpg"
          alt="Background Side"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.85] scale-105 transition-transform duration-700"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-slate-900/60 to-slate-800/50"></div>
        {/* Decorative top left accent */}
        <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-primary blur-2xl opacity-30 z-10"></div>
        {/* Decorative bottom right accent */}
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-sky-400 blur-2xl opacity-20 z-10"></div>

        {/* Centered Caption */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-10 w-full">
          <h2 className="text-white text-4xl font-extrabold drop-shadow-2xl mb-5 leading-tight tracking-tight">
            Cùng <span className="text-primary">InternBridge</span> 
            <br />
            tìm ứng viên <span className="underline underline-offset-4 decoration-primary decoration-4">tiềm năng</span> cho bạn
          </h2>
          <p className="text-white/90 text-lg font-medium drop-shadow mb-4 max-w-lg">
            Nền tảng tuyển dụng hiện đại, kết nối doanh nghiệp với sinh viên tài năng trên toàn quốc.<br />
            Tăng hiệu quả tuyển dụng với công cụ quản lý ứng viên thông minh.
          </p>
        </div>
      </div>

      {/* Role Mismatch Modal - Google Auth */}
      <AlertDialog open={googleShowRoleMismatchModal} onOpenChange={() => {}}>
        <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl">
          <AlertDialogHeader className="text-center pb-4">
            <AlertDialogTitle className="text-2xl font-bold text-slate-900 mb-3">
              Tài khoản không phù hợp
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 leading-relaxed">
              <p>
                Tài khoản này là tài khoản <strong className="text-slate-900">candidate</strong>, không thể đăng ký/đăng nhập vào trang employer.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Đang chuyển hướng đến trang phù hợp...
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
