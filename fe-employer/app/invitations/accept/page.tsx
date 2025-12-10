"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  verifyInvitationToken,
  acceptInvitation,
  rejectInvitation,
  VerifyInvitationTokenResponse,
} from "@/lib/teamAPI";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  hr: "HR Manager",
  recruiter: "Recruiter",
  interviewer: "Interviewer",
};

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationData, setInvitationData] =
    useState<VerifyInvitationTokenResponse["data"] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Thiếu token invitation",
        variant: "destructive",
      });
      router.push("/");
      return;
    }

    loadInvitationData();
  }, [token]);

  const loadInvitationData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await verifyInvitationToken(token);
      if (response.success && response.data) {
        setInvitationData(response.data);
      } else {
        throw new Error(response.error || "Không thể tải thông tin invitation");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Invitation không hợp lệ hoặc đã hết hạn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !invitationData) return;

    setProcessing(true);
    try {
      // Get invitationId from token (we need to find it)
      // For now, we'll use a workaround - accept endpoint should handle token lookup
      const response = await acceptInvitation("", { token });
      
      if (response.success && response.data) {
        const { email, needsLogin, needsRegister } = response.data;
        
        toast({
          title: "Thành công",
          description: "Bạn đã chấp nhận lời mời thành công!",
        });
        
        // Check if user needs to login or register
        const token = localStorage.getItem("token");
        
        if (token) {
          // User is already logged in, redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else if (needsLogin) {
          // User has account but not logged in, redirect to login with email
          setTimeout(() => {
            router.push(`/?email=${encodeURIComponent(email)}&fromInvitation=true`);
          }, 1500);
        } else if (needsRegister) {
          // User doesn't have account, redirect to register with email
          setTimeout(() => {
            router.push(`/register?email=${encodeURIComponent(email)}&fromInvitation=true`);
          }, 1500);
        } else {
          // Fallback: redirect to login
          setTimeout(() => {
            router.push(`/?email=${encodeURIComponent(email)}&fromInvitation=true`);
          }, 1500);
        }
      } else {
        throw new Error(response.error || "Không thể chấp nhận lời mời");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể chấp nhận lời mời",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token || !invitationData) return;

    setProcessing(true);
    try {
      const response = await rejectInvitation("", token);
      
      if (response.success) {
        toast({
          title: "Đã từ chối",
          description: "Bạn đã từ chối lời mời",
        });
        router.push("/");
      } else {
        throw new Error("Không thể từ chối lời mời");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể từ chối lời mời",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation không hợp lệ</CardTitle>
            <CardDescription>
              Invitation này không tồn tại hoặc đã hết hạn.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { valid, expired, accepted, email, role, companyName, expiresAt } =
    invitationData;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lời mời tham gia team</CardTitle>
          <CardDescription>
            Bạn đã được mời tham gia team của công ty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {expired && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>Lời mời này đã hết hạn</span>
            </div>
          )}

          {accepted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Bạn đã chấp nhận lời mời này rồi</span>
            </div>
          )}

          {valid && !expired && !accepted && (
            <>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Công ty:</span>
                  <p className="font-medium">{companyName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Vai trò:</span>
                  <div className="mt-1">
                    <Badge variant="outline">{ROLE_LABELS[role] || role}</Badge>
                  </div>
                </div>
                {expiresAt && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Hết hạn:
                    </span>
                    <p className="text-sm">
                      {new Date(expiresAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1"
                >
                  Từ chối
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Chấp nhận"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

