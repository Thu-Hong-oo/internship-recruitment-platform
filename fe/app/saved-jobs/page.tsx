"use client";

import { PageLayout } from "@/components/layout";
import {
  Bookmark,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SavedJobsPage() {
  // Mock data cho việc làm đã lưu
  const savedJobs = [
    {
      id: 1,
      title: "Frontend Developer Intern",
      company: "TechCorp Vietnam",
      location: "Hồ Chí Minh",
      salary: "8-12 triệu",
      type: "Thực tập",
      savedDate: "2024-01-15",
      logo: "🏢",
    },
    {
      id: 2,
      title: "React Developer Junior",
      company: "Digital Solutions",
      location: "Hà Nội",
      salary: "15-20 triệu",
      type: "Chính thức",
      savedDate: "2024-01-14",
      logo: "💻",
    },
    {
      id: 3,
      title: "UI/UX Designer",
      company: "Creative Studio",
      location: "Đà Nẵng",
      salary: "12-18 triệu",
      type: "Chính thức",
      savedDate: "2024-01-13",
      logo: "🎨",
    },
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Việc làm đã lưu
          </h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi những việc làm bạn quan tâm
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Bookmark className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tổng số việc làm
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {savedJobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Công ty</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(savedJobs.map((job) => job.company)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Lưu gần nhất</p>
                  <p className="text-2xl font-bold text-foreground">Hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Jobs List */}
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{job.logo}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{job.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Lưu ngày {job.savedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Bỏ lưu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (nếu không có việc làm nào) */}
        {savedJobs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Chưa có việc làm nào được lưu
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy tìm kiếm và lưu những việc làm bạn quan tâm
              </p>
              <Button>Tìm việc làm ngay</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
