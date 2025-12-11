"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Briefcase, FileText, FolderOpen } from "lucide-react";
import { useEmployerProfile } from "@/contexts/EmployerProfileContext";
import { User, getUserData } from "@/lib/userStorage";

type NavKey = "dashboard" | "jobs" | "applications" | "analytics";

interface Props {
  active?: NavKey;
  children: ReactNode;
}

export default function EmployerShell({ active = "dashboard", children }: Props) {
  const router = useRouter();
  const { profile } = useEmployerProfile();
  const [user, setUser] = useState<User | null>(null);
  const [employerStatus, setEmployerStatus] = useState<
    "draft" | "pending" | "verified" | "rejected" | "suspended" | null
  >(null);

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
      return {
        ...base,
        fullName: profileUser.fullName || base.fullName || "User",
        avatar: profileUser.avatar || base.avatar,
      };
    });

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
  }, [profile]);

  const navItems: Array<{ key: NavKey; label: string; href: string; icon: any }> = [
    { key: "dashboard", label: "Bảng tin", href: "/dashboard", icon: BarChart3 },
    { key: "jobs", label: "Quản lý bài đăng", href: "/jobs", icon: Briefcase },
    { key: "applications", label: "Ứng viên đã ứng tuyển", href: "/applications", icon: FolderOpen },
    { key: "analytics", label: "Thống kê", href: "/analytics", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-start min-h-screen">
        <aside className="w-72 bg-white shadow-sm sticky top-0 h-screen overflow-y-auto">
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user.fullName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-800">{user?.fullName || "User"}</h3>
              <p className="text-sm text-slate-500 capitalize">{user?.role || "Employer"}</p>
            </div>
          </div>

          <div className="p-4 border-b">
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

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  className={`w-full justify-start text-slate-700 hover:bg-primary/10 hover:text-primary ${
                    isActive ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 min-h-screen bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

