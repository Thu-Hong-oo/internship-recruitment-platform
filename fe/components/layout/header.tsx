"use client";
{
  /* dùng use client để sử dụng state trong react
 Component mount là khi component được render lại
   */
}
import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  User,
  ChevronDown,
  Search,
  Bookmark,
  Eye,
  Heart,
  Building2,
} from "lucide-react"; //icon
import { Badge } from "@/components/ui/badge"; // bo tròn như badge
import Link from "next/link"; // link to other page

// Custom hook để quản lý dropdown
const useDropdown = (delay = 150) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // dùng usecallback chỉ tạo lại fuction khi tham số thay đổi
  const openDropdown = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsOpen(true);
  }, [timeoutId]);

  const closeDropdown = useCallback(() => {
    const newTimeout = setTimeout(() => {
      setIsOpen(false);
    }, delay);
    setTimeoutId(newTimeout);
  }, [delay]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return { isOpen, openDropdown, closeDropdown };
};

export default function Header() {
  // Sử dụng custom hook cho 2 dropdowns
  const jobsDropdown = useDropdown(150);
  const cvDropdown = useDropdown(150);

  return (
    <header className="bg-card border-b border-border shadow-sm">
      {/* hơi bóng nhẹ */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* dàn ra 2 đầu, xếp ngang */}
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer"
            >
              InternBridge
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* ẩn khi dùng màn nhỏ */}
            <div className="relative">
              <button
                className="flex items-center text-foreground hover:text-primary transition-colors duration-200"
                onMouseEnter={jobsDropdown.openDropdown}
                onMouseLeave={jobsDropdown.closeDropdown}
              >
                Việc làm
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {jobsDropdown.isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50"
                  onMouseEnter={jobsDropdown.openDropdown}
                  onMouseLeave={jobsDropdown.closeDropdown}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-4">
                          VIỆC LÀM
                        </h3>
                        <div className="space-y-3">
                          <Link
                            href="/search"
                            className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer"
                          >
                            {/* tailwind items-center: căn giữa theo chiều dọc= align-center, align-items-center */}
                            <Search className="w-4 h-4 mr-3" />
                            Tìm việc làm
                          </Link>
                          <Link
                            href="/saved-jobs"
                            className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer"
                          >
                            <Bookmark className="w-4 h-4 mr-3" />
                            Việc làm đã lưu
                          </Link>
                          <Link
                            href="/applied-jobs"
                            className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            Việc làm đã ứng tuyển
                          </Link>
                          <Link
                            href="/recommended-jobs"
                            className="flex items-center text-gray-600 hover:text-green-600 cursor-pointer"
                          >
                            <Heart className="w-4 h-4 mr-3" />
                            Việc làm phù hợp
                          </Link>
                        </div>
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            CÔNG TY
                          </h3>
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
                        <h3 className="font-semibold text-gray-800 mb-4">
                          VIỆC LÀM THEO VỊ TRÍ
                        </h3>
                        <div className="space-y-2">
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Nhân viên kinh doanh
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Lao động phổ thông
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Kế toán
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Marketing
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Hành chính nhân sự
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Chăm sóc khách hàng
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Ngân hàng
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm IT
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Senior
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Kỹ sư xây dựng
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Thiết kế đồ họa
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Bất động sản
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm Giáo dục
                          </div>
                          <div className="text-gray-600 hover:text-green-600 cursor-pointer">
                            Việc làm telesales
                          </div>
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
                onMouseEnter={cvDropdown.openDropdown}
                onMouseLeave={cvDropdown.closeDropdown}
              >
                Tạo CV
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {cvDropdown.isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50"
                  onMouseEnter={cvDropdown.openDropdown}
                  onMouseLeave={cvDropdown.closeDropdown}
                >
                  {/*tuyệt đối, trùng mép trái phần tử cha */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* chia 2 cột, grid bố cục hàng cột */}
                      <div>
                        <div className="text-green-600 font-semibold mb-3 flex items-center">
                          Mẫu CV theo style →
                        </div>
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

            <Link
              href="/test"
              className="text-foreground hover:text-primary transition-colors duration-200"
            >
              Test Navigation
            </Link>
            <a
              href="#"
              className="text-foreground hover:text-primary transition-colors duration-200"
            >
              Cẩm nang nghề nghiệp
            </a>
            <div className="flex items-center space-x-2">
              <span className="text-foreground">TopCV</span>
              <Badge className="bg-secondary text-secondary-foreground">
                Pro
              </Badge>
            </div>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground">
                Chào bạn Nguyễn Huy
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
