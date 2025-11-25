"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  Eye,
  UsersRound,
  Briefcase,
  UserCircle2,
  CheckCircle2,
  Building2,
  Sparkles,
  DollarSign,
  Clock,
  GraduationCap,
  Award,
  Tag,
  Globe,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { jobsAPI } from "@/lib/api";
import { useParams } from "next/navigation";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { useEffect, useState } from "react";

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(false);
        const res = await jobsAPI.getJobById(id);

        if (!res?.success || !res?.data) {
          setError(true);
          return;
        }

        setJob(res.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_210)_0%,white_30%)] pb-20">
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin công việc...</p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !job) {
    return (
      <PageLayout>
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_210)_0%,white_30%)] pb-20">
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Không tìm thấy công việc
              </h1>
              <p className="text-slate-600 mb-6">
                Công việc bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
              </p>
              <Link href="/search">
                <Button>Quay lại danh sách việc làm</Button>
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
  const companyLogo = job.employer?.company?.logo?.url;

  return (
    <PageLayout>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_210)_0%,white_30%)] pb-20">
        <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.65_0.18_195/.25),transparent_70%)] blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute right-[-120px] top-80 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.12_210/.22),transparent_75%)] blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="text-sm text-slate-600 mb-6 flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-[oklch(0.65_0.18_195)] transition-colors"
            >
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              href="/search"
              className="hover:text-[oklch(0.65_0.18_195)] transition-colors"
            >
              Việc làm
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium line-clamp-1">
              {job.title}
            </span>
          </div>

          {/* Banner & Header Section */}
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(15,45,95,0.15)]">
            {/* Banner/Cover Image */}
            <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-[oklch(0.65_0.18_195)] via-[oklch(0.72_0.12_210)] to-[oklch(0.84_0.05_205)] overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:40px_40px]"></div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl"></div>
            </div>

            {/* Content Section */}
            <div className="relative bg-white/95 backdrop-blur-xl border-t border-white/50">
              <div className="px-7 md:px-9 pb-9 pt-24 md:pt-28">
                {/* Company Logo - Overlapping Banner */}
                <div className="absolute -top-16 md:-top-20 left-6 md:left-8">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt={companyName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <Building2 className="w-16 h-16 md:w-20 md:h-20 text-[oklch(0.65_0.18_195)]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Name & Job Title */}
                <div className="ml-0 md:ml-44">
                  <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg font-semibold text-slate-700">
                      {companyName}
                    </span>
                    {job.postedBy?.avatar && (
                      <>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-2">
                          <img
                            src={job.postedBy.avatar}
                            alt={job.postedBy.fullName || "Người đăng"}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          />
                          {job.postedBy?.fullName && (
                            <span className="text-sm text-slate-600">
                              {job.postedBy.fullName}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Job Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.salary && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                    )}
                    {job.level && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Award className="w-3.5 h-3.5" /> {job.level}
                      </span>
                    )}
                    {job.jobType && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3.5 h-3.5" />{" "}
                        {job.jobType === "Fulltime"
                          ? "Toàn thời gian"
                          : job.jobType === "Parttime"
                          ? "Bán thời gian"
                          : job.jobType === "Internship"
                          ? "Thực tập"
                          : job.jobType}
                      </span>
                    )}
                    {job.workingMode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Globe className="w-3.5 h-3.5" />{" "}
                        {job.workingMode === "Onsite"
                          ? "Tại văn phòng"
                          : job.workingMode === "Remote"
                          ? "Làm việc từ xa"
                          : job.workingMode === "Hybrid"
                          ? "Kết hợp"
                          : job.workingMode}
                      </span>
                    )}
                    {typeof job.positions === "number" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <UsersRound className="w-3.5 h-3.5" /> {job.positions}{" "}
                        vị trí
                      </span>
                    )}
                    {job.deadline && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <CalendarDays className="w-3.5 h-3.5" /> Hạn:{" "}
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {job.status && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-400 to-green-500 text-white border-none shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {job.status}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <ApplyButton
                      jobId={id}
                      jobTitle={job.title}
                      className="font-semibold rounded-lg px-7 py-3.5 shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-[oklch(0.65_0.18_195)] via-[oklch(0.78_0.09_210)] to-[oklch(0.9_0.04_195)] text-white hover:brightness-110"
                    />
                    <Button
                      variant="outline"
                      className="rounded-lg border-slate-200 bg-white hover:bg-slate-50 font-semibold px-7 py-3.5 shadow-sm"
                    >
                      Lưu việc làm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Tổng quan nhanh */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                    Chi tiết tin tuyển dụng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {job.salary && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Mức lương
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.salary}
                          </div>
                        </div>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Địa điểm
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.location}
                          </div>
                        </div>
                      </div>
                    )}
                    {job.level && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <Award className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Cấp độ
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.level}
                          </div>
                        </div>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Loại công việc
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.jobType === "Fulltime"
                              ? "Toàn thời gian"
                              : job.jobType === "Parttime"
                              ? "Bán thời gian"
                              : job.jobType === "Internship"
                              ? "Thực tập"
                              : job.jobType}
                          </div>
                        </div>
                      </div>
                    )}
                    {job.workingMode && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <Globe className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Hình thức làm việc
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.workingMode === "Onsite"
                              ? "Tại văn phòng"
                              : job.workingMode === "Remote"
                              ? "Làm việc từ xa"
                              : job.workingMode === "Hybrid"
                              ? "Hybrid"
                              : job.workingMode}
                          </div>
                        </div>
                      </div>
                    )}
                    {typeof job.positions === "number" && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <UsersRound className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Số lượng tuyển
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.positions}
                          </div>
                        </div>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <CalendarDays className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Hạn nộp
                          </div>
                          <div className="font-bold text-slate-900">
                            {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {typeof job.views === "number" && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center">
                          <Eye className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium">
                            Lượt xem
                          </div>
                          <div className="font-bold text-slate-900">
                            {job.views}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Mô tả công việc */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Mô tả công việc
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 relative">
                  <div className="text-sm leading-7 whitespace-pre-line text-slate-700">
                    {job.description || "Đang cập nhật"}
                  </div>
                </CardContent>
              </div>

              {/* Yêu cầu */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Yêu cầu
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 relative">
                  {job.requirements ? (
                    <ul className="list-none text-sm leading-7 space-y-2 text-slate-700">
                      {job.requirements
                        .split("\n")
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 0)
                        .map((line: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.18_195)] mt-2 flex-shrink-0" />
                            <span>{line.replace(/^[-•]\s?/, "")}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Đang cập nhật</p>
                  )}
                </CardContent>
              </div>

              {/* Kỹ năng */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.06)_0%,oklch(0.84_0.05_205/.03)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Kỹ năng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 relative">
                  {job.skills && job.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((s: string) => (
                        <Badge
                          key={s}
                          className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-medium text-xs hover:bg-slate-200 transition-colors"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Đang cập nhật</p>
                  )}
                </CardContent>
              </div>

              {/* Quyền lợi */}
              {job.benefits && (
                <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                  <CardHeader className="relative border-b border-white/40">
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Quyền lợi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-7 relative">
                    {job.benefits ? (
                      <ul className="list-none text-sm leading-7 space-y-2 text-slate-700">
                        {job.benefits
                          .split("\n")
                          .map((line: string) => line.trim())
                          .filter((line: string) => line.length > 0)
                          .map((line: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.18_195)] mt-2 flex-shrink-0" />
                              <span>{line.replace(/^[-•]\s?/, "")}</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Đang cập nhật</p>
                    )}
                  </CardContent>
                </div>
              )}

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                  <CardHeader className="relative border-b border-white/40">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-[oklch(0.65_0.18_195)]" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-7 relative">
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="px-3 py-1 rounded-lg text-xs font-medium border-[oklch(0.65_0.18_195/.3)] text-slate-700"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </div>
              )}

              {/* Ứng tuyển */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Ứng tuyển
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 space-y-4 relative">
                  {job.deadline && (
                    <div className="text-sm text-slate-600 font-medium">
                      Hạn nộp hồ sơ:{" "}
                      <span className="text-slate-900 font-bold">
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <ApplyButton
                      jobId={id}
                      jobTitle={job.title}
                      className="font-semibold rounded-lg px-7 py-3.5 shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-[oklch(0.65_0.18_195)] via-[oklch(0.78_0.09_210)] to-[oklch(0.9_0.04_195)] text-white hover:brightness-110"
                    />
                    <Button
                      variant="outline"
                      className="rounded-lg border-white/50 bg-white/70 backdrop-blur-sm hover:bg-white/90 font-semibold px-7 py-3.5"
                    >
                      Lưu việc làm
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-20 h-fit">
              {/* Thông tin chung */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Thông tin chung
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 space-y-3 relative">
                  <div className="text-sm text-slate-600 space-y-2">
                    {job.createdAt && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">
                          Đăng:
                        </span>
                        <span className="text-slate-700">
                          {new Date(job.createdAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {job.updatedAt && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">
                          Cập nhật:
                        </span>
                        <span className="text-slate-700">
                          {new Date(job.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {typeof job.views === "number" && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">
                          Lượt xem:
                        </span>
                        <span className="text-slate-700 font-bold">
                          {job.views}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Người đăng */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardContent className="p-7 flex items-center gap-4 relative">
                  {job.postedBy?.avatar ? (
                    <img
                      src={job.postedBy.avatar}
                      alt={job.postedBy.fullName || "Người đăng"}
                      className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.18_195/.2)] to-[oklch(0.78_0.09_210/.2)] flex items-center justify-center border-2 border-white shadow-lg">
                      <UserCircle2 className="w-8 h-8 text-[oklch(0.65_0.18_195)]" />
                    </div>
                  )}
                  <div className="text-sm">
                    <div className="font-bold text-slate-900 mb-1">
                      {job.postedBy?.fullName || "Người đăng"}
                    </div>
                    {job.postedBy?.email && (
                      <a
                        className="text-xs text-[oklch(0.65_0.18_195)] hover:underline font-medium"
                        href={`mailto:${job.postedBy.email}`}
                      >
                        {job.postedBy.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Thông tin công việc */}
              <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                <CardHeader className="relative border-b border-white/40">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Thông tin công việc
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-7 space-y-3 relative">
                  <div className="text-sm text-slate-600 space-y-2">
                    {job.level && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[oklch(0.65_0.18_195)]" />
                        <span className="font-medium text-slate-500">
                          Cấp độ:
                        </span>
                        <span className="text-slate-700">{job.level}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[oklch(0.65_0.18_195)]" />
                        <span className="font-medium text-slate-500">
                          Loại công việc:
                        </span>
                        <span className="text-slate-700">
                          {job.jobType === "Fulltime"
                            ? "Toàn thời gian"
                            : job.jobType === "Parttime"
                            ? "Bán thời gian"
                            : job.jobType === "Internship"
                            ? "Thực tập"
                            : job.jobType}
                        </span>
                      </div>
                    )}
                    {job.workingMode && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[oklch(0.65_0.18_195)]" />
                        <span className="font-medium text-slate-500">
                          Chế độ làm việc:
                        </span>
                        <span className="text-slate-700">
                          {job.workingMode === "Onsite"
                            ? "Tại văn phòng"
                            : job.workingMode === "Remote"
                            ? "Làm việc từ xa"
                            : job.workingMode === "Hybrid"
                            ? "Kết hợp"
                            : job.workingMode}
                        </span>
                      </div>
                    )}
                    {job.industryCode && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[oklch(0.65_0.18_195)]" />
                        <span className="font-medium text-slate-500">
                          Ngành nghề:
                        </span>
                        <span className="text-slate-700 capitalize">
                          {job.industryCode}
                        </span>
                      </div>
                    )}
                    {job.address?.fullAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[oklch(0.65_0.18_195)] mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">
                            Địa chỉ chi tiết:
                          </span>
                          <span className="text-slate-700">
                            {job.address.fullAddress}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Thông tin khác */}
              {(job.education || job.experience) && (
                <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
                  <CardHeader className="relative border-b border-white/40">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Thông tin khác
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-7 space-y-3 relative">
                    {job.education && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">
                          Học vấn:{" "}
                        </span>
                        <span className="text-slate-600">{job.education}</span>
                      </div>
                    )}
                    {job.experience && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">
                          Kinh nghiệm:{" "}
                        </span>
                        <span className="text-slate-600">{job.experience}</span>
                      </div>
                    )}
                  </CardContent>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
