"use client";

import { useState } from "react";
import Link from "next/link";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
} from "lucide-react";

export default function EmployerRegisterPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleRegister = () => {
    // Redirect to your backend Google OAuth for employer
    window.location.href = "/api/auth/google?role=employer";
  };

  const validate = (): string | null => {
    if (!agree) return "Bạn cần đồng ý với Điều khoản & Chính sách.";
    if (!email) return "Vui lòng nhập email.";
    if (!password || password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
    if (password !== confirmPassword) return "Mật khẩu nhập lại không khớp.";
    if (!fullName) return "Vui lòng nhập họ và tên.";
    if (!phone) return "Vui lòng nhập số điện thoại.";
    if (!companyName) return "Vui lòng nhập tên công ty.";
    if (!city) return "Vui lòng chọn tỉnh/thành phố.";
    if (!district) return "Vui lòng chọn quận/huyện.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Thiếu thông tin", description: err });
      return;
    }
    try {
      setSubmitting(true);
      // TODO: integrate backend API here
      await new Promise((r) => setTimeout(r, 800));
      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác minh.",
      });
    } catch (e) {
      toast({ title: "Đăng ký thất bại", description: "Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-slate-800">top</span>
              <span className="text-2xl font-bold text-primary">cv</span>
              <span className="text-primary text-sm">®</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Đăng ký nhà tuyển dụng
          </h1>
          <p className="text-slate-600 text-sm mb-6">
            Tạo tài khoản để đăng tuyển và quản lý ứng viên hiệu quả.
          </p>

          {/* Google register */}
          <Button
            onClick={handleGoogleRegister}
            variant="outline"
            className="w-full mb-6 h-12 bg-primary hover:brightness-110 text-white border-primary"
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
            Đăng ký bằng Google
          </Button>

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

          {/* Recruiter info */}
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Thông tin nhà tuyển dụng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="mb-2 block">Họ và tên</Label>
              <Input
                placeholder="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-2 block">Giới tính</Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex items-center gap-6 h-11"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Nam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Nữ</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 block">Số điện thoại cá nhân</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  placeholder="Số điện thoại cá nhân"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Công ty</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  placeholder="Tên công ty"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Địa điểm làm việc</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="pl-10 h-11 w-full">
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hn">Hà Nội</SelectItem>
                      <SelectItem value="hcm">Hồ Chí Minh</SelectItem>
                      <SelectItem value="dn">Đà Nẵng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger className="pl-10 h-11 w-full">
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="q1">Quận 1</SelectItem>
                      <SelectItem value="q3">Quận 3</SelectItem>
                      <SelectItem value="dd">Đống Đa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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

      {/* Right - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <h2 className="text-white text-3xl font-bold mb-4">
            Track your funnel with <span className="text-primary">Report</span>
          </h2>
          <div className="relative w-96 h-96 mx-auto">
            <div className="absolute inset-0 bg-primary/30 rounded-3xl transform rotate-12 opacity-20" />
            <div className="absolute inset-4 bg-primary/40 rounded-2xl transform -rotate-6 opacity-30" />
            <div className="absolute inset-8 bg-primary rounded-xl flex items-center justify-center">
              <div className="text-white text-6xl">🧭</div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute top-40 right-32 w-1 h-1 bg-primary/80 rounded-full" />
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  );
}
