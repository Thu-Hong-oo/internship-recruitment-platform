"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import Link from "next/link"

export default function JobRequirementsPage() {
  const [formData, setFormData] = useState({
    position: "Nhân Viên Marketing",
    budget: "0",
    budgetCurrency: "VND/ tháng",
    consultationNeed: "Tôi muốn được đăng tin miễn phí",
  })

  const [selectedFields, setSelectedFields] = useState([
    "Marketing / Truyền thông / Quảng cáo",
    "Bán lẻ - Hàng tiêu dùng - FMCG",
  ])

  const removeField = (fieldToRemove: string) => {
    setSelectedFields(selectedFields.filter((field) => field !== fieldToRemove))
  }

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
              HR Insider
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-green-400">
              Insights
            </Button>
            <div className="w-8 h-8 bg-white rounded-full"></div>
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
                  <span className="ml-3 text-sm font-medium text-slate-400">Thông tin nhà tuyển dụng</span>
                </div>

                <div className="flex-1 h-0.5 bg-green-500 mx-4"></div>

                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    ✓
                  </div>
                  <span className="ml-3 text-sm font-medium text-green-500">Nhu cầu tư vấn</span>
                </div>
              </div>
            </div>

            {/* Form Title */}
            <h3 className="text-xl font-bold text-slate-800 mb-6">Nhu cầu tư vấn</h3>
            <p className="text-slate-600 mb-6">
              Hãy giúp chúng tôi tìm hiểu nhu cầu của bạn bằng cách hoàn thành các câu hỏi sau:
            </p>

            {/* Form */}
            <div className="space-y-6">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bạn đang tuyển dụng vị trí nào? <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lĩnh vực</label>
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map((field, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 text-sm"
                    >
                      {field}
                      <button onClick={() => removeField(field)} className="ml-2 hover:text-green-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngân sách tuyển dụng cho vị trí này của bạn là?
                </label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="flex-1 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="0"
                  />
                  <Select
                    value={formData.budgetCurrency}
                    onValueChange={(value) => setFormData({ ...formData, budgetCurrency: value })}
                  >
                    <SelectTrigger className="w-40 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND/ tháng">VND/ tháng</SelectItem>
                      <SelectItem value="USD/ tháng">USD/ tháng</SelectItem>
                      <SelectItem value="VND/ năm">VND/ năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consultation Need */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bạn có nhu cầu cần tư vấn ký hơn về vấn đề nào không?
                </label>
                <Select
                  value={formData.consultationNeed}
                  onValueChange={(value) => setFormData({ ...formData, consultationNeed: value })}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tôi muốn được đăng tin miễn phí">Tôi muốn được đăng tin miễn phí</SelectItem>
                    <SelectItem value="Tư vấn chiến lược tuyển dụng">Tư vấn chiến lược tuyển dụng</SelectItem>
                    <SelectItem value="Hỗ trợ đánh giá ứng viên">Hỗ trợ đánh giá ứng viên</SelectItem>
                    <SelectItem value="Tư vấn về thương hiệu nhà tuyển dụng">
                      Tư vấn về thương hiệu nhà tuyển dụng
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button className="bg-green-500 hover:bg-green-600 text-white h-12 px-8 font-medium" asChild>
                  <Link href="/dashboard">Hoàn thành →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-400 to-green-600 items-center justify-center relative overflow-hidden">
          {/* 3D Isometric illustration */}
          <div className="relative w-96 h-96 mx-auto">
            {/* Main platform */}
            <div className="absolute inset-0 transform rotate-12">
              <div className="w-full h-full bg-white/20 rounded-3xl backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-4 transform -rotate-6">
              <div className="w-full h-full bg-white/30 rounded-2xl backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-8 bg-white/40 rounded-xl backdrop-blur-sm"></div>

            {/* Business people figures */}
            <div className="absolute top-16 left-20 w-16 h-20 bg-blue-500 rounded-t-full"></div>
            <div className="absolute top-20 right-24 w-14 h-18 bg-green-600 rounded-t-full"></div>

            {/* Documents/papers */}
            <div className="absolute bottom-20 left-16 w-20 h-16 bg-white rounded-lg shadow-lg transform rotate-12"></div>
            <div className="absolute bottom-16 right-20 w-18 h-14 bg-white rounded-lg shadow-lg transform -rotate-6"></div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
              🎯
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl animate-pulse">
              📊
            </div>
            <div className="absolute top-1/2 -right-8 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-lg animate-bounce delay-300">
              ⭐
            </div>
            <div className="absolute top-8 left-8 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-sm animate-pulse delay-500">
              ✨
            </div>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
            <div className="absolute bottom-32 left-16 w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
            <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-400"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
