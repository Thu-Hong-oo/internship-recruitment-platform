"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ShoppingCart,
  BarChart3,
  FileText,
  Users,
  Star,
  Gift,
  Bot,
  Briefcase,
  Search,
  FolderOpen,
  TrendingUp,
  Menu,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { getUserData, getToken, clearUserData } from "@/lib/userStorage";
import { useEffect, useState, useRef } from "react";
import { logoutEmployer, getEmployerProfile } from "@/lib/api";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notificationAPI";
import { io, Socket } from "socket.io-client";
import { getMyMembership } from "@/lib/teamAPI";

const HIDE_ON_PREFIXES = ["/register", "/auth/", "/email-verification"];
const HIDE_ON_EXACT = ["/"]; // Exact match only for root (login page)

// Get socket URL (remove /api from API_BASE_URL)
const getSocketUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, "");
};

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [teamPermissions, setTeamPermissions] = useState<any>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

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
        limit: 5,
      });

      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socketUrl = getSocketUrl();

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Initialize socket connection
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Handle connection events
    socket.on("connect", () => {
      console.log("✅ Socket connected");
      setSocketConnected(true);
      // Fetch unread count when connected
      fetchUnreadCount();
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    // Listen for new notifications
    socket.on("new-notification", (notification: Notification) => {
      console.log("🔔 New notification received:", notification);

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // If notification dropdown is open, refresh the list
      if (notificationDropdownOpen) {
        fetchNotifications();
      } else {
        // Add new notification to the top of the list
        setNotifications((prev) => [notification, ...prev]);
      }
    });

    // Listen for unread count updates
    socket.on("notification_unread_count", (data: { count: number }) => {
      console.log("📊 Unread count updated:", data.count);
      setUnreadCount(data.count);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update socket listeners when notificationDropdownOpen changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Re-register new-notification handler to capture current state
    socket.off("new-notification");
    socket.on("new-notification", (notification: Notification) => {
      console.log("🔔 New notification received:", notification);

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // If notification dropdown is open, refresh the list
      if (notificationDropdownOpen) {
        fetchNotifications();
      } else {
        // Add new notification to the top of the list
        setNotifications((prev) => [notification, ...prev]);
      }
    });
  }, [notificationDropdownOpen]);

  // Function to load user data
  const loadUserData = () => {
    const userData = getUserData();
    setUser(userData);
  };

  useEffect(() => {
    // Load user data from localStorage first (for immediate display)
    loadUserData();

    // Fetch profile data from API to get latest avatar and name
    const fetchProfile = async () => {
      try {
        const token = getToken();
        if (!token) {
          setUser(null);
          return;
        }

        const json = await getEmployerProfile(token);
        const profile = json?.data || json?.profile || null;

        if (profile) {
          setProfileData(profile);
          // Update user data with profile info from API response
          // API returns user.fullName and user.avatar in data.user
          if (profile.user) {
            setUser((prev: any) => {
              const updatedUser = {
                ...prev,
                fullName: profile.user.fullName || prev?.fullName,
                avatar: profile.user.avatar || prev?.avatar,
              };
              // Also update localStorage to keep it in sync
              if (updatedUser) {
                const storage = localStorage;
                try {
                  storage.setItem("user", JSON.stringify(updatedUser));
                } catch (err) {
                  console.error("Failed to update user in localStorage:", err);
                }
              }
              return updatedUser;
            });
          }
        }
      } catch (err) {
        // Silent fail - fallback to localStorage data
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
    fetchUnreadCount();
  }, [pathname]); // Reload when pathname changes (e.g., after login redirect)

  // Listen for storage changes (when user logs in from another tab/window or same tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        loadUserData();
        // Refetch profile if token exists
        const token = getToken();
        if (token) {
          getEmployerProfile(token)
            .then((json) => {
              const profile = json?.data || json?.profile || null;
              if (profile?.user) {
                setUser((prev: any) => ({
                  ...prev,
                  fullName: profile.user.fullName || prev?.fullName,
                  avatar: profile.user.avatar || prev?.avatar,
                }));
              }
            })
            .catch(() => {});
        } else {
          setUser(null);
        }
      }
    };

    // Also listen for custom event when login happens in same tab
    const handleLogin = () => {
      loadUserData();
      const token = getToken();
      if (token) {
        getEmployerProfile(token)
          .then((json) => {
            const profile = json?.data || json?.profile || null;
            if (profile?.user) {
              setUser((prev: any) => ({
                ...prev,
                fullName: profile.user.fullName || prev?.fullName,
                avatar: profile.user.avatar || prev?.avatar,
              }));
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-login', handleLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-login', handleLogin);
    };
  }, []);

  // Fetch membership/permissions
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await getMyMembership();
        if (res.success && res.data) {
          setTeamPermissions(res.data.permissions);
          setIsOwner(!!res.data.isOwner);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchMembership();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      await markNotificationAsRead(token, notificationId);
      // Update local state
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
        return <Users className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (notificationDropdownOpen) {
      fetchNotifications();
    }
  }, [notificationDropdownOpen]);

  // Hide on exact matches or prefix matches
  const shouldHide = 
    HIDE_ON_EXACT.includes(pathname || "") ||
    HIDE_ON_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p));
  
  if (shouldHide) {
    return null;
  }

  const can = (perm: keyof typeof teamPermissions) =>
    isOwner || (teamPermissions && teamPermissions[perm]);

  return (
    <header className="bg-slate-800 text-white px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="w-4 h-4" />
          </Button>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <span className="text-xl font-bold text-primary">InternBridge</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-primary"
          >
            HR Insider
          </Button>
          {can("canCreateJobs") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
              onClick={() => router.push("/jobs")}
            >
              Đăng tin
            </Button>
          )}
          {can("canSearchCandidates") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Tìm CV
            </Button>
          )}
          {can("canManageTeam") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
              onClick={() => router.push("/team")}
            >
              Team
            </Button>
          )}
          {can("canContactCandidates") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Connect
            </Button>
          )}
          {can("canViewAnalytics") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Insights
            </Button>
          )}
          <DropdownMenu
            open={notificationDropdownOpen}
            onOpenChange={setNotificationDropdownOpen}
          >
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <Badge className="absolute top-0 right-0 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-bold animate-pulse transform translate-x-1/2 -translate-y-1/2">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
                {/* Socket connection indicator
                {socketConnected && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800 transform translate-x-1/2 translate-y-1/2"></div>
                )} */}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[420px] p-0 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,45,95,0.25)]"
            >
              <div className="p-4 border-b border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">
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
                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                    <p className="text-sm text-slate-600 text-center">
                      Chưa có thông báo nào
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/60">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          !notification.isRead ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            handleMarkAsRead(notification._id);
                          }
                          if (notification.data?.jobId) {
                            router.push("/jobs");
                            setNotificationDropdownOpen(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                              !notification.isRead
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4
                                className={`text-sm font-semibold line-clamp-1 ${
                                  !notification.isRead
                                    ? "text-slate-900"
                                    : "text-slate-700"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <Circle className="w-2 h-2 fill-blue-600 text-blue-600 flex-shrink-0 mt-1.5" />
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
                                <div className="flex items-center gap-1 text-blue-600">
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
                              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t border-slate-200/60">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
          {user && getToken() ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center focus:outline-none">
                <Avatar className="w-8 h-8 cursor-pointer">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-white text-slate-800 text-sm">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-white ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user?.fullName || "Tài khoản"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/company")}>
                  Công ty của tôi
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700"
                  onClick={async () => {
                    const token = getToken();
                    try {
                      if (token) await logoutEmployer(token);
                    } catch {}
                    clearUserData();
                    window.location.href = "/";
                  }}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
              onClick={() => router.push("/")}
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
