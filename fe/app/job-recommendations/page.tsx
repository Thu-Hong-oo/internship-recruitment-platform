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
  const [minScore, setMinScore] = useState(60);

  useEffect(() => {
    fetchJobRecommendations();
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

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Job Recommendations</h1>
          </div>
          <p className="text-muted-foreground">
            Personalized job matches based on your skills and experience
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="A">Tier A (Excellent)</SelectItem>
                  <SelectItem value="B">Tier B (Good)</SelectItem>
                  <SelectItem value="C">Tier C (Fair)</SelectItem>
                  <SelectItem value="D">Tier D (Low)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select
                  value={minScore.toString()}
                  onValueChange={(value) => setMinScore(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">Min Score: 50%</SelectItem>
                    <SelectItem value="60">Min Score: 60%</SelectItem>
                    <SelectItem value="70">Min Score: 70%</SelectItem>
                    <SelectItem value="80">Min Score: 80%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}{" "}
                found
              </p>
              <Button onClick={fetchJobRecommendations} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  No Jobs Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or update your profile
                </p>
                <Button onClick={() => router.push("/profile")}>
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredJobs.map((item) => (
                <Card key={item.jobId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">
                              {item.job.title}
                            </h3>
                            <p className="text-muted-foreground">
                              {item.job.company}
                            </p>
                          </div>
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
                            {item.overallScore}% Match
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.job.location}
                          </span>
                          {item.job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {item.job.salary.min.toLocaleString()} -{" "}
                              {item.job.salary.max.toLocaleString()}{" "}
                              {item.job.salary.currency}
                            </span>
                          )}
                        </div>

                        {/* Matched Skills */}
                        {item.matchedSkills && item.matchedSkills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">
                              Matched Skills:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.matchedSkills.slice(0, 5).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                              {item.matchedSkills.length > 5 && (
                                <Badge variant="outline">
                                  +{item.matchedSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewJob(item.job._id)}
                            size="sm"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleGenerateRoadmap(item.job._id)}
                            variant="outline"
                            size="sm"
                          >
                            Generate Roadmap
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
