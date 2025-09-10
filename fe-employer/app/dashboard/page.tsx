"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function DashboardPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 11,
    minutes: 1,
  });

  useEffect(() => {
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
    { id: 1, text: "Xác thực số điện thoại", completed: false },
    { id: 2, text: "Cập nhật thông tin công ty", completed: false },
    { id: 3, text: "Cập nhật Giấy đăng ký doanh nghiệp", completed: false },
    {
      id: 4,
      text: "Đăng tin tuyển dụng đầu tiên",
      completed: false,
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Đăng tin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Tìm CV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Connect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary"
            >
              Insights
            </Button>
            <div className="relative">
              <Bell className="w-5 h-5 text-white" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                0
              </Badge>
            </div>
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                0
              </Badge>
            </div>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-white text-slate-800 text-sm">
                NM
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  NM
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-800">Nướng Mực</h3>
                <p className="text-sm text-slate-500">Employer</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Tài khoản xác thực:
              </span>
              <Badge variant="outline" className="text-primary border-primary">
                Cấp 1/3
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
                >
                  <Search className="w-4 h-4 mr-3" />
                  Tin tuyển dụng
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
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Main Job Posting Card */}
            <Card className="bg-gradient-to-r from-primary to-primary text-white mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">
                      Bạn đang tuyển dụng vị trí:
                    </h2>
                    <h3 className="text-2xl font-bold mb-4">
                      Nhân viên Marketing
                    </h3>
                    <div className="space-y-2">
                      <p className="text-white/80">
                        Đăng tin trên InternBridge ngay
                      </p>
                      <p className="text-white/80">
                        Hiệu quả vượt trội - Đáp ứng nhanh chóng
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">
                        <span className="text-primary">90.000+</span> lượt ứng
                        tuyển vị trí{" "}
                        <span className="text-primary">
                          Nhân viên marketing
                        </span>{" "}
                        mỗi tháng
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">
                        Tiếp cận ứng viên tiềm năng trong{" "}
                        <span className="text-primary">130.000+</span> hồ sơ
                        ngành{" "}
                        <span className="text-primary">
                          Marketing/Truyền thông/Quảng cáo
                        </span>
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Employers */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      Các nhà tuyển dụng tiêu biểu lựa chọn đăng tin cho vị trí{" "}
                      <span className="text-primary">Nhân viên marketing</span>{" "}
                      trên InternBridge:
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Techcombank, Panasonic Việt Nam, Yamaha Motor Việt Nam,...
                    </p>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white font-bold">
                        T
                      </div>
                      <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                        P
                      </div>
                      <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center text-white font-bold">
                        Y
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-white shadow-sm min-h-screen p-6">
          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Xin chào, <span className="text-primary">Nướng Mực</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Hãy thực hiện các bước sau để gia tăng tính bảo mật cho tài khoản
              của bạn và nhận ngay{" "}
              <span className="text-primary font-semibold">+8 Top Point</span>{" "}
              để đổi quà khủng tin tuyển dụng đầu tiên trong:
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-primary text-white px-4 py-2 rounded-lg text-center">
                <div className="text-2xl font-bold">{timeLeft.days}</div>
                <div className="text-xs">Ngày</div>
              </div>
              <div className="text-2xl font-bold text-slate-400">:</div>
              <div className="bg-primary text-white px-4 py-2 rounded-lg text-center">
                <div className="text-2xl font-bold">{timeLeft.hours}</div>
                <div className="text-xs">Giờ</div>
              </div>
              <div className="text-2xl font-bold text-slate-400">:</div>
              <div className="bg-primary text-white px-4 py-2 rounded-lg text-center">
                <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                <div className="text-xs">Phút</div>
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">
                Xác thực thông tin
              </h3>
              <span className="text-sm text-slate-500">Hoàn thành 0%</span>
            </div>
            <Progress value={0} className="mb-4" />

            {/* Verification Tasks */}
            <div className="space-y-3">
              {verificationTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed
                        ? "text-slate-500 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {task.text}
                  </span>
                  {task.highlight && (
                    <Badge className="bg-primary text-white text-xs ml-auto">
                      +8 Top Point
                    </Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-primary ml-auto" />
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-4">Tôi sẽ xác thực sau</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
