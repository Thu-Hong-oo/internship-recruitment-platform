"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import {
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Search,
  TrendingUp,
  Filter,
} from "lucide-react";
import { nlpService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JobRecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(30);
  const [isUpdatingMatches, setIsUpdatingMatches] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Yêu cầu đăng nhập candidate trước khi xem gợi ý việc làm
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          const redirectUrl = "/job-recommendations";
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }
      }

      // Tự động tính điểm phù hợp cho tất cả job, sau đó tải danh sách gợi ý
      await refreshJobMatchesAndRecommendations();
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, tierFilter, jobs]);

  const fetchJobRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await nlpService.getBestMatches({
        limit: 20,
        minScore,
      });
      setJobs(response.data);
      setFilteredJobs(response.data);
    } catch (error) {
      console.error("Failed to fetch job recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load job recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.job.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tierFilter !== "all") {
      filtered = filtered.filter((item) => item.tier === tierFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleGenerateRoadmap = (jobId: string) => {
    router.push(`/roadmaps?targetJobId=${jobId}`);
  };

  // Tính lại toàn bộ điểm phù hợp rồi reload danh sách gợi ý
  const refreshJobMatchesAndRecommendations = async () => {
    try {
      setIsUpdatingMatches(true);
      // Gọi API tính lại toàn bộ matching score cho candidate hiện tại
      const result = await nlpService.calculateAllMatches();

      if (!result.success) {
        toast({
          title: "Không thể cập nhật điểm phù hợp",
          description: result.message || "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } else if (result.message) {
        toast({
          title: "Đã cập nhật điểm phù hợp",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Failed to calculate all matches:", error);
      toast({
        title: "Lỗi khi cập nhật điểm phù hợp",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMatches(false);
      // Luôn reload danh sách gợi ý sau khi tính điểm xong
      await fetchJobRecommendations();
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header + Filters */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-none shadow-sm">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">
                      Gợi ý việc làm phù hợp
                    </h1>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">
                    Danh sách việc làm được xếp hạng theo mức độ phù hợp với hồ sơ
                    và kỹ năng hiện tại của bạn. Bạn có thể lọc theo tier và điểm
                    tối thiểu để tinh chỉnh kết quả.
                  </p>
                </div>

                <div className="w-full md:w-[420px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-xs border">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên việc làm hoặc công ty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none shadow-none h-8 px-0 focus-visible:ring-0 text-sm"
                      />
                    </div>

                    {/* Min score */}
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-xs border">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={minScore.toString()}
                        onValueChange={(value) => setMinScore(parseInt(value))}
                      >
                        <SelectTrigger className="border-none shadow-none h-8 px-0 text-sm">
                          <SelectValue placeholder="Điểm tối thiểu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Điểm ≥ 30%</SelectItem>
                          <SelectItem value="40">Điểm ≥ 40%</SelectItem>
                          <SelectItem value="50">Điểm ≥ 50%</SelectItem>
                          <SelectItem value="60">Điểm ≥ 60%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tier filter + summary */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={tierFilter === "all" ? "default" : "outline"}
                        onClick={() => setTierFilter("all")}
                      >
                        Tất cả tier
                      </Button>
                      <Button
                        size="sm"
                        variant={tierFilter === "A" ? "default" : "outline"}
                        onClick={() => setTierFilter("A")}
                      >
                        Tier A
                      </Button>
                      <Button
                        size="sm"
                        variant={tierFilter === "B" ? "default" : "outline"}
                        onClick={() => setTierFilter("B")}
                      >
                        Tier B
                      </Button>
                      <Button
                        size="sm"
                        variant={tierFilter === "C" ? "default" : "outline"}
                        onClick={() => setTierFilter("C")}
                      >
                        Tier C
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <p className="text-xs text-muted-foreground">
                        Đang hiển thị{" "}
                        <span className="font-semibold">
                          {filteredJobs.length} việc làm
                        </span>{" "}
                        với điểm ≥ {minScore}%.
                      </p>
                      <Button
                        onClick={refreshJobMatchesAndRecommendations}
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingMatches || isLoading}
                      >
                        {isUpdatingMatches ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang cập nhật gợi ý...
                          </span>
                        ) : (
                          "Cập nhật gợi ý"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Job List */}
        {!isLoading && filteredJobs.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Chưa tìm thấy việc làm phù hợp
                </h3>
                <p className="text-muted-foreground mb-4">
                  Hãy thử nới lỏng bộ lọc hoặc cập nhật thêm kỹ năng trong hồ sơ
                  để hệ thống gợi ý chính xác hơn.
                </p>
                <Button onClick={() => router.push("/profile")}>
                  Cập nhật hồ sơ ngay
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredJobs.map((item) => {
                const companyName = item.job.company || "Nhà tuyển dụng";
                const companyInitial =
                  typeof companyName === "string" && companyName.length > 0
                    ? companyName.charAt(0).toUpperCase()
                    : "C";

                const deadline = item.job.deadline
                  ? new Date(item.job.deadline)
                  : null;

                return (
                  <Card
                    key={item.jobId}
                    className="hover:shadow-md transition-shadow border border-slate-100 rounded-xl"
                  >
                    <CardContent className="pt-5 pb-5">
                      <div className="flex gap-4">
                        {/* Logo / Initial */}
                        <div className="hidden sm:flex items-start">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {companyInitial}
                          </div>
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold mb-1 hover:text-blue-700 cursor-pointer">
                                {item.job.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {companyName}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                className={
                                  item.tier === "A"
                                    ? "bg-green-100 text-green-700"
                                    : item.tier === "B"
                                    ? "bg-blue-100 text-blue-700"
                                    : item.tier === "C"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                Tier {item.tier} • {item.overallScore}%
                              </Badge>
                              {deadline && (
                                <span className="text-[11px] text-muted-foreground">
                                  Hạn nộp:{" "}
                                  {deadline.toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.job.location || "Đang cập nhật"}
                            </span>
                            {item.job.salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {item.job.salary.min.toLocaleString()} -{" "}
                                {item.job.salary.max.toLocaleString()}{" "}
                                {item.job.salary.currency}
                              </span>
                            )}
                            {item.job.level && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {item.job.level}
                              </span>
                            )}
                          </div>

                          {/* Matched Skills */}
                          {item.matchedSkills &&
                            item.matchedSkills.length > 0 && (
                              <div className="mb-1">
                                <p className="text-xs font-medium mb-1 text-slate-700">
                                  Kỹ năng trùng khớp:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.matchedSkills
                                    .slice(0, 5)
                                    .map((skill: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  {item.matchedSkills.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.matchedSkills.length - 5} nữa
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              onClick={() => handleViewJob(item.job._id)}
                              size="sm"
                            >
                              Xem chi tiết
                            </Button>
                            <Button
                              onClick={() =>
                                handleGenerateRoadmap(item.job._id)
                              }
                              variant="outline"
                              size="sm"
                            >
                              Tạo lộ trình học tập
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Match Score Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {filteredJobs[0] && (
                  <MatchScoreCard
                    score={filteredJobs[0].overallScore}
                    tier={filteredJobs[0].tier}
                    breakdown={filteredJobs[0].breakdown}
                    strengths={filteredJobs[0].strengths}
                    concerns={filteredJobs[0].concerns}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
