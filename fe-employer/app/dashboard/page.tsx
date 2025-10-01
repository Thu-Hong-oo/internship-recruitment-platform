"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { logoutEmployer } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 11,
    minutes: 1,
  });

  useEffect(() => {
    // Load user data from localStorage
    const loadUserData = () => {
      const userData = getUserData();
      if (userData) {
        setUser(userData);
      }
    };

    loadUserData();

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
        <aside className="w-64 bg-white shadow-sm min-h-screen">
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
                  <TrendingUp className="w-4 h-4 mr-3" />
                  InternBridge Insights
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <Star className="w-4 h-4 mr-3" />
                  InternBridge Rewards
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <Gift className="w-4 h-4 mr-3" />
                  Đối qua
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <Bot className="w-4 h-4 mr-3" />
                  Toppy AI - Đề xuất
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  CV đề xuất
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary"
                >
                  <Briefcase className="w-4 h-4 mr-3" />
                  Chiến dịch tuyển dụng
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
                    Quản lý CV
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                  <div className="ml-6 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      Quản lý nhân CV
                      <Badge className="ml-auto bg-blue-500 text-white text-xs">
                        Beta
                      </Badge>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      Quản lý yêu cầu kết nối CV
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
                  Báo cáo tuyển dụng
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
        <main className="flex-1 p-6"></main>
      </div>
    </div>
  );
}
