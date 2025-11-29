"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Circle,
  Filter,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCheck,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notificationAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filter, priorityFilter]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filter === "unread") {
        params.isRead = false;
      } else if (filter === "read") {
        params.isRead = true;
      }

      if (priorityFilter !== "all") {
        params.priority = priorityFilter;
      }

      const response = await getNotifications(token, params);

      if (response.success) {
        setNotifications(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
        setTotalNotifications(response.pagination?.total || 0);
        setUnreadCount(response.unreadCount || 0);
      } else {
        setError(response.error || "Không thể tải thông báo");
      }
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const token = getToken();
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
        if (selectedNotification?._id === notificationId) {
          setSelectedNotification({
            ...selectedNotification,
            isRead: true,
            readAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await markAllNotificationsAsRead(token);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleViewDetail = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetail(true);

    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
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
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_APPLICATION":
        return <Users className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_210)_0%,white_30%)] pb-20">
      <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.70_0.12_195/.12),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-80 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.08_210/.1),transparent_75%)] blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_25px_60px_rgba(15,45,95,0.15)] backdrop-blur-xl p-8 mb-6">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.08)_0%,oklch(0.84_0.05_205/.04)_100%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[oklch(0.60_0.12_195/.2)] to-[oklch(0.72_0.08_210/.2)] flex items-center justify-center border border-[oklch(0.60_0.12_195/.3)] shadow-lg">
                    <Bell className="w-6 h-6 text-[oklch(0.60_0.12_195)]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">
                      Thông báo
                    </h1>
                    <p className="text-slate-600">
                      Quản lý và theo dõi tất cả thông báo của bạn
                    </p>
                  </div>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.60_0.12_195)] via-[oklch(0.72_0.08_210)] to-[oklch(0.88_0.03_195)] text-white hover:brightness-110 shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.05)_0%,transparent_70%)]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">
                    Tổng số
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {totalNotifications}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[oklch(0.60_0.12_195/.15)] to-[oklch(0.72_0.08_210/.15)] flex items-center justify-center border border-[oklch(0.60_0.12_195/.2)]">
                  <Bell className="w-6 h-6 text-[oklch(0.60_0.12_195)]" />
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.05)_0%,transparent_70%)]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">
                    Chưa đọc
                  </p>
                  <p className="text-3xl font-bold text-amber-600">
                    {unreadCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200">
                  <BellRing className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.05)_0%,transparent_70%)]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">
                    Đã đọc
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {totalNotifications - unreadCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative overflow-hidden rounded-xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-sm">
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[180px] border-0 bg-transparent">
                  <Filter className="w-4 h-4 mr-2 text-[oklch(0.60_0.12_195)]" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unread">Chưa đọc</SelectItem>
                  <SelectItem value="read">Đã đọc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-sm">
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger className="w-[180px] border-0 bg-transparent">
                  <SelectValue placeholder="Lọc theo mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_25px_60px_rgba(15,45,95,0.15)] backdrop-blur-xl p-12 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.05)_0%,transparent_70%)]" />
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[oklch(0.60_0.12_195/.3)] border-t-[oklch(0.60_0.12_195)] mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                Đang tải thông báo...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="relative overflow-hidden rounded-3xl border border-red-200/60 bg-red-50/70 shadow-[0_25px_60px_rgba(220,38,38,0.15)] backdrop-blur-xl">
            <div className="relative p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_25px_60px_rgba(15,45,95,0.15)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.05)_0%,transparent_70%)]" />
            <div className="relative p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[oklch(0.60_0.12_195/.1)] to-[oklch(0.72_0.08_210/.1)] flex items-center justify-center mx-auto mb-6 border border-[oklch(0.60_0.12_195/.2)]">
                <Bell className="w-10 h-10 text-[oklch(0.60_0.12_195)]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Chưa có thông báo
              </h3>
              <p className="text-slate-600">
                Bạn sẽ nhận được thông báo khi có cập nhật mới
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(15,45,95,0.08)] backdrop-blur-xl cursor-pointer transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(15,45,95,0.12)] ${
                  !notification.isRead
                    ? "border-l-4 border-l-[oklch(0.60_0.12_195)] bg-[oklch(0.60_0.12_195/.03)]"
                    : ""
                }`}
                onClick={() => handleViewDetail(notification)}
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.60_0.12_195/.04)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 group-hover:scale-110 ${
                        !notification.isRead
                          ? "bg-gradient-to-br from-[oklch(0.60_0.12_195/.15)] to-[oklch(0.72_0.08_210/.15)] text-[oklch(0.60_0.12_195)] border-[oklch(0.60_0.12_195/.3)]"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3
                              className={`font-bold text-base ${
                                !notification.isRead
                                  ? "text-slate-900"
                                  : "text-slate-700"
                              } group-hover:text-[oklch(0.60_0.12_195)] transition-colors duration-300`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.60_0.12_195)] shadow-lg animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 flex-shrink-0">
                          <Badge
                            className={`text-xs font-semibold border ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {getPriorityLabel(notification.priority)}
                          </Badge>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              disabled={markingAsRead === notification._id}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-[oklch(0.60_0.12_195/.1)] hover:text-[oklch(0.60_0.12_195)] transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(notification.createdAt)}
                        </div>
                        {notification.data?.jobId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs font-medium text-[oklch(0.60_0.12_195)] hover:text-[oklch(0.55_0.12_195)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/jobs/${notification.data?.jobId}`);
                            }}
                          >
                            Xem công việc
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-[oklch(0.60_0.12_195/.3)] hover:shadow-md disabled:opacity-40 transition-all duration-300 hover:scale-105"
                >
                  Trước
                </Button>
                <div className="px-6 py-2 rounded-xl bg-white/80 border border-slate-200/60 backdrop-blur-sm shadow-sm">
                  <span className="text-sm font-semibold text-slate-700">
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-[oklch(0.60_0.12_195/.3)] hover:shadow-md disabled:opacity-40 transition-all duration-300 hover:scale-105"
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl rounded-3xl border border-white/50 bg-white/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,45,95,0.25)]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-slate-900 mb-3">
                  {selectedNotification?.title}
                </DialogTitle>
                <DialogDescription className="text-base text-slate-700 leading-relaxed">
                  {selectedNotification?.message}
                </DialogDescription>
              </div>
              {selectedNotification && (
                <Badge
                  className={`ml-4 flex-shrink-0 ${getPriorityColor(
                    selectedNotification.priority
                  )}`}
                >
                  {getPriorityLabel(selectedNotification.priority)}
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Loại thông báo</p>
                  <p className="font-medium">{selectedNotification.type}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Trạng thái</p>
                  <p className="font-medium">
                    {selectedNotification.isRead ? "Đã đọc" : "Chưa đọc"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Thời gian tạo</p>
                  <p className="font-medium">
                    {new Date(selectedNotification.createdAt).toLocaleString(
                      "vi-VN"
                    )}
                  </p>
                </div>
                {selectedNotification.readAt && (
                  <div>
                    <p className="text-slate-500 mb-1">Thời gian đọc</p>
                    <p className="font-medium">
                      {new Date(selectedNotification.readAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                )}
              </div>
              {selectedNotification.data?.jobId && (
                <div className="pt-4 border-t border-slate-200/60">
                  <Button
                    onClick={() => {
                      setShowDetail(false);
                      router.push(`/jobs/${selectedNotification.data?.jobId}`);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-[oklch(0.60_0.12_195)] via-[oklch(0.72_0.08_210)] to-[oklch(0.88_0.03_195)] text-white hover:brightness-110 shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    Xem công việc liên quan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


