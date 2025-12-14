"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmployerShell from "@/components/layout/EmployerShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSearch, Search, MapPin, Briefcase, GraduationCap, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMyMembership } from "@/lib/teamAPI";

interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  skills?: string[];
  experience?: number;
  education?: string;
  location?: {
    city?: string;
    district?: string;
  };
  resume?: {
    url?: string;
  };
}

export default function CandidatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [canSearch, setCanSearch] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await getMyMembership();
        if (result.success && result.data) {
          const can = result.data.isOwner || result.data.permissions?.canSearchCandidates;
          setCanSearch(can);
          if (!can) {
            toast({
              title: "Không có quyền truy cập",
              description: "Bạn không có quyền tìm kiếm ứng viên.",
              variant: "destructive",
            });
            router.push("/dashboard");
          }
        } else {
          setCanSearch(true); // Default allow if no membership
        }
      } catch (error) {
        setCanSearch(true); // Default allow
      }
    };
    checkPermissions();
  }, [router, toast]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !skillFilter && !locationFilter) {
      toast({
        title: "Vui lòng nhập thông tin tìm kiếm",
        description: "Nhập tên, kỹ năng hoặc địa điểm để tìm kiếm ứng viên.",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual candidate search API
      // const response = await candidateAPI.search({ query: searchQuery, skill: skillFilter, location: locationFilter });
      // setCandidates(response.data || []);
      
      // Placeholder data
      setCandidates([]);
      toast({
        title: "Tính năng đang phát triển",
        description: "Chức năng tìm kiếm ứng viên sẽ sớm được cập nhật.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi tìm kiếm",
        description: error.message || "Không thể tìm kiếm ứng viên.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canSearch) {
    return null;
  }

  return (
    <EmployerShell active="candidates">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Tìm kiếm ứng viên</h1>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm và kết nối với các ứng viên tiềm năng
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm</CardTitle>
            <CardDescription>
              Tìm kiếm ứng viên theo tên, kỹ năng, địa điểm hoặc kinh nghiệm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Tìm kiếm
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Kỹ năng</label>
                  <Input
                    placeholder="Ví dụ: React, Node.js, Python..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Địa điểm</label>
                  <Input
                    placeholder="Ví dụ: Hà Nội, TP.HCM..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {candidates.length > 0 ? (
          <div className="grid gap-4">
            {candidates.map((candidate) => (
              <Card key={candidate._id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      {candidate.avatar ? (
                        <AvatarImage src={candidate.avatar} alt={candidate.fullName} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {candidate.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{candidate.fullName}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {candidate.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {candidate.email}
                              </div>
                            )}
                            {candidate.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {candidate.phone}
                              </div>
                            )}
                            {candidate.location?.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {candidate.location.city}
                              </div>
                            )}
                          </div>
                        </div>
                        {candidate.resume?.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(candidate.resume?.url, "_blank")}
                          >
                            Xem CV
                          </Button>
                        )}
                      </div>

                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {candidate.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        {candidate.experience && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {candidate.experience} năm kinh nghiệm
                          </div>
                        )}
                        {candidate.education && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {candidate.education}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có kết quả tìm kiếm</h3>
              <p className="text-sm text-muted-foreground">
                Sử dụng công cụ tìm kiếm ở trên để tìm kiếm ứng viên
              </p>
            </CardContent>
          </Card>
        ) : null}

        {loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Đang tìm kiếm...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployerShell>
  );
}

