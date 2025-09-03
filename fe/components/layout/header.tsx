"use client";
{
  /* dùng use client để sử dụng state trong react
 Component mount là khi component được render lại
   */
}
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  User,
  ChevronDown,
  Search,
  Bookmark,
  Eye,
  Heart,
  Building2,
  LogOut,
  ChevronRight,
} from "lucide-react"; //icon
import { Badge } from "@/components/ui/badge"; // bo tròn như badge
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Link from "next/link"; // link to other page
import { truncate } from "fs/promises";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getUserAvatar } from "@/lib/api";

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
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  // Sử dụng custom hook cho 2 dropdowns
  const jobsDropdown = useDropdown(150);
  const cvDropdown = useDropdown(150);

  // Đăng nhập khi có user trong context

  // Mock data cho các vị trí việc làm (sẽ thay bằng API call sau)
  const jobPositions = [
    { id: 1, name: "Nhân viên kinh doanh" },
    { id: 2, name: "Lao động phổ thông" },
    { id: 3, name: "Kế toán" },
    { id: 4, name: "Marketing" },
    { id: 5, name: "Hành chính nhân sự" },
    { id: 6, name: "Chăm sóc khách hàng" },
    { id: 7, name: "Ngân hàng" },
    { id: 8, name: "IT" },
    { id: 9, name: "Senior" },
    { id: 10, name: "Kỹ sư xây dựng" },
    { id: 11, name: "Thiết kế đồ họa" },
    { id: 12, name: "Bất động sản" },
    { id: 13, name: "Giáo dục" },
    { id: 14, name: "Telesales" },
  ];

  // Mock data cho các mẫu CV
  const cvTemplates = [
    { id: 1, name: "Mẫu CV Đơn giản", style: "Simple" },
    { id: 2, name: "Mẫu CV Ấn tượng", style: "Impressive" },
    { id: 3, name: "Mẫu CV Chuyên nghiệp", style: "Professional" },
    { id: 4, name: "Mẫu CV Hiện đại", style: "Modern" },
  ];

  // Mock data cho CV theo vị trí
  const cvByPosition = [
    { id: 1, name: "Nhân viên kinh doanh" },
    { id: 2, name: "Lập trình viên" },
    { id: 3, name: "Nhân viên kế toán" },
    { id: 4, name: "Chuyên viên marketing" },
  ];

  // Mock data cho các tính năng CV
  const cvFeatures = [
    { id: 1, name: "Quản lý CV" },
    { id: 2, name: "Tải CV lên" },
    { id: 3, name: "Hướng dẫn viết CV" },
    { id: 4, name: "Quản lý Cover Letter" },
    { id: 5, name: "Mẫu Cover Letter" },
  ];

  // Click handlers (sẽ thay bằng navigation sau)
  const handleJobPositionClick = (position: (typeof jobPositions)[0]) => {
    console.log(`Clicked on job position: ${position.name}`);
    // TODO: Navigate to job search with filter
  };

  const handleCVTemplateClick = (template: (typeof cvTemplates)[0]) => {
    console.log(`Clicked on CV template: ${template.name} (${template.style})`);
    // TODO: Navigate to CV template page
  };

  const handleCVByPositionClick = (position: (typeof cvByPosition)[0]) => {
    console.log(`Clicked on CV by position: ${position.name}`);
    // TODO: Navigate to CV by position page
  };

  const handleCVFeatureClick = (feature: (typeof cvFeatures)[0]) => {
    console.log(`Clicked on CV feature: ${feature.name}`);
    // TODO: Navigate to feature page
  };

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
              className="text-2xl font-bold text-primary hover:text-primary/50 transition-colors duration-200 cursor-pointer"
              // transition-colors duration-200: khi hover thì màu chữ thành 50% màu gốc nhưng phải có transition-colors vì nếu không có thì màu chữ sẽ thay đổi ngay lập tức không mượt
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
                {/* chevron down: mũi tên xuống ^ */}
              </button>
              {jobsDropdown.isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-150 bg-card border border-border rounded-lg shadow-xl z-50"
                  // rounded-lg: bo tròn, border-border: viền màu xám, shadow-xl: bóng mờ ở dưới của dropdown
                  onMouseEnter={jobsDropdown.openDropdown}
                  onMouseLeave={jobsDropdown.closeDropdown}
                >
                  <div className="p-6">
                    {/* p-6 là padding 6px */}
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        {/* 800 là màu xám đậm ,mức màu từ 0 đến 900*/}
                        <h3 className="font-semibold text-gray-800 mb-4">
                          VIỆC LÀM
                        </h3>
                        <div className="space-y-3">
                          <Link
                            href="/search"
                            className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          >
                            {/* tailwind items-center: căn giữa theo chiều dọc= align-center, align-items-center, biến mũi tên thành bàn tay */}
                            <Search className="w-4 h-4 mr-3" />
                            Tìm việc làm
                            {/* ml-auto: margin-left: auto, opacity-0: mờ đi, group-hover:opacity-100: khi hover thì mờ đi, group-hover:translate-x-1: khi hover thì dịch qua phải 1px */}
                            <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                              →
                            </span>
                          </Link>
                          <Link
                            href="/saved-jobs"
                            className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          >
                            <Bookmark className="w-4 h-4 mr-3" />
                            Việc làm đã lưu
                            <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                              →
                            </span>
                          </Link>
                          <Link
                            href="/applied-jobs"
                            className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            Việc làm đã ứng tuyển
                            <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                              →
                            </span>
                          </Link>
                          <Link
                            href="/recommended-jobs"
                            className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          >
                            <Heart className="w-4 h-4 mr-3" />
                            Việc làm phù hợp
                            <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                              →
                            </span>
                          </Link>
                        </div>
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            CÔNG TY
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
                              <Building2 className="w-4 h-4 mr-3" />
                              Danh sách công ty
                              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                →
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
                              <Building2 className="w-4 h-4 mr-3" />
                              Top công ty
                              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-4">
                          VIỆC LÀM THEO VỊ TRÍ
                        </h3>
                        <div className="space-y-2">
                          {jobPositions.map((position) => (
                            <div
                              key={position.id}
                              className="text-gray-600 hover:text-primary cursor-pointer flex items-center group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                              onClick={() => handleJobPositionClick(position)}
                            >
                              <span>Việc làm {position.name}</span>
                              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                →
                              </span>
                            </div>
                          ))}
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
                  className="absolute top-full left-0 mt-2 w-150 bg-card border border-border rounded-lg shadow-xl z-50"
                  onMouseEnter={cvDropdown.openDropdown}
                  onMouseLeave={cvDropdown.closeDropdown}
                >
                  {/*tuyệt đối, trùng mép trái phần tử cha */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* chia 2 cột, grid bố cục hàng cột */}
                      <div>
                        <div className="text-primary font-semibold mb-3 flex items-center">
                          Mẫu CV theo style
                        </div>
                        <div className="space-y-3">
                          {cvTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                              onClick={() => handleCVTemplateClick(template)}
                            >
                              <div className="w-4 h-4 mr-3 bg-gray-300 rounded group-hover:bg-primary transition-colors duration-200"></div>
                              <span>{template.name}</span>
                              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                →
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          <div className="text-primary font-semibold mb-3 flex items-center">
                            Mẫu CV theo vị trí ứng tuyển
                          </div>
                          <div className="space-y-3">
                            {cvByPosition.map((position) => (
                              <div
                                key={position.id}
                                className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                                onClick={() =>
                                  handleCVByPositionClick(position)
                                }
                              >
                                <div className="w-4 h-4 mr-3 bg-gray-300 rounded group-hover:bg-primary transition-colors duration-200"></div>
                                <span>{position.name}</span>
                                <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                  →
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="space-y-4">
                          {cvFeatures.map((feature) => (
                            <div
                              key={feature.id}
                              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                              onClick={() => handleCVFeatureClick(feature)}
                            >
                              <div className="w-6 h-6 mr-3 bg-gray-300 rounded flex items-center justify-center group-hover:bg-primary transition-colors duration-200"></div>
                              <span>{feature.name}</span>
                              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                →
                              </span>
                            </div>
                          ))}
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
            {/* Theme Switch */}
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label="Toggle dark mode"
              title="Dark mode"
              className="w-10 h-6"
            />

            {user ? (
              // UI khi đã đăng nhập
              <>
                <Bell className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200" />
                <div className="flex items-center">
                  <HoverCard openDelay={100} closeDelay={150}>
                    <HoverCardTrigger asChild>
                                                           <button className="flex items-center space-x-2">
                     <Avatar>
                       <AvatarImage
                         src={getUserAvatar(user) || "/placeholder-user.jpg"}
                         alt="User avatar"
                       />
                       <AvatarFallback>
                         {user.firstName?.[0]}
                         {user.lastName?.[0]}
                       </AvatarFallback>
                     </Avatar>
                   </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[360px] p-0 overflow-hidden">
                      <div className="p-4 border-b border-border flex items-center space-x-3">
                                                 <Avatar>
                           <AvatarImage
                             src={getUserAvatar(user) || "/placeholder-user.jpg"}
                             alt="User avatar"
                           />
                           <AvatarFallback>
                             {user.firstName?.[0]}
                             {user.lastName?.[0]}
                           </AvatarFallback>
                         </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.fullName ||
                              `${user.firstName} ${user.lastName}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.isEmailVerified
                              ? "Tài khoản đã xác thực"
                              : "Chưa xác thực email"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <Accordion
                          type="multiple"
                          defaultValue={["jobs", "cv"]}
                          className="space-y-1"
                        >
                          <AccordionItem value="jobs" className="border-0">
                            <AccordionTrigger className="px-2 text-foreground">
                              Quản lý tìm việc
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2">
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <Link
                                  href="/saved-jobs"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Việc làm đã lưu</span>
                                </Link>
                                <Link
                                  href="/applied-jobs"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Việc làm đã ứng tuyển</span>
                                </Link>
                                <Link
                                  href="/recommended-jobs"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Việc làm phù hợp với bạn</span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Cài đặt gợi ý việc làm</span>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="cv" className="border-0">
                            <AccordionTrigger className="px-2 text-foreground">
                              Quản lý CV & Cover letter
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2">
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>CV của tôi</span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Cover Letter của tôi</span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>
                                    Nhà tuyển dụng muốn kết nối với bạn
                                  </span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Nhà tuyển dụng xem hồ sơ</span>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="security" className="border-0">
                            <AccordionTrigger className="px-2 text-foreground">
                              Cá nhân & Bảo mật
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2">
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <Link
                                  href="/profile"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Hồ sơ cá nhân</span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Đổi mật khẩu</span>
                                </Link>
                                <Link
                                  href="#"
                                  className="flex items-center rounded-md px-2 py-2 hover:bg-muted hover:text-foreground"
                                >
                                  <span>Quyền riêng tư</span>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <div className="pt-3">
                          <button
                            type="button"
                            className="group w-full flex items-center justify-center gap-2 rounded-full bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none shadow-sm hover:shadow transition-all py-3 active:scale-[0.98]"
                            aria-label="Đăng xuất"
                            onClick={() => {
                              logout();
                              router.push("/login");
                            }}
                          >
                            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            <span className="font-medium">Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </>
            ) : (
              // UI khi chưa đăng nhập
              <>
                <Link href="/login">
                  <button className="px-4 py-2 text-foreground hover:text-primary transition-colors duration-200 font-medium">
                    Đăng nhập
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors duration-200 font-medium">
                    Đăng ký
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
