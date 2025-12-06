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
  BellRing,
  User,
  ChevronDown,
  Search,
  Bookmark,
  Eye,
  Heart,
  Building2,
  LogOut,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Target,
  Map,
  BarChart3,
  FileText,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Link from "next/link"; // link to other page
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getUserAvatar, industriesAPI, Industry } from "@/lib/api";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notificationAPI";

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
  const { user, loading, logout } = useAuth();

  // Sử dụng custom hook cho 2 dropdowns
  const jobsDropdown = useDropdown(150);
  const aiDropdown = useDropdown(150);

  // Đăng nhập khi có user trong context

  // State cho industries
  const [jobPositions, setJobPositions] = useState<Industry[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingPositions(true);
        const data = await industriesAPI.getRootIndustries();
        setJobPositions(data);
      } catch (error) {
        console.error("Failed to fetch industries:", error);
        setJobPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };
    fetchIndustries();
  }, []);

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const fetchNotifications = useCallback(
    async (options?: { silent?: boolean }) => {
      const token = getAuthToken();
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!options?.silent) {
        setLoadingNotifications(true);
      }

      try {
        const response = await getNotifications(token, { limit: 10 });
        if (response.success) {
          setNotifications(response.data || []);
          if (typeof response.unreadCount === "number") {
            setUnreadCount(response.unreadCount);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (!options?.silent) {
          setLoadingNotifications(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchNotifications({ silent: true });
  }, [fetchNotifications]);

  useEffect(() => {
    if (notificationDropdownOpen) {
      fetchNotifications();
    }
  }, [notificationDropdownOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await markNotificationAsRead(token, notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await markAllNotificationsAsRead(token);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: notif.readAt || new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_APPLICATION":
        return <BellRing className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    if (notification.data?.jobId) {
      router.push(`/jobs/${notification.data.jobId}`);
      setNotificationDropdownOpen(false);
    }
  };

  // Click handlers
  const handleJobPositionClick = (industry: Industry) => {
    const params = new URLSearchParams();
    params.set("industry", industry.code);
    router.push(`/search?${params.toString()}`);
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
                            href="/jobs/saved-jobs"
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
                          {loadingPositions ? (
                            <div className="text-sm text-muted-foreground py-2">
                              Đang tải...
                            </div>
                          ) : jobPositions.length > 0 ? (
                            jobPositions.map((industry) => (
                              <div
                                key={industry._id}
                                className="text-gray-600 hover:text-primary cursor-pointer flex items-center group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                                onClick={() => handleJobPositionClick(industry)}
                              >
                                <span>Việc làm {industry.name.vi}</span>
                                <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                                  →
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              Chưa có dữ liệu
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI & Kỹ năng Dropdown */}
            <div className="relative">
              <button
                className="flex items-center text-foreground hover:text-primary transition-colors duration-200"
                onMouseEnter={aiDropdown.openDropdown}
                onMouseLeave={aiDropdown.closeDropdown}
              >
                AI & Kỹ năng
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {aiDropdown.isOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50"
                  onMouseEnter={aiDropdown.openDropdown}
                  onMouseLeave={aiDropdown.closeDropdown}
                >
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      TÍNH NĂNG AI
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href="/cv-analysis"
                        className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        Phân tích CV bằng AI
                        <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                          →
                        </span>
                      </Link>
                      <Link
                        href="/job-recommendations"
                        className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                      >
                        <TrendingUp className="w-4 h-4 mr-3" />
                        Gợi ý việc làm AI
                        <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                          →
                        </span>
                      </Link>
                      <Link
                        href="/skill-gap-analysis"
                        className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                      >
                        <Target className="w-4 h-4 mr-3" />
                        Phân tích khoảng cách kỹ năng
                        <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                          →
                        </span>
                      </Link>
                      <Link
                        href="/roadmaps"
                        className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                      >
                        <Map className="w-4 h-4 mr-3" />
                        Lộ trình học tập
                        <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                          →
                        </span>
                      </Link>
                      <Link
                        href="/insights"
                        className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        Thông tin ứng viên
                        <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/my-cv/templates"
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Tạo CV với template
              </Link>
              <Link
                href="/my-cv"
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Tải lên và quản lý CV
              </Link>
            </div>

            <a
              href="#"
              className="text-foreground hover:text-primary transition-colors duration-200"
            >
              Cẩm nang nghề nghiệp
            </a>
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

            {loading ? (
              // UI khi đang loading - hiển thị skeleton hoặc ẩn
              <div className="flex items-center space-x-4">
                <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
                <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
              </div>
            ) : user ? (
              // UI khi đã đăng nhập
              <>
                <DropdownMenu
                  open={notificationDropdownOpen}
                  onOpenChange={setNotificationDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 font-bold">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[380px] p-0 rounded-2xl border border-border bg-card shadow-xl"
                  >
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">
                          Thông báo
                        </h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                              {unreadCount} chưa đọc
                            </Badge>
                          )}
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-primary hover:text-primary/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAllAsRead();
                              }}
                            >
                              Đánh dấu tất cả
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notifications.length > 0
                          ? `${notifications.length} thông báo gần nhất`
                          : "Chưa có thông báo"}
                      </p>
                    </div>
                    <ScrollArea className="h-[360px]">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Bell className="w-10 h-10 mb-3" />
                          <p>Chưa có thông báo nào</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 hover:bg-muted/60 transition-colors cursor-pointer ${
                                !notification.isRead ? "bg-muted/40" : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                    !notification.isRead
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {getTypeIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4
                                      className={`text-sm font-semibold line-clamp-1 ${
                                        !notification.isRead
                                          ? "text-foreground"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <Circle className="w-2 h-2 fill-primary text-primary flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeAgo(notification.createdAt)}
                                    </div>
                                    {notification.data?.jobId && (
                                      <div className="flex items-center gap-1 text-primary">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Xem công việc</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification._id);
                                    }}
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-primary hover:text-primary/80"
                        onClick={() => {
                          setNotificationDropdownOpen(false);
                          router.push("/notifications");
                        }}
                      >
                        Xem tất cả thông báo
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center">
                  <HoverCard openDelay={100} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <button className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage
                            src={
                              (user ? getUserAvatar(user) : undefined) ||
                              "/placeholder-user.jpg"
                            }
                            alt="User avatar"
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback>
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[360px] p-0 overflow-hidden">
                      <div className="p-4 border-b border-border flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              (user ? getUserAvatar(user) : undefined) ||
                              "/placeholder-user.jpg"
                            }
                            alt="User avatar"
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback>
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {user?.fullName ||
                              `${user?.firstName ?? ""} ${
                                user?.lastName ?? ""
                              }`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user?.isEmailVerified
                              ? "Tài khoản đã xác thực"
                              : "Chưa xác thực email"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user?.email}
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
                                  href="/my-cv"
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
