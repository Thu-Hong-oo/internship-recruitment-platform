"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnalytics, type AnalyticsResponse } from "@/lib/jobAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import EmployerShell from "@/components/layout/EmployerShell";

type PeriodOption = {
  value: string;
  label: string;
};

const periodOptions: PeriodOption[] = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "90 ngày qua" },
  { value: "1y", label: "1 năm qua" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(
    null
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchAnalytics();
  }, [router, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const result = await getAnalytics(token, selectedPeriod);

      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || "Không thể tải dữ liệu thống kê");
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const jobs = analytics?.jobs || {};
  const applications = analytics?.applications || {};
  const summary = analytics?.summary || {};

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu thống kê...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmployerShell active="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-semibold mb-2">Thống kê</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi hiệu suất tuyển dụng của bạn
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tổng tin tuyển dụng
                </p>
                <p className="text-3xl font-bold">
                  {summary.totalJobs ?? jobs.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tin đang hoạt động
                </p>
                <p className="text-3xl font-bold">
                  {summary.activeJobs ?? jobs.active ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Tổng đơn ứng tuyển
                </p>
                <p className="text-3xl font-bold">
                  {summary.totalApplications ?? applications.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Draft Jobs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Bản nháp
                </p>
                <p className="text-3xl font-bold">{jobs.draft ?? 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jobs Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Phân tích tin tuyển dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Tổng số tin</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {jobs.total ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Đang hoạt động</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {jobs.active ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Bản nháp</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {jobs.draft ?? 0}
                </span>
              </div>

              {jobs.closed !== undefined && jobs.closed > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Đã đóng</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">
                    {jobs.closed}
                  </span>
                </div>
              )}

              {/* Progress Bar for Active Jobs */}
              {jobs.total && jobs.total > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Tỷ lệ tin đang hoạt động
                    </span>
                    <span className="font-medium">
                      {Math.round(
                        ((jobs.active ?? 0) / jobs.total) * 100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((jobs.active ?? 0) / jobs.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Applications Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Thống kê ứng tuyển
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Tổng đơn ứng tuyển</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {applications.total ?? 0}
                </span>
              </div>

              {/* Average Applications per Job */}
              {summary.totalJobs &&
                summary.totalJobs > 0 &&
                applications.total !== undefined && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Trung bình mỗi tin</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {(
                        applications.total / summary.totalJobs
                      ).toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        đơn/tin
                      </span>
                    </p>
                  </div>
                )}

              {/* Conversion Rate */}
              {summary.activeJobs &&
                summary.activeJobs > 0 &&
                applications.total !== undefined && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Tỷ lệ ứng tuyển</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {(
                        (applications.total / summary.activeJobs) *
                        100
                      ).toFixed(1)}
                      %{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        trên tin hoạt động
                      </span>
                    </p>
                  </div>
                )}

              {applications.total === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có đơn ứng tuyển nào trong khoảng thời gian này</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Quick Actions */}
        <div>
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/jobs")}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Quản lý tin tuyển dụng
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/jobs/create-job")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Tạo tin mới
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </EmployerShell>
  );
}

