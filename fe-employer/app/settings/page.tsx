"use client";

import { useEffect, useState } from "react";
import EmployerShell from "@/components/layout/EmployerShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Lock, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMyMembership } from "@/lib/teamAPI";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newApplicationAlert, setNewApplicationAlert] = useState(true);
  const [interviewReminder, setInterviewReminder] = useState(true);
  const [jobExpiryAlert, setJobExpiryAlert] = useState(true);

  // Profile settings
  const [profileVisibility, setProfileVisibility] = useState("public");

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const result = await getMyMembership();
        if (result.success && result.data) {
          setIsOwner(result.data.isOwner || false);
        } else {
          setIsOwner(true); // Default to owner if no membership
        }
      } catch (error) {
        setIsOwner(true); // Default to owner
      } finally {
        setLoading(false);
      }
    };
    fetchMembership();
  }, []);

  const handleSaveNotifications = () => {
    // TODO: Implement save notification preferences
    toast({
      title: "Đã lưu",
      description: "Cài đặt thông báo đã được cập nhật.",
    });
  };

  const handleSaveProfile = () => {
    // TODO: Implement save profile settings
    toast({
      title: "Đã lưu",
      description: "Cài đặt hồ sơ đã được cập nhật.",
    });
  };

  if (loading) {
    return (
      <EmployerShell active="settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </EmployerShell>
    );
  }

  return (
    <EmployerShell active="settings">
      <div className="space-y-6">
        

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Thông báo</CardTitle>
            </div>
            <CardDescription>
              Quản lý cách bạn nhận thông báo về các hoạt động tuyển dụng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Thông báo qua email</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo qua email về các sự kiện quan trọng
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-application">Thông báo ứng viên mới</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo khi có ứng viên mới ứng tuyển
                </p>
              </div>
              <Switch
                id="new-application"
                checked={newApplicationAlert}
                onCheckedChange={setNewApplicationAlert}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interview-reminder">Nhắc nhở phỏng vấn</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo nhắc nhở trước khi phỏng vấn
                </p>
              </div>
              <Switch
                id="interview-reminder"
                checked={interviewReminder}
                onCheckedChange={setInterviewReminder}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="job-expiry">Cảnh báo tin hết hạn</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo khi tin tuyển dụng sắp hết hạn
                </p>
              </div>
              <Switch
                id="job-expiry"
                checked={jobExpiryAlert}
                onCheckedChange={setJobExpiryAlert}
                disabled={!emailNotifications}
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveNotifications}>Lưu cài đặt thông báo</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Hồ sơ</CardTitle>
            </div>
            <CardDescription>
              Quản lý thông tin hiển thị công khai của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Hiển thị hồ sơ</Label>
              <select
                id="profile-visibility"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
              >
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
                <option value="limited">Giới hạn</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Quyết định ai có thể xem thông tin hồ sơ của bạn
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveProfile}>Lưu cài đặt hồ sơ</Button>
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <CardTitle>Bảo mật</CardTitle>
              </div>
              <CardDescription>
                Quản lý bảo mật tài khoản và quyền truy cập
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Đổi mật khẩu</Label>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Tính năng đang phát triển",
                    description: "Chức năng đổi mật khẩu sẽ sớm được cập nhật.",
                  });
                }}>
                  Đổi mật khẩu
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Phiên đăng nhập</Label>
                <p className="text-sm text-muted-foreground">
                  Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
                </p>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Tính năng đang phát triển",
                    description: "Chức năng quản lý phiên đăng nhập sẽ sớm được cập nhật.",
                  });
                }}>
                  Xem phiên đăng nhập
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployerShell>
  );
}

