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
} from "lucide-react";
import { getUserData, getToken, clearUserData } from "@/lib/userStorage";
import { useEffect, useState } from "react";
import { logoutEmployer } from "@/lib/api";

const HIDE_ON_PREFIXES = ["/login", "/register", "/auth/"];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUserData());
  }, []);

  if (HIDE_ON_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p))) {
    return null;
  }

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
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-primary"
            onClick={() => router.push("/jobs")}
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
        </div>
      </div>
    </header>
  );
}
