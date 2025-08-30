"use client";

import {
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import HeroSection from "@/components/layout/hero-section";
interface HomePageProps {
  onSearch?: (keyword: string) => void;
}

export default function HomePage({ onSearch }: HomePageProps) {
  const router = useRouter();

  const handleSearch = (keyword: string) => {
    if (onSearch) {
      onSearch(keyword);
    } else {
      // Use Next.js routing
      router.push("/search");
    }
  };
  return (
    <PageLayout>
      <HeroSection onSearch={handleSearch} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Job Categories */}
            <Card className="mb-6 card-hover">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-foreground">
                  Việc làm theo danh mục
                </h3>
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
                    <p className="text-sm opacity-90">
                      CLICK HERE EXPLORE YOUR CAREER
                    </p>
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
                <h2 className="text-2xl font-bold text-foreground">
                  Việc làm tốt nhất
                </h2>
                <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
                  <span className="text-sm font-medium">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title:
                      "Senior Sales Logistics Executive - Chuyên Viên Kinh Doanh - Thị Nhận Khống Đối Hợp",
                    company:
                      "CÔNG TY TNHH GIAO NHẬN VẬN TẢI QUỐC TẾ DỊCH VỤ HÀNG KHÔNG VIỆT NAM",
                    location: "Hồ Chí Minh",
                    salary: "15 - 20 triệu",
                    time: "1 ngày trước",
                    urgent: true,
                  },
                  {
                    title: "Nhân Viên Chăm Sóc Khách Hàng Bất Động Sản",
                    company:
                      "CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ PHÁT TRIỂN BẤT ĐỘNG SẢN THĂNG LONG",
                    location: "Hà Nội",
                    salary: "8 - 15 triệu",
                    time: "2 ngày trước",
                  },
                  {
                    title:
                      "Nhân Viên Kinh Doanh / Sales / Tư Vấn Bán Hàng Sản Phẩm Công Nghệ",
                    company:
                      "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ QUỐC TẾ GOLDEN BRIDGE",
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
                          <Badge className="bg-destructive text-destructive-foreground text-xs font-medium">
                            Gấp
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 font-medium">
                        {job.company}
                      </p>
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
                <h2 className="text-2xl font-bold text-foreground">
                  Việc làm bán thời gian
                </h2>
                <div className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer transition-colors duration-200">
                  <span className="text-sm font-medium">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title:
                      "Chuyên Viên Kinh Doanh B2B/B2M FMCG Tại Nghệ An Tỉ Lệ Hoa Hồng Cao",
                    company: "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ AN KHANG",
                    location: "Nghệ An",
                    salary: "8 - 15 triệu",
                    time: "1 ngày trước",
                  },
                  {
                    title: "Nhân Viên Kinh Doanh Tỉ Trưởng Thực Phẩm Chay",
                    company:
                      "CÔNG TY TNHH SẢN XUẤT VÀ THƯƠNG MẠI THỰC PHẨM VIỆT",
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
                      <p className="text-sm text-muted-foreground mb-3 font-medium">
                        {job.company}
                      </p>
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
                  <img
                    src="/job-recruitment-celebration.png"
                    alt="Job advertisement"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <img
                    src="/hr-recruitment-banner.png"
                    alt="HR recruitment"
                    className="w-full rounded-lg"
                  />
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
            <h2 className="text-2xl font-bold text-foreground">
              Gợi ý việc làm phù hợp
            </h2>
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
                        <h3 className="font-semibold text-foreground">
                          {company.company}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">
                          {company.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {company.jobs}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        việc làm
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Industries */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Top ngành nghề nổi bật
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Kinh doanh - Bán hàng",
                jobs: "14,235 việc làm",
                icon: "💼",
              },
              {
                name: "Marketing - PR - Quảng cáo",
                jobs: "5,478 việc làm",
                icon: "📢",
              },
              {
                name: "Chăm sóc khách hàng",
                jobs: "3,823 việc làm",
                icon: "🎧",
              },
              {
                name: "Nhân sự - Hành chính",
                jobs: "2,945 việc làm",
                icon: "👥",
              },
              {
                name: "Công nghệ thông tin",
                jobs: "8,156 việc làm",
                icon: "💻",
              },
              {
                name: "Tài chính - Ngân hàng - Bảo hiểm",
                jobs: "4,267 việc làm",
                icon: "🏦",
              },
              { name: "Bất động sản", jobs: "3,891 việc làm", icon: "🏢" },
              {
                name: "Kế toán - Kiểm toán - Thuế",
                jobs: "5,634 việc làm",
                icon: "📊",
              },
            ].map((industry, index) => (
              <Card
                key={index}
                className="card-hover cursor-pointer border-border"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{industry.icon}</div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">
                    {industry.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    {industry.jobs}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
