"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ArrowRight,
  CheckCircle,
  Circle,
} from "lucide-react";
import { User, getUserData, getToken, clearUserData } from "@/lib/userStorage";
import { logoutEmployer, getEmployerProfile } from "@/lib/api";
import { useRouter } from "next/navigation";
import VerificationProgress from "@/components/VerificationProgress";
import { useVerificationContext } from "@/contexts/VerificationContext";

export default function DashboardPage() {
  const router = useRouter();
  const { refreshVerification } = useVerificationContext();
  const [user, setUser] = useState<User | null>(null);
  const [employerStatus, setEmployerStatus] = useState<
    "draft" | "pending" | "verified" | "rejected" | "suspended" | null
  >(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 11,
    minutes: 1,
  });

  useEffect(() => {
    // Load user data from localStorage first (for immediate display)
    const loadUserData = () => {
      const userData = getUserData();
      if (userData) {
        setUser(userData);
      }
    };

    loadUserData();

    // Fetch profile data from API to get latest avatar and name
    const fetchProfile = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const json = await getEmployerProfile(token);
        const profile = json?.data || json?.profile || null;

        if (profile && profile.user) {
          // Update user state with latest avatar from API
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              fullName: profile.user.fullName || prev.fullName,
              avatar: profile.user.avatar || prev.avatar,
            };
          });

          // Map backend employer status (data.status) to local status state
          const status = profile.status as string | undefined;
          if (
            status === "draft" ||
            status === "pending" ||
            status === "verified" ||
            status === "rejected" ||
            status === "suspended"
          ) {
            setEmployerStatus(status);
          } else {
            setEmployerStatus(null);
          }
        }
      } catch (err) {
        // Silent fail - fallback to localStorage data
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const verificationTasks = [
    { id: 0, text: "Cập nhật thông tin cá nhân", completed: false },
    { id: 1, text: "Cập nhật thông tin công ty", completed: false },
    { id: 2, text: "Cập nhật Giấy đăng ký doanh nghiệp", completed: false },
    {
      id: 3,
      text: "Đăng tin tuyển dụng đầu tiên",
      completed: false,
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-74 bg-white shadow-sm min-h-screen">
          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-800">
                  {user?.fullName || "User"}
                </h3>
                <p className="text-sm text-slate-500 capitalize">
                  {user?.role || "Employer"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Trạng thái tài khoản:
              </span>
              <Badge
                variant={employerStatus === "verified" ? "default" : "outline"}
                className={
                  employerStatus === "verified"
                    ? "bg-green-500 text-white"
                    : employerStatus === "pending"
                    ? "border-amber-500 text-amber-600"
                    : employerStatus === "rejected" ||
                      employerStatus === "suspended"
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
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                  onClick={() => router.push("/dashboard")}
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Bảng tin
                </Button>
              </li>

              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  Đề xuất CV
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                  onClick={() => router.push("/jobs")}
                >
                  <Briefcase className="w-4 h-4 mr-3" />
                  Quản lý bài đăng
                </Button>
              </li>
              <li>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                  >
                    <FolderOpen className="w-4 h-4 mr-3" />
                    Quản lý ứng viên
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                  <div className="ml-6 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-slate-600 hover:bg-primary/10 hover:text-primary"
                      onClick={() => router.push("/applications")}
                    >
                      Quản lý ứng viên đã ứng tuyển
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      Khám phá ứng viên tiềm năng
                    </Button>
                  </div>
                </div>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Thống kê
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-3" />
                  Mua dịch vụ
                </Button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 min-h-screen bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Verification Progress */}
            <VerificationProgress />

            {/* Main content grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <Card className="md:col-span-2 lg:col-span-2 !shadow-md h-full flex flex-col justify-center">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-blue-100 rounded-full">
                    <BarChart3 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-1">
                      Chào mừng trở lại!
                    </h3>
                    <p className="text-base text-gray-500">
                      {user?.fullName || "Employer"}
                    </p>
                    <div className="mt-2 text-xs text-slate-400">
                      Chúc bạn một ngày làm việc hiệu quả và thành công trong
                      tuyển dụng!
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="h-full flex flex-col justify-center !shadow-md">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base text-slate-700 font-medium">
                    Tác vụ nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-2 w-full font-medium"
                    onClick={() => router.push("/jobs/create-job")}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    Đăng tin tuyển dụng
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-2 w-full font-medium"
                    onClick={() => router.push("/applications")}
                  >
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Ứng viên đã ứng tuyển
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-2 w-full font-medium"
                  >
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Xem Thống kê
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bottom grid row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Promote action */}
              <Card className="h-full !shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Đăng thêm tin tuyển dụng?
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    Vị trí mới sẽ giúp bạn tiếp cận nhiều ứng viên hơn.
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6">
                    <FileText className="w-12 h-12 mb-4 text-primary/40" />
                    <Button
                      className="mt-2 px-6"
                      onClick={() => router.push("/jobs/create-job")}
                    >
                      Đăng bài tuyển dụng ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tips/info card */}
              <Card className="h-full !shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Mẹo giúp tuyển dụng hiệu quả hơn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                    <li>
                      Cập nhật thường xuyên mô tả công việc và yêu cầu vị trí.
                    </li>
                    <li>Phản hồi ứng viên nhanh chóng để tạo ấn tượng tốt.</li>
                    <li>Sử dụng bộ lọc để tìm kiếm ứng viên phù hợp.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
