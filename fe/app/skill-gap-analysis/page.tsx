"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillGapChart } from "@/components/ai/SkillGapChart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Loader2,
  Search,
  FileText,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { aiService, jobService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SkillGapAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<"job" | "description">("job");
  
  // Job selection
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Job description input
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<{
    currentSkills: string[];
    requiredSkills: string[];
    skillGaps: {
      critical: string[];
      important: string[];
      optional: string[];
    };
    matchScore: number;
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId) {
      setAnalysisMethod("job");
      setSelectedJobId(jobId);
      handleAnalyzeByJobId(jobId);
    } else {
      loadRecentJobs();
    }
  }, []);

  const loadRecentJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await jobService.getJobs({
        page: 1,
        limit: 20,
        status: "active",
      });
      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      loadRecentJobs();
      return;
    }

    setIsLoadingJobs(true);
    try {
      const response = await jobService.getJobs({
        page: 1,
        limit: 20,
        q: searchQuery,
        status: "active",
      });
      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to search jobs:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleAnalyzeByJobId = async (jobId?: string) => {
    const targetJobId = jobId || selectedJobId;
    if (!targetJobId) {
      toast({
        title: "No Job Selected",
        description: "Please select a job to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeSkillGaps({
        jobId: targetJobId,
      });
      setAnalysisResult(response.data);
      toast({
        title: "Analysis Complete",
        description: "Your skill gap analysis is ready",
      });
    } catch (error) {
      console.error("Skill gap analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze skill gaps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeByDescription = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeSkillGaps({
        targetJobDescription: jobDescription,
        targetJobTitle: jobTitle,
        industry: industry || undefined,
      });
      setAnalysisResult(response.data);
      toast({
        title: "Analysis Complete",
        description: "Your skill gap analysis is ready",
      });
    } catch (error) {
      console.error("Skill gap analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze skill gaps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = () => {
    if (selectedJobId && analysisMethod === "job") {
      router.push(`/roadmaps?targetJobId=${selectedJobId}`);
    } else {
      router.push(`/roadmaps?targetRole=${encodeURIComponent(jobTitle)}`);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employer?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Identify the skills you need to develop for your target role
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select Target Job</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={analysisMethod} onValueChange={(v) => setAnalysisMethod(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="job">Select Job</TabsTrigger>
                    <TabsTrigger value="description">Enter Description</TabsTrigger>
                  </TabsList>

                  <TabsContent value="job" className="space-y-4">
                    {/* Search */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && searchJobs()}
                          className="pl-9"
                        />
                      </div>
                      <Button onClick={searchJobs} variant="outline">
                        Search
                      </Button>
                    </div>

                    {/* Job List */}
                    <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                      {isLoadingJobs ? (
                        <div className="space-y-2 p-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : filteredJobs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No jobs found</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredJobs.map((job) => (
                            <button
                              key={job._id}
                              onClick={() => setSelectedJobId(job._id)}
                              className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                                selectedJobId === job._id ? "bg-accent" : ""
                              }`}
                            >
                              <h4 className="font-semibold">{job.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.employer?.company?.name || "Unknown Company"}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {job.skills?.slice(0, 3).map((skill: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-secondary px-2 py-1 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleAnalyzeByJobId()}
                      disabled={!selectedJobId || isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Analyze Skill Gaps
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="description" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        placeholder="e.g., Senior Full Stack Developer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry (Optional)</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={10}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleAnalyzeByDescription}
                      disabled={!jobDescription.trim() || isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Analyze Skill Gaps
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {!analysisResult && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a job or enter a description to start analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult && (
              <>
                {/* Skill Gap Chart */}
                <SkillGapChart
                  currentSkills={analysisResult.currentSkills}
                  requiredSkills={analysisResult.requiredSkills}
                  skillGaps={analysisResult.skillGaps}
                  matchScore={analysisResult.matchScore}
                  recommendations={analysisResult.recommendations}
                />

                {/* Match Score Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Match Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Match</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {analysisResult.matchScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {analysisResult.currentSkills.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Your Skills
                          </div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {analysisResult.requiredSkills.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Required Skills
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-700">
                            {analysisResult.skillGaps.critical.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Critical</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-700">
                            {analysisResult.skillGaps.important.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Important</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-700">
                            {analysisResult.skillGaps.optional.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Optional</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-yellow-600 font-bold mt-0.5">
                              {index + 1}.
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleGenerateRoadmap} className="flex-1" size="lg">
                    Generate Learning Roadmap
                  </Button>
                  <Button
                    onClick={() => router.push("/job-recommendations")}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Find Matching Jobs
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
