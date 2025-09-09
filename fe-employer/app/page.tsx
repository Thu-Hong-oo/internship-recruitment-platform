"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-slate-800">top</span>
              <span className="text-2xl font-bold text-green-500">cv</span>
              <span className="text-green-500 text-sm">®</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng bạn đã quay trở lại</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Cùng tạo dựng lợi thế cho doanh nghiệp bằng trải nghiệm công nghệ tuyển dụng ứng dụng sâu AI & Hiring
              Funnel
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            variant="outline"
            className="w-full mb-6 h-12 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
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
            Đăng nhập bằng Google
          </Button>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <Link href="/forgot-password" className="text-green-500 hover:text-green-600 text-sm">
              Quên mật khẩu
            </Link>
          </div>

          {/* Login Button */}
          <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium mb-6">Đăng nhập</Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-slate-600 text-sm">Chưa có tài khoản? </span>
            <Link href="/register" className="text-green-500 hover:text-green-600 text-sm font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-green-500 text-sm">©2014-2025 TopCV Vietnam JSC. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <h2 className="text-white text-3xl font-bold mb-4">
            Track your funnel with <span className="text-green-400">Report</span>
          </h2>

          {/* 3D Illustration Placeholder */}
          <div className="relative w-96 h-96 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl transform rotate-12 opacity-20"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl transform -rotate-6 opacity-30"></div>
            <div className="absolute inset-8 bg-green-500 rounded-xl flex items-center justify-center">
              <div className="text-white text-6xl">📊</div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
              ⭐
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl animate-pulse">
              📈
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-green-300 rounded-full"></div>
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-green-400 rounded-full"></div>
        </div>

        {/* Bottom logo */}
        <div className="absolute bottom-8 right-8">
          <div className="flex items-center gap-1 text-white">
            <span className="text-xl font-bold">top</span>
            <span className="text-xl font-bold text-green-400">cv</span>
          </div>
          <p className="text-green-400 text-xs mt-1">Tiếp lợi thế, nối thành công</p>
        </div>

        {/* Pagination dots */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
