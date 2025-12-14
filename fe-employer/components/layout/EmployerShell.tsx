"use client";

import { ReactNode, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  Briefcase,
  FileText,
  FolderOpen,
  Building2,
  Users,
  UserSearch,
  Settings,
  Shield,
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useEmployerProfile } from "@/contexts/EmployerProfileContext";
import { User as UserType, getUserData, getToken, clearUserData } from "@/lib/userStorage";
import { getMyMembership, TeamPermissions } from "@/lib/teamAPI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notificationAPI";
import { logoutEmployer } from "@/lib/api";
import { useRef } from "react";
import { io, Socket } from "socket.io-client";

type NavKey =
  | "dashboard"
  | "jobs"
  | "applications"
  | "analytics"
  | "company"
  | "team"
  | "candidates"
  | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: any;
  permission?: keyof TeamPermissions;
  ownerOnly?: boolean;
}

interface Props {
  active?: NavKey;
  children: ReactNode;
}

// Get socket URL (remove /api from API_BASE_URL)
const getSocketUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api$/, "");
};

export default function EmployerShell({ active = "dashboard", children }: Props) {
  const router = useRouter();
  const { profile } = useEmployerProfile();
  const [user, setUser] = useState<UserType | null>(null);
  const [employerStatus, setEmployerStatus] = useState<
    "draft" | "pending" | "verified" | "rejected" | "suspended" | null
  >(null);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<TeamPermissions | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const userData = getUserData();
    if (userData) setUser(userData);
  }, []);

  useEffect(() => {
    if (!profile || !profile.user) return;
    const profileUser = profile.user;

    setUser((prev) => {
      const base = prev || getUserData();
      if (!base) return null;
      const newFullName = profileUser.fullName || base.fullName || "User";
      const newAvatar = profileUser.avatar || base.avatar;
      
      // Only update if values actually changed to prevent unnecessary re-renders
      if (prev && base.fullName === newFullName && base.avatar === newAvatar) {
        return prev;
      }
      
      return {
        ...base,
        fullName: newFullName,
        avatar: newAvatar,
      };
    });

    const status = profile.status as string | undefined;
    const newStatus = (
      status === "draft" ||
      status === "pending" ||
      status === "verified" ||
      status === "rejected" ||
      status === "suspended"
    ) ? status : null;
    
    // Only update if status actually changed
    setEmployerStatus((prev) => {
      if (prev === newStatus) return prev;
      return newStatus as any;
    });
  }, [profile]);

  // Fetch membership and permissions (only once on mount)
  useEffect(() => {
    let mounted = true;
    const fetchMembership = async () => {
      try {
        const result = await getMyMembership();
        if (!mounted) return;
        if (result.success && result.data) {
          setIsOwner(result.data.isOwner || false);
          setPermissions(result.data.permissions || null);
          setUserRole(result.data.role || "");
        } else {
          setIsOwner(true);
          setPermissions(null);
        }
      } catch (error) {
        // If not a team member, user is owner by default
        if (mounted) {
          setIsOwner(true);
          setPermissions(null);
        }
      }
    };
    fetchMembership();
    return () => {
      mounted = false;
    };
  }, []);

  // Notification functions
  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await getNotifications(token, {
        page: 1,
        limit: 1,
        isRead: false,
      });
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = getToken();
      if (!token) return;
      const response = await getNotifications(token, {
        page: 1,
        limit: 20,
      });
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      await markNotificationAsRead(token, notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;
      await markAllNotificationsAsRead(token);
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: notif.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_APPLICATION":
        return <Users className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notificationDropdownOpen) {
      fetchNotifications();
    }
  }, [notificationDropdownOpen]);

  // Socket connection for real-time notifications
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Reuse existing socket if available
    if (socketRef.current?.connected) {
      return;
    }

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("notification", (notification: Notification) => {
      setUnreadCount((prev) => prev + 1);
      if (notificationDropdownOpen) {
        fetchNotifications();
      } else {
        setNotifications((prev) => [notification, ...prev]);
      }
    });

    socketRef.current = socket;

    return () => {
      // Only disconnect if component unmounts, not on every render
      if (socketRef.current === socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Remove notificationDropdownOpen from dependencies

  const can = useCallback((perm?: keyof TeamPermissions): boolean => {
    if (!perm) return true;
    if (isOwner) return true;
    if (!permissions) return true; // Default allow if no permissions loaded
    return permissions[perm] === true;
  }, [isOwner, permissions]);

  const allNavItems: NavItem[] = useMemo(() => [
    { key: "dashboard", label: "Bảng điều khiến", href: "/dashboard", icon: BarChart3 },
    {
      key: "jobs",
      label: "Quản lý bài đăng",
      href: "/jobs",
      icon: Briefcase,
      permission: "canCreateJobs",
    },
    {
      key: "applications",
      label: "Ứng viên đã ứng tuyển",
      href: "/applications",
      icon: FolderOpen,
      permission: "canViewApplications",
    },
    {
      key: "candidates",
      label: "Tìm kiếm ứng viên",
      href: "/candidates",
      icon: UserSearch,
      permission: "canSearchCandidates",
    },
    // {
    //   key: "analytics",
    //   label: "Thống kê",
    //   href: "/analytics",
    //   icon: FileText,
    //   permission: "canViewAnalytics",
    // },
    {
      key: "company",
      label: "Thông tin công ty",
      href: "/company",
      icon: Building2,
      permission: "canEditProfile",
    },
    {
      key: "team",
      label: "Quản lý team",
      href: "/team",
      icon: Users,
      permission: "canManageTeam",
      ownerOnly: false, // Team members can view team page but with limited access
    },
    {
      key: "settings",
      label: "Cài đặt",
      href: "/settings",
      icon: Settings,
    },
  ], []);

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (item.ownerOnly && !isOwner) return false;
      if (item.permission && !can(item.permission)) return false;
      return true;
    });
  }, [allNavItems, isOwner, can]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">InternBridge</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu open={notificationDropdownOpen} onOpenChange={setNotificationDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full hover:bg-slate-100"
                  onClick={() => {
                    if (!notificationDropdownOpen) {
                      fetchNotifications();
                    }
                  }}
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-[420px] max-h-[500px] p-0 rounded-xl border border-slate-200 bg-white shadow-xl z-100"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-base">Thông báo</h3>
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
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAllAsRead();
                          }}
                        >
                          Đánh dấu tất cả đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    {notifications.length > 0
                      ? `${notifications.length} thông báo gần nhất`
                      : "Chưa có thông báo"}
                  </p>
                </div>

                <ScrollArea className="h-[400px]">
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <Bell className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-600 text-center">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.isRead ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification._id);
                            }
                            if (notification.data?.jobId) {
                              router.push(`/jobs/${notification.data.jobId}/applications`);
                              setNotificationDropdownOpen(false);
                              return;
                            }
                            router.push("/notifications");
                            setNotificationDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                !notification.isRead
                                  ? "bg-primary/10 text-primary"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4
                                  className={`text-sm font-medium line-clamp-1 ${
                                    !notification.isRead ? "text-slate-900" : "text-slate-700"
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <Circle className="w-2 h-2 fill-primary text-primary shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(notification.createdAt)}
                                </div>
                                {notification.data?.jobId && (
                                  <div className="flex items-center gap-1 text-primary">
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Xem ứng viên</span>
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
                                className="shrink-0 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
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

                <div className="p-3 border-t border-slate-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      setNotificationDropdownOpen(false);
                      router.push("/notifications");
                    }}
                  >
                    Xem tất cả thông báo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex items-start min-h-[calc(100vh-64px)]">
        <aside className="w-72 bg-white shadow-sm sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto flex flex-col isolate">
          {/* User Profile Section */}
          <div className="p-4 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
                  <Avatar className="w-12 h-12">
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user.fullName} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-base">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{user?.fullName || "User"}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-slate-500 capitalize">
                        {userRole === "admin" 
                          ? "Quản trị viên" 
                          : userRole === "hr" 
                          ? "HR Manager" 
                          : userRole === "recruiter" 
                          ? "Tuyển dụng" 
                          : userRole === "interviewer"
                          ? "Phỏng vấn viên"
                          : "Employer"}
                      </p>
                      {isOwner && (
                        <Badge variant="outline" className="text-xs border-primary text-primary px-1.5 py-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="font-semibold">{user?.fullName || "User"}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.email || "No email"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {userRole === "admin" 
                        ? "Quản trị viên" 
                        : userRole === "hr" 
                        ? "HR Manager" 
                        : userRole === "recruiter" 
                        ? "Tuyển dụng" 
                        : userRole === "interviewer"
                        ? "Phỏng vấn viên"
                        : "Employer"}
                    </Badge>
                    {isOwner && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        <Shield className="w-3 h-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/company")}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Công ty của tôi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={async () => {
                    const token = getToken();
                    try {
                      if (token) await logoutEmployer(token);
                    } catch {}
                    clearUserData();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-4 border-b space-y-2">
            <div>
              <span className="text-sm text-slate-600">Trạng thái:</span>{" "}
              <Badge
                variant={employerStatus === "verified" ? "default" : "outline"}
                className={
                  employerStatus === "verified"
                    ? "bg-green-500 text-white"
                    : employerStatus === "pending"
                    ? "border-amber-500 text-amber-600"
                    : employerStatus === "rejected" || employerStatus === "suspended"
                    ? "border-red-500 text-red-600"
                    : "text-primary border-primary"
                }
              >
                {employerStatus === "verified"
                  ? "Đã xác thực"
                  : employerStatus === "pending"
                  ? "Chờ duyệt"
                  : employerStatus === "rejected"
                  ? "Bị từ chối"
                  : employerStatus === "suspended"
                  ? "Tạm khóa"
                  : "Chưa hoàn thiện"}
              </Badge>
            </div>
            {!isOwner && permissions && (
              <div className="text-xs text-slate-500">
                Quyền hạn: {userRole === "admin" ? "Quản trị viên" : userRole === "hr" ? "HR Manager" : userRole === "recruiter" ? "Tuyển dụng" : "Phỏng vấn viên"}
              </div>
            )}
          </div>

          <nav className="p-4 space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  className={`w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                  onClick={() => {
                    if (!isActive) {
                      router.push(item.href);
                    }
                  }}
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

        </aside>

        <main className="flex-1 p-6 min-h-[calc(100vh-64px)] bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

