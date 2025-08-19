"use client"

import { useState } from "react"
import {
  Bell,
  User,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ChevronRight,
  ChevronDown,
  Facebook,
  Youtube,
  Linkedin,
  Instagram,
  Search,
  X,
  Filter,
  Heart,
  Bookmark,
  Eye,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function TopCVHomePage() {
  const [showJobCategoryDropdown, setShowJobCategoryDropdown] = useState(false)
  const [showCreateCVDropdown, setShowCreateCVDropdown] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("Hồ Chí Minh")
  const [selectedDistricts, setSelectedDistricts] = useState([
    "Tất cả",
    "Bình Chánh",
    "Bình Tân",
    "Bình Thạnh",
    "Cần Giờ",
    "Củ Chi",
    "Gò Vấp",
  ])
  const [searchKeyword, setSearchKeyword] = useState("")

  if (showSearchResults) {
    return <JobSearchResults onBack={() => setShowSearchResults(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary">topcv</div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="relative">
                <button
                  className="flex items-center text-foreground hover:text-primary transition-colors duration-200"
                  onMouseEnter={() => setShowJobsDropdown(true)}
                  onMouseLeave={() => setShowJobsDropdown(false)}
                >
                  Việc làm
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showJobsDropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50"
                    onMouseEnter={() => setShowJobsDropdown(true)}
                    onMouseLeave={() => setShowJobsDropdown(false)}
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-4">VIỆC LÀM</h3>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <Search className="w-4 h-4 mr-3" />
                              Tìm việc làm
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <Bookmark className="w-4 h-4 mr-3" />
                              Việc làm đã lưu
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <Eye className="w-4 h-4 mr-3" />
                              Việc làm đã ứng tuyển
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <Heart className="w-4 h-4 mr-3" />
                              Việc làm phù hợp
                            </div>
                          </div>
                          <div className="mt-6">
                            <h3 className="font-semibold text-gray-800 mb-4">CÔNG TY</h3>
                            <div className="space-y-3">
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <Building2 className="w-4 h-4 mr-3" />
                                Danh sách công ty
                              </div>
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <Building2 className="w-4 h-4 mr-3" />
                                Top công ty
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-4">VIỆC LÀM THEO VỊ TRÍ</h3>
                          <div className="space-y-2">
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Nhân viên kinh doanh
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Lao động phổ thông
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm Kế toán</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm Marketing</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Hành chính nhân sự
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Chăm sóc khách hàng
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm Ngân hàng</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm IT</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm Senior</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Kỹ sư xây dựng
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Thiết kế đồ họa
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                              Việc làm Bất động sản
                            </div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm Giáo dục</div>
                            <div className="text-gray-600 hover:text-green-600 cursor-pointer">Việc làm telesales</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  className="flex items-center text-foreground hover:text-primary transition-colors duration-200"
                  onMouseEnter={() => setShowCreateCVDropdown(true)}
                  onMouseLeave={() => setShowCreateCVDropdown(false)}
                >
                  Tạo CV
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showCreateCVDropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50"
                    onMouseEnter={() => setShowCreateCVDropdown(true)}
                    onMouseLeave={() => setShowCreateCVDropdown(false)}
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-green-600 font-semibold mb-3 flex items-center">Mẫu CV theo style →</div>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                              Mẫu CV Đơn giản
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                              Mẫu CV Ấn tượng
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                              Mẫu CV Chuyên nghiệp
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                              Mẫu CV Hiện đại
                            </div>
                          </div>
                          <div className="mt-6">
                            <div className="text-green-600 font-semibold mb-3 flex items-center">
                              Mẫu CV theo vị trí ứng tuyển →
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                                Nhân viên kinh doanh
                              </div>
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                                Lập trình viên
                              </div>
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                                Nhân viên kế toán
                              </div>
                              <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                                <div className="w-4 h-4 mr-3 bg-gray-300 rounded"></div>
                                Chuyên viên marketing
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-4">
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-6 h-6 mr-3 bg-green-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                              </div>
                              Quản lý CV
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-6 h-6 mr-3 bg-green-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                              </div>
                              Tải CV lên
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-6 h-6 mr-3 bg-green-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                              </div>
                              Hướng dẫn viết CV
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-6 h-6 mr-3 bg-green-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                              </div>
                              Quản lý Cover Letter
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer">
                              <div className="w-6 h-6 mr-3 bg-green-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                              </div>
                              Mẫu Cover Letter
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a href="#" className="text-foreground hover:text-primary transition-colors duration-200">
                Công cụ
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors duration-200">
                Cẩm nang nghề nghiệp
              </a>
              <div className="flex items-center space-x-2">
                <span className="text-foreground">TopCV</span>
                <Badge className="bg-secondary text-secondary-foreground">Pro</Badge>
              </div>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">Chào bạn Nguyễn Huy</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Tìm việc làm nhanh 24h, việc làm mới nhất trên toàn quốc</h1>
            <p className="text-xl opacity-90">
              Tiếp cận <strong>40,000+</strong> tin tuyển dụng việc làm mỗi ngày từ hàng nghìn doanh nghiệp uy tín tại
              Việt Nam
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="search-container p-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main search input - takes most space */}
                <div className="flex-[3] relative group">
                  <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors duration-300" />
                  <Input
                    placeholder="Nhập vị trí tuyển dụng, tên công ty..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="search-input pl-14 pr-6 placeholder:text-muted-foreground/60 text-foreground font-medium"
                  />
                </div>

                {/* Job category dropdown */}
                <Button
                  onClick={() => setShowJobCategoryModal(true)}
                  className="dropdown-button flex-1 min-w-[200px] justify-start text-foreground font-medium"
                >
                  <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                  Danh mục nghề
                  <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                </Button>

                {/* Location dropdown */}
                <Button
                  onClick={() => setShowLocationModal(true)}
                  className="dropdown-button flex-1 min-w-[180px] justify-start text-foreground font-medium"
                >
                  <MapPin className="w-4 h-4 mr-3 text-primary" />
                  {selectedLocation}
                  <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                </Button>

                {/* Search button */}
                <Button
                  onClick={() => setShowSearchResults(true)}
                  className="search-button flex-shrink-0 min-w-[140px]"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Tìm kiếm
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground font-medium">Tìm kiếm phổ biến:</span>
                {["Frontend Developer", "Marketing", "Sales", "Kế toán", "Nhân sự"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchKeyword(tag)}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors duration-200 font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Job Categories */}
            <Card className="mb-6 card-hover">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-foreground">Việc làm theo danh mục</h3>
                <div className="space-y-3">
                  {[
                    "Kinh doanh/Bán hàng",
                    "Marketing/PR/Quảng cáo",
                    "Chăm sóc khách hàng (Customer Service)/Vận hành",
                    "Nhân sự/Hành chính/Pháp chế",
                    "Công nghệ Thông tin",
                    "Lao động phổ thông",
                  ].map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 hover:text-primary cursor-pointer transition-colors duration-200"
                    >
                      <span className="text-sm">{category}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <span className="text-sm text-muted-foreground">1/5</span>
                </div>
              </CardContent>
            </Card>

            {/* Promotional Banner */}
            <Card className="card-hover">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DlIFJsqt0nRO6qQPLHt8ABEMDjP6jk.png"
                    alt="Career promotion"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="font-semibold">THROUGH FINANCE!</h4>
                    <p className="text-sm opacity-90">CLICK HERE EXPLORE YOUR CAREER</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured Jobs */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Việc làm tốt nhất</h2>
                <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
                  <span className="text-sm font-medium">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Senior Sales Logistics Executive - Chuyên Viên Kinh Doanh - Thị Nhận Khống Đối Hợp",
                    company: "CÔNG TY TNHH GIAO NHẬN VẬN TẢI QUỐC TẾ DỊCH VỤ HÀNG KHÔNG VIỆT NAM",
                    location: "Hồ Chí Minh",
                    salary: "15 - 20 triệu",
                    time: "1 ngày trước",
                    urgent: true,
                  },
                  {
                    title: "Nhân Viên Chăm Sóc Khách Hàng Bất Động Sản",
                    company: "CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ PHÁT TRIỂN BẤT ĐỘNG SẢN THĂNG LONG",
                    location: "Hà Nội",
                    salary: "8 - 15 triệu",
                    time: "2 ngày trước",
                  },
                  {
                    title: "Nhân Viên Kinh Doanh / Sales / Tư Vấn Bán Hàng Sản Phẩm Công Nghệ",
                    company: "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ QUỐC TẾ GOLDEN BRIDGE",
                    location: "Hồ Chí Minh",
                    salary: "10 - 20 triệu",
                    time: "3 ngày trước",
                  },
                ].map((job, index) => (
                  <Card key={index} className="card-hover border-border">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-primary hover:text-primary/80 cursor-pointer line-clamp-2 text-lg">
                          {job.title}
                        </h3>
                        {job.urgent && (
                          <Badge className="bg-destructive text-destructive-foreground text-xs font-medium">Gấp</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 font-medium">{job.company}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center font-medium text-secondary">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salary}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.time}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Part-time Jobs */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Việc làm bán thời gian</h2>
                <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
                  <span className="text-sm font-medium">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Chuyên Viên Kinh Doanh B2B/B2M FMCG Tại Nghệ An Tỉ Lệ Hoa Hồng Cao",
                    company: "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ AN KHANG",
                    location: "Nghệ An",
                    salary: "8 - 15 triệu",
                    time: "1 ngày trước",
                  },
                  {
                    title: "Nhân Viên Kinh Doanh Tỉ Trưởng Thực Phẩm Chay",
                    company: "CÔNG TY TNHH SẢN XUẤT VÀ THƯƠNG MẠI THỰC PHẨM VIỆT",
                    location: "Hồ Chí Minh",
                    salary: "12 - 18 triệu",
                    time: "2 ngày trước",
                  },
                ].map((job, index) => (
                  <Card key={index} className="card-hover border-border">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-primary hover:text-primary/80 cursor-pointer mb-3 line-clamp-2 text-lg">
                        {job.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 font-medium">{job.company}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center font-medium text-secondary">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salary}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.time}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Ads */}
            <div className="space-y-6">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <img src="/job-recruitment-celebration.png" alt="Job advertisement" className="w-full rounded-lg" />
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <img src="/hr-recruitment-banner.png" alt="HR recruitment" className="w-full rounded-lg" />
                </CardContent>
              </Card>

              {/* Job Stats */}
              <Card className="gradient-hero text-white card-hover">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-sm mb-6 opacity-90">
                    VIỆC LÀM PHÙ HỢP
                    <br />
                    THU NHẬP CAO TẠI ĐÂY
                  </div>
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận việc phù hợp qua email</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận thông báo nhà tuyển dụng xem hồ sơ</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      <span>Nhận việc làm vip</span>
                    </div>
                  </div>
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold w-full transition-colors duration-200">
                    NHẬN PHÍA NGAY
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Gợi ý việc làm phù hợp</h2>
            <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
              <span className="text-sm font-medium">Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                company: "VINFAST",
                jobs: "317",
                description: "Tập đoàn Vingroup - Thành viên VINFAST",
              },
              {
                company: "VNPAY",
                jobs: "48",
                description: "Công ty Cổ phần Giải pháp Thanh toán Việt Nam",
              },
            ].map((company, index) => (
              <Card key={index} className="card-hover border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{company.company}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{company.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{company.jobs}</div>
                      <div className="text-sm text-muted-foreground font-medium">việc làm</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Industries */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Top ngành nghề nổi bật</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Kinh doanh - Bán hàng", jobs: "14,235 việc làm", icon: "💼" },
              { name: "Marketing - PR - Quảng cáo", jobs: "5,478 việc làm", icon: "📢" },
              { name: "Chăm sóc khách hàng", jobs: "3,823 việc làm", icon: "🎧" },
              { name: "Nhân sự - Hành chính", jobs: "2,945 việc làm", icon: "👥" },
              { name: "Công nghệ thông tin", jobs: "8,156 việc làm", icon: "💻" },
              { name: "Tài chính - Ngân hàng - Bảo hiểm", jobs: "4,267 việc làm", icon: "🏦" },
              { name: "Bất động sản", jobs: "3,891 việc làm", icon: "🏢" },
              { name: "Kế toán - Kiểm toán - Thuế", jobs: "5,634 việc làm", icon: "📊" },
            ].map((industry, index) => (
              <Card key={index} className="card-hover cursor-pointer border-border">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{industry.icon}</div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">{industry.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{industry.jobs}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-primary mb-4">topcv</div>
              <p className="text-sm text-muted-foreground mb-4">Ứng dụng tìm việc làm số 1 Việt Nam</p>
              <div className="flex space-x-4">
                <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
                <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
                <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
                <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Về TopCV</h3>
              <div className="space-y-2 text-sm text-muted-foreground font-medium">
                <div>Giới thiệu</div>
                <div>Góc báo chí</div>
                <div>Tuyển dụng</div>
                <div>Liên hệ</div>
                <div>Hỏi đáp</div>
                <div>Chính sách bảo mật</div>
                <div>Điều khoản dịch vụ</div>
                <div>Quy chế hoạt động</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Hồ sơ và CV</h3>
              <div className="space-y-2 text-sm text-muted-foreground font-medium">
                <div>Quản lý CV của bạn</div>
                <div>TopCV Profile</div>
                <div>Hướng dẫn viết CV</div>
                <div>Thư viện CV theo ngành nghề</div>
                <div>Review CV</div>
                <div>Mẫu CV đẹp</div>
                <div>Tạo CV online</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Xây dựng sự nghiệp</h3>
              <div className="space-y-2 text-sm text-muted-foreground font-medium">
                <div>Việc làm tốt nhất</div>
                <div>Việc làm lương cao</div>
                <div>Việc làm quản lý</div>
                <div>Việc làm IT</div>
                <div>Việc làm Senior</div>
                <div>Việc làm bán thời gian</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                <strong>Công ty Cổ phần TopCV Việt Nam</strong>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-foreground rounded grid grid-cols-3 gap-px">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-background rounded-sm"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              © 2014-2025 TopCV Vietnam JSC. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{selectedLocation}</span>
                </div>
                <button onClick={() => setShowLocationModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Nhập Tỉnh/Thành phố" className="pl-10" />
              </div>
            </div>
            <div className="flex max-h-96">
              <div className="w-1/2 border-r border-gray-200">
                <div className="p-4">
                  <div className="space-y-2">
                    {["Hà Nội", "Hồ Chí Minh", "Bình Dương", "Bắc Ninh", "Đồng Nai", "Hưng Yên", "Hải Dương"].map(
                      (city) => (
                        <div
                          key={city}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <div className="flex items-center">
                            <Checkbox checked={selectedLocation === city} onChange={() => setSelectedLocation(city)} />
                            <span className="ml-3">{city}</span>
                          </div>
                          {city === "Hồ Chí Minh" && <span className="text-sm text-gray-500">Tất cả</span>}
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="w-1/2">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">QUẬN/HUYỆN</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {["Tất cả", "Bình Chánh", "Bình Tân", "Bình Thạnh", "Cần Giờ", "Củ Chi", "Gò Vấp"].map(
                      (district) => (
                        <div key={district} className="flex items-center">
                          <Checkbox
                            checked={selectedDistricts.includes(district)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedDistricts([...selectedDistricts, district])
                              } else {
                                setSelectedDistricts(selectedDistricts.filter((d) => d !== district))
                              }
                            }}
                          />
                          <span className="ml-3">{district}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <Button variant="outline" onClick={() => setSelectedDistricts([])}>
                Bỏ chọn tất cả
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowLocationModal(false)}>
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      )}

      {showJobCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Chọn Nhóm nghề, Nghề hoặc Chuyên môn</h2>
                <button onClick={() => setShowJobCategoryModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Nhập từ khóa tìm kiếm" className="pl-10" />
              </div>
            </div>
            <div className="flex max-h-96">
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">NHÓM NGHỀ</h3>
                  <div className="space-y-2">
                    {[
                      "Kinh doanh/Bán hàng",
                      "Marketing/PR/Quảng cáo",
                      "Chăm sóc khách hàng (Customer Service)/Vận hành",
                      "Nhân sự/Hành chính/Pháp chế",
                      "Công nghệ Thông tin",
                      "Lao động phổ thông",
                    ].map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Checkbox />
                          <span className="ml-3 text-sm">{category}</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">NGHỀ</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Software Engineering", checked: false },
                      { name: "Software Testing", checked: false },
                      { name: "Artificial Intelligence (AI)", checked: false },
                    ].map((job) => (
                      <div key={job.name} className="p-2">
                        <div className="flex items-center mb-2">
                          <Checkbox checked={job.checked} />
                          <span className="ml-3 font-medium">{job.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-1/3">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">VỊ TRÍ CHUYÊN MÔN</h3>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Software Engineer",
                        "Backend Developer",
                        "Frontend Developer",
                        "Mobile Developer",
                        "Fullstack Developer",
                        "Blockchain Engineer",
                      ].map((position) => (
                        <Badge key={position} variant="outline" className="text-xs">
                          {position}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-600">
                Bạn gặp vấn đề với Danh mục Nghề? <span className="text-green-600 cursor-pointer">Gửi góp ý</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Bỏ chọn tất cả</Button>
                <Button variant="outline">Hủy</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowJobCategoryModal(false)}>
                  Chọn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobSearchResults({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors duration-200"
              onClick={onBack}
            >
              ← Trang chủ
            </Button>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <span>Danh mục Nghề (1)</span>
              <X className="w-4 h-4 cursor-pointer hover:text-white/70" />
            </div>
            <Input
              placeholder="Vị trí tuyển dụng"
              className="flex-1 bg-white text-foreground border-0 focus:ring-2 focus:ring-white/30"
            />
            <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <MapPin className="w-4 h-4" />
              <span>Hồ Chí Minh</span>
              <X className="w-4 h-4 cursor-pointer hover:text-white/70" />
            </div>
            <Button className="button-primary">Tìm kiếm</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="text-primary hover:text-primary/80 cursor-pointer">Trang chủ</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary hover:text-primary/80 cursor-pointer">Việc làm Công nghệ Thông tin</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary hover:text-primary/80 cursor-pointer">Software Engineering</span>
          <ChevronRight className="w-4 h-4" />
          <span>Software Engineer</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Tuyển dụng 275 việc làm Software Engineer [Update 19/08/2025]
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-muted-foreground font-medium">Từ khóa gợi ý:</span>
            {[
              "front end developer",
              "back end developer",
              "full stack developer",
              "mobile developer",
              "software developer",
              "blockchain developer",
            ].map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors duration-200"
              >
                {keyword}
              </Badge>
            ))}
          </div>
          <div className="bg-primary/10 text-primary p-4 rounded-lg border border-primary/20">
            Có <strong>63</strong> việc làm tại <strong>Hồ Chí Minh</strong>.{" "}
            <span className="text-primary font-semibold cursor-pointer hover:text-primary/80">Xem ngay →</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Lọc nâng cao</span>
                </div>

                {/* Job Categories */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">Theo danh mục nghề</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Software Engineering", count: 249 },
                      { name: "IT Management/Specialist", count: 9 },
                      { name: "Công nghệ thông tin khác", count: 9 },
                      { name: "IT Project Management", count: 4 },
                      { name: "IoT/Embedded Engineer", count: 2 },
                    ].map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Checkbox />
                          <span className="ml-2 text-sm text-foreground">{category.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({category.count})</span>
                      </div>
                    ))}
                    <button className="text-primary text-sm hover:text-primary/80 cursor-pointer transition-colors duration-200">
                      Xem thêm
                    </button>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">Kinh nghiệm</h3>
                  <RadioGroup defaultValue="all">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="text-sm text-foreground">
                        Tất cả
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-requirement" id="no-requirement" />
                      <Label htmlFor="no-requirement" className="text-sm text-foreground">
                        Không yêu cầu
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="under-1" id="under-1" />
                      <Label htmlFor="under-1" className="text-sm text-foreground">
                        Dưới 1 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-year" id="1-year" />
                      <Label htmlFor="1-year" className="text-sm text-foreground">
                        1 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2-years" id="2-years" />
                      <Label htmlFor="2-years" className="text-sm text-foreground">
                        2 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-years" id="3-years" />
                      <Label htmlFor="3-years" className="text-sm text-foreground">
                        3 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4-years" id="4-years" />
                      <Label htmlFor="4-years" className="text-sm text-foreground">
                        4 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5-years" id="5-years" />
                      <Label htmlFor="5-years" className="text-sm text-foreground">
                        5 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="over-5" id="over-5" />
                      <Label htmlFor="over-5" className="text-sm text-foreground">
                        Trên 5 năm
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  Tên việc làm
                </Button>
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  Tên công ty
                </Button>
                <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20">
                  Cả hai
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ưu tiên hiển thị theo:</span>
                <select className="border border-border rounded px-3 py-1 text-sm bg-background text-foreground">
                  <option>Search by AI</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Job Card 1 */}
              <Card className="card-hover border-border">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      MOOVTEK
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-primary hover:text-primary/80 cursor-pointer">
                          Mid-Level Software Developer (Backend Focus) ⚡
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20">Thỏa thuận</Badge>
                          <Heart className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-destructive transition-colors duration-200" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2 font-medium">
                        CÔNG TY CỔ PHẦN THƯƠNG MẠI - DỊCH VỤ MOOV
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Hồ Chí Minh
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />2 năm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="border-border">
                          Software Engineer
                        </Badge>
                        <Badge variant="outline" className="border-border">
                          IT - Phần mềm
                        </Badge>
                        <span className="text-muted-foreground ml-auto">Đăng hôm nay</span>
                        <Bookmark className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors duration-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Card 2 */}
              <Card className="card-hover border-primary/30">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 border-2 border-primary rounded-lg flex items-center justify-center">
                      <div className="text-primary font-bold text-xs">VIETNIX</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-primary hover:text-primary/80 cursor-pointer">
                          WordPress Developer _ Tp. Hồ Chí Minh _ Thu Nhập 15 - 20 Triệu ⚡
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20 font-medium">
                            15 - 20 triệu
                          </Badge>
                          <Heart className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-destructive transition-colors duration-200" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2 font-medium">
                        CÔNG TY CỔ PHẦN GIẢI PHÁP VÀ CÔNG NGHỆ VIETNIX
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Hồ Chí Minh
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />1 năm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className="bg-primary/10 text-primary border-primary/20">Dễ xuất cho bạn</Badge>
                        <span className="text-muted-foreground ml-auto">Đăng hôm nay</span>
                        <Bookmark className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors duration-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-6 bottom-6 flex flex-col gap-3">
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full button-secondary shadow-lg">
          <span className="text-xs font-semibold">Góp ý</span>
        </Button>
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <span className="text-xs font-semibold">Hỗ trợ</span>
        </Button>
      </div>
    </div>
  )
}
