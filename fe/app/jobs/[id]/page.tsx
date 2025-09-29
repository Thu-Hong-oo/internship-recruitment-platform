import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout";
import { jobsAPI } from "@/lib/api";
import { notFound } from "next/navigation";

interface JobDetailPageProps {
  params: { id: string };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = params;

  try {
    const res = await jobsAPI.getJobById(id);
    if (!res?.success || !res?.data) return notFound();

    const job = res.data;
    const companyName = job.employer?.company?.name || "Nhà tuyển dụng";
    const companyLogo = job.employer?.company?.logo?.url;
    const headerImage = companyLogo || job.postedBy?.avatar || undefined;

    return (
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
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
                {job.status && (
                  <Badge
                    variant={job.status === "active" ? "default" : "outline"}
                  >
                    {job.status}
                  </Badge>
                )}
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
                {job.location && (
                  <Badge variant="secondary">{job.location}</Badge>
                )}
                {job.deadline && (
                  <Badge variant="outline">
                    Hạn nộp: {new Date(job.deadline).toLocaleDateString()}
                  </Badge>
                )}
                {typeof job.positions === "number" && (
                  <Badge variant="outline">Số lượng: {job.positions}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="font-medium">Ứng tuyển ngay</Button>
              <Button variant="outline">Lưu việc làm</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
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
                  <p className="text-sm leading-6 whitespace-pre-line">
                    {job.requirements || "Đang cập nhật"}
                  </p>
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
            </div>
            <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </PageLayout>
    );
  } catch (e) {
    return notFound();
  }
}
