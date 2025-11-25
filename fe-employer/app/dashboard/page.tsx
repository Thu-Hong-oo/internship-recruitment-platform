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
                Tài khoản xác thực:
              </span>
              <Badge
                variant={user?.isEmailVerified ? "default" : "outline"}
                className={
                  user?.isEmailVerified
                    ? "bg-green-500 text-white"
                    : "text-primary border-primary"
                }
              >
                {user?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
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
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Verification Progress */}
            <VerificationProgress />

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Chào mừng trở lại!
                      </h3>
                      <p className="text-sm text-gray-600">
                        {user?.fullName || "Employer"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tin đã đăng</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ứng viên</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Cần tìm kiếm ứng viên?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/jobs/create-job")}
                    >
                      Đăng bài tuyển dụng ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
