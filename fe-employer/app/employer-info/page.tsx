"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { User, Phone, Building2, MapPin } from "lucide-react"
import Link from "next/link"

export default function EmployerInfoPage() {
  const [formData, setFormData] = useState({
    fullName: "Nướng Mực",
    gender: "female",
    phone: "0389804287",
    company: "Nemo Mực",
    city: "",
    district: "",
  })

  const [errors, setErrors] = useState({
    city: "Tỉnh/thành phố không được để trống",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold">top</span>
            <span className="text-xl font-bold text-green-400">cv</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="bg-green-500 border-green-500 text-white hover:bg-green-600">
              Tiếp lợi thế - Nối thành công
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-green-400">
              HR Insider
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-green-400">
              Trợ giúp
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left side - Form */}
        <div className="flex-1 px-8 lg:px-16 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Chào mừng <span className="text-green-500">Nướng Mực</span>
              </h1>
              <h2 className="text-green-500 text-xl font-semibold mb-4">Đến với Smart Recruitment Platform</h2>
              <p className="text-slate-600 leading-relaxed">
                Vui lòng điền các thông tin nhà tuyển dụng bên dưới để chúng tôi hỗ trợ bạn tốt hơn:
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    ✓
                  </div>
                  <span className="ml-3 text-sm font-medium text-green-500">Thông tin nhà tuyển dụng</span>
                </div>

                <div className="flex-1 h-0.5 bg-green-500 mx-4"></div>

                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-400">Nhu cầu tư vấn</span>
                </div>
              </div>
            </div>

            {/* Form Title */}
            <h3 className="text-xl font-bold text-slate-800 mb-6">Thông tin nhà tuyển dụng</h3>

            {/* Form */}
            <div className="space-y-6">
              {/* Name and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    className="flex gap-6 mt-3"
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
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại cá nhân <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Công ty <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Địa điểm làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4 z-10" />
                    <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                      <SelectTrigger className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                        <SelectItem value="haiphong">Hải Phòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quận/huyện</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4 z-10" />
                    <Select
                      value={formData.district}
                      onValueChange={(value) => setFormData({ ...formData, district: value })}
                    >
                      <SelectTrigger className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="district1">Quận 1</SelectItem>
                        <SelectItem value="district2">Quận 2</SelectItem>
                        <SelectItem value="district3">Quận 3</SelectItem>
                        <SelectItem value="district4">Quận 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button className="bg-green-500 hover:bg-green-600 text-white h-12 px-8 font-medium" asChild>
                  <Link href="/job-requirements">Lưu và Tiếp tục →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-400 to-green-600 items-center justify-center relative overflow-hidden">
          {/* Same illustration as login page */}
          <div className="relative w-96 h-96 mx-auto">
            {/* 3D Isometric illustration placeholder */}
            <div className="absolute inset-0 transform rotate-12">
              <div className="w-full h-full bg-white/20 rounded-3xl backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-4 transform -rotate-6">
              <div className="w-full h-full bg-white/30 rounded-2xl backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-8 bg-white/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-green-600 text-6xl">👥</div>
            </div>

            {/* Floating business elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
              🎯
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl animate-pulse">
              📋
            </div>
            <div className="absolute top-1/2 -right-8 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-lg animate-bounce delay-300">
              ⭐
            </div>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
            <div className="absolute bottom-32 left-16 w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
            <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
