"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CVPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.getUserProfile();
        setProfile(res?.data ?? null);
      } catch (e: any) {
        setError(e?.message || "Không thể tải hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentCVUrl =
    profile?.profile?.resume?.current?.url ||
    profile?.profile?.resume?.history?.[
      profile?.profile?.resume?.history?.length - 1
    ]?.url;
  const hasCV = Boolean(currentCVUrl);

  // Tạo URL để xem CV - Cloudinary không cần token
  const getCVUrl = (url: string) => {
    if (!url) return "";
    console.log("Original URL:", url);

    // Cloudinary URL không cần token, chỉ cần URL gốc
    return url;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">CV của tôi</h1>
      {loading && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Đang tải...
          </CardContent>
        </Card>
      )}
      {error && !loading && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}
      {!loading && !error && (
        <>
          {hasCV ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    CV hiện tại
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a
                        href={getCVUrl(currentCVUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở trong tab mới
                      </a>
                    </Button>
                    <Button
                      onClick={() => alert("TODO: Mở modal tải lên CV")}
                      variant="outline"
                      size="sm"
                    >
                      Tải lên CV mới
                    </Button>
                  </div>
                </div>

                {/* Hiển thị CV trực tiếp */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-b">
                    Xem trước CV
                  </div>
                  <div className="h-[800px] w-full relative">
                    {/* Thử Google Docs Viewer trước */}
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        getCVUrl(currentCVUrl)
                      )}&embedded=true`}
                      className="w-full h-full border-0"
                      title="CV Preview"
                      onLoad={() =>
                        console.log("Google Docs Viewer loaded successfully")
                      }
                      onError={(e) => {
                        console.error("Google Docs Viewer error:", e);
                        console.log("Trying direct PDF display");
                        // Fallback: Thử hiển thị PDF trực tiếp
                        const fallbackIframe = document.createElement("iframe");
                        fallbackIframe.src = getCVUrl(currentCVUrl);
                        fallbackIframe.className = "w-full h-full border-0";
                        fallbackIframe.title = "CV Preview Fallback";
                        document
                          .querySelector(".h-\\[800px\\]")
                          ?.appendChild(fallbackIframe);
                      }}
                    />
                  </div>
                </div>

                {/* Debug info */}
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium mb-2">Debug Info:</div>
                  <div>URL gốc: {currentCVUrl}</div>
                  <div>URL sử dụng: {getCVUrl(currentCVUrl)}</div>
                  <div>
                    Token có tồn tại:{" "}
                    {localStorage.getItem("token") ||
                    sessionStorage.getItem("token")
                      ? "Có"
                      : "Không"}
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(getCVUrl(currentCVUrl), "_blank")
                      }
                    >
                      Thử mở trực tiếp
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <a
                    href={currentCVUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline break-all"
                  >
                    {currentCVUrl}
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="text-sm text-muted-foreground">
                  Bạn chưa có CV
                </div>
                <Button onClick={() => alert("TODO: Mở modal tải lên CV")}>
                  Tải lên CV
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
