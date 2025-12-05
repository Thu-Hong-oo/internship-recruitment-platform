'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { jobsAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ApplyButton } from "@/components/jobs/ApplyButton";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get job ID from URL pathname (works in both dev and production)
  useEffect(() => {
    async function getJobId() {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const match = pathname.match(/^\/jobs\/([^\/]+)/);
        if (match && match[1]) {
          const jobId = match[1];
          // Skip placeholder/dummy IDs
          if (jobId !== 'placeholder' && jobId !== 'dummy') {
            setId(jobId);
            return;
          }
        }
      }
      
      // Fallback to params if URL parsing fails
      try {
        const resolvedParams = await params;
        const jobId = resolvedParams.id;
        if (jobId === 'dummy' || jobId === 'placeholder') {
          setLoading(false);
          return;
        }
        setId(jobId);
      } catch (error) {
        console.error('Error resolving params:', error);
        setLoading(false);
      }
    }
    getJobId();
  }, [params]);

  // Fetch job data
  useEffect(() => {
    if (!id || id === 'dummy') return;

    async function fetchJob() {
      try {
        setLoading(true);
        const res = await jobsAPI.getJobById(id);
        if (!res?.success || !res?.data) {
          setError(true);
          return;
        }
        setJob(res.data);
      } catch (e) {
        console.error('Error fetching job:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id]);

  // Loading state
  if (loading || !id) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Không tìm thấy tin tuyển dụng</h1>
            <p className="text-muted-foreground mb-4">
              Tin tuyển dụng bạn đang tìm không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={() => router.push('/search')}>
              Quay lại danh sách việc làm
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
  const companyLogo = job.employer?.company?.logo?.url;
  const headerImage = companyLogo || job.postedBy?.avatar || undefined;

  // Format salary
  const formatSalary = () => {
    if (job.salary) return job.salary;
    if (job.salaryMin && job.salaryMax) {
      const currency = job.currency || 'VND';
      const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
      };
      return `${formatNumber(job.salaryMin)} - ${formatNumber(job.salaryMax)} ${currency}`;
    }
    return null;
  };

  // Format location
  const formatLocation = () => {
    if (job.location) return job.location;
    if (job.address?.fullAddress) return job.address.fullAddress;
    if (job.address?.city) return job.address.city;
    return null;
  };

  const formattedSalary = formatSalary();
  const formattedLocation = formatLocation();

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <Link href="/" className="hover:underline">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/search" className="hover:underline">
            Việc làm
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{job.title}</span>
        </div>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
              {headerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerImage}
                  alt={companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Logo</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{companyName}</span>
                {job.postedBy?.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.postedBy.avatar}
                    alt={job.postedBy.fullName || "Người đăng"}
                    className="w-6 h-6 rounded-full border"
                  />
                )}
                {job.postedBy?.fullName && (
                  <span>• {job.postedBy.fullName}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formattedSalary && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                    <Briefcase className="w-3 h-3" /> {formattedSalary}
                  </span>
                )}
                {formattedLocation && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                    <MapPin className="w-3 h-3" /> {formattedLocation}
                  </span>
                )}
                {typeof job.positions === "number" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                    <UsersRound className="w-3 h-3" /> {job.positions} vị trí
                  </span>
                )}
                {job.deadline && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground text-xs">
                    <CalendarDays className="w-3 h-3" /> Hạn:{" "}
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>
                )}
                {job.status && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> {job.status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {id && (
                <ApplyButton
                  jobId={id}
                  jobTitle={job.title}
                  className="font-medium"
                />
              )}
              <Button variant="outline">Lưu việc làm</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Tổng quan nhanh */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">
                    Chi tiết tin tuyển dụng
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {formattedSalary && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Mức lương:
                        </span>
                        <span className="font-medium text-foreground">
                          {formattedSalary}
                        </span>
                      </div>
                    )}
                    {formattedLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Địa điểm:</span>
                        <span className="font-medium text-foreground">
                          {formattedLocation}
                        </span>
                      </div>
                    )}
                    {typeof job.positions === "number" && (
                      <div className="flex items-center gap-2">
                        <UsersRound className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Số lượng tuyển:
                        </span>
                        <span className="font-medium text-foreground">
                          {job.positions}
                        </span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Hạn nộp:</span>
                        <span className="font-medium text-foreground">
                          {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {typeof job.views === "number" && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Lượt xem:</span>
                        <span className="font-medium text-foreground">
                          {job.views}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-3">Mô tả công việc</h2>
                  <p className="text-sm leading-6 whitespace-pre-line">
                    {job.description || "Đang cập nhật"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-3">Yêu cầu</h2>
                  {job.requirements ? (
                    <ul className="list-disc list-inside text-sm leading-6 space-y-1">
                      {job.requirements
                        .split("\n")
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0)
                        .map((line, idx) => (
                          <li key={idx}>{line.replace(/^[-•]\s?/, "")}</li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Đang cập nhật
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-3">Kỹ năng</h2>
                  {job.skills && job.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Đang cập nhật
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Hướng dẫn nộp hồ sơ */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h2 className="font-semibold">Ứng tuyển</h2>
                  {job.deadline && (
                    <div className="text-sm text-muted-foreground">
                      Hạn nộp hồ sơ:{" "}
                      {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {id && (
                      <ApplyButton
                        jobId={id}
                        jobTitle={job.title}
                        className="font-medium"
                      />
                    )}
                    <Button variant="outline">Lưu việc làm</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6 lg:sticky lg:top-20 h-fit">
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold">Thông tin chung</h3>
                  <div className="text-sm text-muted-foreground">
                    {job.createdAt && (
                      <div>
                        Đăng: {new Date(job.createdAt).toLocaleString()}
                      </div>
                    )}
                    {job.updatedAt && (
                      <div>
                        Cập nhật: {new Date(job.updatedAt).toLocaleString()}
                      </div>
                    )}
                    {typeof job.views === "number" && (
                      <div>Lượt xem: {job.views}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-3">
                  {job.postedBy?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.postedBy.avatar}
                      alt={job.postedBy.fullName || "Người đăng"}
                      className="w-12 h-12 rounded-full border"
                    />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="text-sm">
                    <div className="font-medium text-foreground">
                      {job.postedBy?.fullName || "Người đăng"}
                    </div>
                    {job.postedBy?.email && (
                      <a
                        className="text-xs text-primary hover:underline"
                        href={`mailto:${job.postedBy.email}`}
                      >
                        {job.postedBy.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-semibold">Thống kê</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded bg-muted">
                      <div className="text-lg font-bold">
                        {job.stats?.applications ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ứng tuyển
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <div className="text-lg font-bold">
                        {job.stats?.interviews ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Phỏng vấn
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <div className="text-lg font-bold">
                        {job.stats?.offers ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Offer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-semibold">Thông tin khác</h3>
                  {job.education && (
                    <div className="text-sm">
                      <span className="font-medium">Học vấn: </span>
                      {job.education}
                    </div>
                  )}
                  {job.experience && (
                    <div className="text-sm">
                      <span className="font-medium">Kinh nghiệm: </span>
                      {job.experience}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mẹo an toàn */}
              <Card>
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-semibold">Bí kíp tìm việc an toàn</h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    <li>Không chuyển tiền đặt cọc hay phí tuyển dụng.</li>
                    <li>
                      Kiểm tra kỹ thông tin nhà tuyển dụng trước khi nộp CV.
                    </li>
                    <li>Báo cáo tin tuyển dụng đáng ngờ cho chúng tôi.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    );
}
