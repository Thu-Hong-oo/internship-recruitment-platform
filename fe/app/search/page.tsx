"use client";

import {
  MapPin,
  Filter,
  Heart,
  Bookmark,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/layout";

interface JobSearchResultsProps {
  onBack: () => void;
}

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { jobsAPI, JobItem } from "@/lib/api";

export default function JobSearchResults({ onBack }: JobSearchResultsProps) {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await jobsAPI.getJobs(1, 10, { q, category });
        setJobs(res?.data || []);
      } catch (e: any) {
        setError(e?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q, category]);
  const searchBarContent = (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
        <span>Danh mục Nghề (1)</span>
        <span className="cursor-pointer hover:text-white/70">×</span>
      </div>
      <input
        placeholder="Vị trí tuyển dụng"
        className="flex-1 bg-white text-foreground border-0 focus:ring-2 focus:ring-white/30 px-3 py-2 rounded"
      />
      <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
        <MapPin className="w-4 h-4" />
        <span>Hồ Chí Minh</span>
        <span className="cursor-pointer hover:text-white/70">×</span>
      </div>
      <Button className="button-primary">Tìm kiếm</Button>
    </div>
  );

  return (
    <PageLayout showSearchBar={true} searchBarContent={searchBarContent}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="text-primary hover:text-primary/80 cursor-pointer">
            Trang chủ
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary hover:text-primary/80 cursor-pointer">
            Việc làm Công nghệ Thông tin
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary hover:text-primary/80 cursor-pointer">
            Software Engineering
          </span>
          <ChevronRight className="w-4 h-4" />
          <span>Software Engineer</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Tuyển dụng 275 việc làm Software Engineer [Update 19/08/2025]
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-muted-foreground font-medium">
              Từ khóa gợi ý:
            </span>
            {[
              "front end developer",
              "back end developer",
              "full stack developer",
              "mobile developer",
              "software developer",
              "blockchain developer",
            ].map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors duration-200"
              >
                {keyword}
              </Badge>
            ))}
          </div>
          <div className="bg-primary/10 text-primary p-4 rounded-lg border border-primary/20">
            {loading && <span>Đang tải kết quả...</span>}
            {!loading && error && (
              <span className="text-destructive">{error}</span>
            )}
            {!loading && !error && (
              <>
                Có <strong>{jobs.length}</strong> việc làm phù hợp
                {q ? (
                  <>
                    {" "}
                    cho từ khóa <strong>{q}</strong>
                  </>
                ) : null}
                {category ? (
                  <>
                    {" "}
                    trong danh mục <strong>{category}</strong>
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">
                    Lọc nâng cao
                  </span>
                </div>

                {/* Job Categories */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Theo danh mục nghề
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Software Engineering", count: 249 },
                      { name: "IT Management/Specialist", count: 9 },
                      { name: "Công nghệ thông tin khác", count: 9 },
                      { name: "IT Project Management", count: 4 },
                      { name: "IoT/Embedded Engineer", count: 2 },
                    ].map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Checkbox />
                          <span className="ml-2 text-sm text-foreground">
                            {category.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({category.count})
                        </span>
                      </div>
                    ))}
                    <button className="text-primary text-sm hover:text-primary/80 cursor-pointer transition-colors duration-200">
                      Xem thêm
                    </button>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-foreground">
                    Kinh nghiệm
                  </h3>
                  <RadioGroup defaultValue="all">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="text-sm text-foreground">
                        Tất cả
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="no-requirement"
                        id="no-requirement"
                      />
                      <Label
                        htmlFor="no-requirement"
                        className="text-sm text-foreground"
                      >
                        Không yêu cầu
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="under-1" id="under-1" />
                      <Label
                        htmlFor="under-1"
                        className="text-sm text-foreground"
                      >
                        Dưới 1 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-year" id="1-year" />
                      <Label
                        htmlFor="1-year"
                        className="text-sm text-foreground"
                      >
                        1 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2-years" id="2-years" />
                      <Label
                        htmlFor="2-years"
                        className="text-sm text-foreground"
                      >
                        2 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-years" id="3-years" />
                      <Label
                        htmlFor="3-years"
                        className="text-sm text-foreground"
                      >
                        3 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4-years" id="4-years" />
                      <Label
                        htmlFor="4-years"
                        className="text-sm text-foreground"
                      >
                        4 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5-years" id="5-years" />
                      <Label
                        htmlFor="5-years"
                        className="text-sm text-foreground"
                      >
                        5 năm
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="over-5" id="over-5" />
                      <Label
                        htmlFor="over-5"
                        className="text-sm text-foreground"
                      >
                        Trên 5 năm
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-transparent"
                >
                  Tên việc làm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-transparent"
                >
                  Tên công ty
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Cả hai
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Ưu tiên hiển thị theo:
                </span>
                <select className="border border-border rounded px-3 py-1 text-sm bg-background text-foreground">
                  <option>Search by AI</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {loading && (
                <Card className="border-border">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Đang tải việc làm...
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
              {!loading && !error && jobs.length === 0 && (
                <Card className="border-border">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Không có việc làm phù hợp.
                  </CardContent>
                </Card>
              )}
              {!loading &&
                !error &&
                jobs.map((job) => {
                  const companyName = job.companyId?.name || "Nhà tuyển dụng";
                  const logoUrl = (job.companyId as any)?.logo?.url;
                  const location =
                    (job as any)?.fullLocation ||
                    (job as any)?.location?.city ||
                    "Đang cập nhật";
                  const salary =
                    (job as any)?.salaryRange ||
                    (job as any)?.internship?.salary?.amount
                      ? `${(
                          job as any
                        ).internship.salary.amount.toLocaleString()} ${
                          (job as any).internship.salary.period || ""
                        }`
                      : "Thỏa thuận";
                  return (
                    <Card key={job.id} className="card-hover border-border">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-xs text-muted-foreground px-1 text-center">
                                {companyName.slice(0, 8)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg text-primary hover:text-primary/80 cursor-pointer">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  {salary}
                                </Badge>
                                <Heart className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-destructive transition-colors duration-200" />
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-2 font-medium">
                              {companyName}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {location}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-6 bottom-6 flex flex-col gap-3">
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full button-secondary shadow-lg">
          <span className="text-xs font-semibold">Góp ý</span>
        </Button>
        <Button className="w-12 h-12 rounded-full button-primary shadow-lg">
          <span className="text-xs font-semibold">Hỗ trợ</span>
        </Button>
      </div>
    </PageLayout>
  );
}
