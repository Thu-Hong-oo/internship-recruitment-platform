"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { MatchScoreCard } from "@/components/ai/MatchScoreCard";
import { nlpService, jobService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { MatchingScore } from "@/lib/api/services/nlp.service";

interface CandidateRecommendation extends MatchingScore {
  candidate: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    location?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
    education?: {
      degree: string;
      institution: string;
      graduationYear?: number;
    }[];
    skills?: string[];
  };
}

export default function CandidateRecommendationsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<CandidateRecommendation[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecommendation | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchCandidates();
    }
  }, [jobId]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchQuery, tierFilter, minScore]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobService.getJobById(jobId);
      setJob(response.data);
    } catch (error) {
      console.error("Failed to fetch job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    }
  };

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const response = await nlpService.getTopCandidates(jobId, {
        limit: 50,
        minScore: 0,
      });
      setCandidates(response.data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidate recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      const response = await nlpService.recalculateScores(jobId);
      if (response.success) {
        toast({
          title: "Đã khởi động tính lại điểm",
          description: response.message || "Điểm phù hợp sẽ được cập nhật trong vài phút.",
        });
        // Refresh candidates after a short delay
        setTimeout(() => {
          fetchCandidates();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Failed to recalculate scores:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể tính lại điểm. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.candidate.currentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tier filter
    if (tierFilter !== "all") {
      filtered = filtered.filter((c) => c.tier === tierFilter);
    }

    // Min score filter
    if (minScore > 0) {
      filtered = filtered.filter((c) => c.overallScore >= minScore);
    }

    setFilteredCandidates(filtered);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "A":
        return "bg-green-100 text-green-700 border-green-300";
      case "B":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "C":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "D":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
            <div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/employer/jobs")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">Candidate Recommendations</h1>
              </div>
              {job && (
                <p className="text-muted-foreground">
                  {job.title} • {filteredCandidates.length} candidate
                  {filteredCandidates.length !== 1 ? "s" : ""} found
                </p>
              )}
            </div>

            <Button 
              onClick={handleRecalculateScores} 
              variant="outline"
              disabled={isRecalculating}
            >
              {isRecalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tính lại...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Tính lại điểm phù hợp
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates by name, email, or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Select value={tierFilter} onValueChange={setTierFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Tiers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tiers</SelectItem>
                          <SelectItem value="A">Tier A (Excellent)</SelectItem>
                          <SelectItem value="B">Tier B (Good)</SelectItem>
                          <SelectItem value="C">Tier C (Fair)</SelectItem>
                          <SelectItem value="D">Tier D (Poor)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={minScore.toString()}
                        onValueChange={(v) => setMinScore(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Min Score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Scores</SelectItem>
                          <SelectItem value="50">50+</SelectItem>
                          <SelectItem value="60">60+</SelectItem>
                          <SelectItem value="70">70+</SelectItem>
                          <SelectItem value="80">80+</SelectItem>
                          <SelectItem value="90">90+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Filter className="mr-2 h-4 w-4" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidates */}
            {filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Candidates Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search criteria
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <Card
                    key={candidate.candidateId}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={(e) => {
                      // Only set selected candidate if click is not on a button or interactive element
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
                        return;
                      }
                      setSelectedCandidate(candidate);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={candidate.candidate.avatar} />
                          <AvatarFallback>
                            {getInitials(candidate.candidate.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {candidate.candidate.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {candidate.candidate.currentTitle || "No title"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTierColor(candidate.tier)} variant="outline">
                                <Award className="mr-1 h-3 w-3" />
                                Tier {candidate.tier}
                              </Badge>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {candidate.overallScore}
                                </div>
                                <div className="text-xs text-muted-foreground">Score</div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {candidate.candidate.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{candidate.candidate.location}</span>
                              </div>
                            )}
                            {candidate.candidate.yearsOfExperience && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Briefcase className="w-4 h-4" />
                                <span>{candidate.candidate.yearsOfExperience} years</span>
                              </div>
                            )}
                            {candidate.candidate.education &&
                              candidate.candidate.education.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <GraduationCap className="w-4 h-4" />
                                  <span className="truncate">
                                    {candidate.candidate.education[0].degree}
                                  </span>
                                </div>
                              )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span className="truncate" style={{ userSelect: 'text' }}>{candidate.candidate.email}</span>
                            </div>
                          </div>

                          {/* Matched Skills */}
                          {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Matched Skills:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {candidate.matchedSkills.slice(0, 8).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.matchedSkills.length > 8 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{candidate.matchedSkills.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Strengths & Concerns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {candidate.strengths && candidate.strengths.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Key Strengths
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {candidate.strengths.slice(0, 2).map((strength, idx) => (
                                    <li key={idx}>• {strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {candidate.concerns && candidate.concerns.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Concerns
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {candidate.concerns.slice(0, 2).map((concern, idx) => (
                                    <li key={idx}>• {concern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div 
                            className="flex gap-2 pt-3 border-t"
                            onClick={(e) => {
                              // Stop all clicks in action area from bubbling to Card
                              e.stopPropagation();
                            }}
                          >
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/employer/candidates/${candidate.candidateId}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Download CV
                                toast({
                                  title: "Download CV",
                                  description: "CV download feature coming soon",
                                });
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download CV
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                                // Prevent all default behaviors and event propagation
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Get candidate ID - handle different response structures
                                // candidateId could be:
                                // 1. String (direct ID)
                                // 2. Object with _id property (from populate)
                                // 3. In candidate._id field
                                let candidateIdToUse: string | null = null;
                                
                                if (typeof candidate.candidateId === 'string') {
                                  candidateIdToUse = candidate.candidateId;
                                } else if (candidate.candidateId && typeof candidate.candidateId === 'object' && (candidate.candidateId as any)?._id) {
                                  candidateIdToUse = (candidate.candidateId as any)._id.toString();
                                } else if ((candidate.candidate as any)?._id) {
                                  candidateIdToUse = (candidate.candidate as any)._id.toString();
                                } else if (candidate._id) {
                                  candidateIdToUse = candidate._id.toString();
                                }
                                
                                if (!candidateIdToUse) {
                                  console.error('Candidate ID not found:', candidate);
                                  toast({
                                    title: "Lỗi",
                                    description: "Không tìm thấy ID ứng viên",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                try {
                                  const response = await nlpService.inviteCandidate(jobId, {
                                    candidateId: candidateIdToUse,
                                  });
                                  
                                  if (response.success) {
                                    toast({
                                      title: "✅ Đã gửi email mời ứng tuyển",
                                      description: `Email đã được gửi đến ${candidate.candidate?.email || candidate.candidate?.name || 'ứng viên'}`,
                                    });
                                  } else {
                                    toast({
                                      title: "Lỗi",
                                      description: response.message || "Không thể gửi email",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error: any) {
                                  console.error("Error inviting candidate:", error);
                                  toast({
                                    title: "Lỗi",
                                    description: error?.response?.data?.message || error?.message || "Không thể gửi email. Vui lòng thử lại.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Mời ứng tuyển
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Candidate Details */}
            {selectedCandidate && (
              <MatchScoreCard
                score={selectedCandidate.overallScore}
                tier={selectedCandidate.tier}
                breakdown={selectedCandidate.breakdown}
                strengths={selectedCandidate.strengths}
                concerns={selectedCandidate.concerns}
              />
            )}

            {/* Job Info */}
            {job && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.type}</p>
                  </div>

                  {job.location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  {job.salary && (
                    <div className="flex items-start gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>
                        ${job.salary.min?.toLocaleString()} - $
                        {job.salary.max?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Required Skills:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 10).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => router.push(`/employer/jobs/${jobId}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Job Details
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Interview Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Interview Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Focus on top 20% candidates (Tier A & B)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Review matched skills and experience carefully</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Address concerns early in the interview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use AI-generated interview questions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Candidate Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Candidates</span>
                    <span className="font-semibold">{candidates.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tier A</span>
                    <span className="font-semibold text-green-700">
                      {candidates.filter((c) => c.tier === "A").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tier B</span>
                    <span className="font-semibold text-blue-700">
                      {candidates.filter((c) => c.tier === "B").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Score</span>
                    <span className="font-semibold">
                      {(
                        candidates.reduce((acc, c) => acc + c.overallScore, 0) /
                        candidates.length
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
