"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  PenTool,
  Search,
  TrendingUp,
  ArrowRight,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

interface CVAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId?: string;
}

interface CVImprovements {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: {
    structure: string[];
    content: string[];
    writing: string[];
    keywords: string[];
  };
  specificImprovements: Array<{
    section: string;
    item: string;
    current: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
  }>;
}

export default function CVAnalysisModal({
  open,
  onOpenChange,
  cvId,
}: CVAnalysisModalProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVImprovements | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (!analysis) {
        handleAnalyze();
      }
    } else {
      // Reset when modal closes
      setAnalysis(null);
      setError(null);
    }
  }, [open]);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);

      const response = await apiClient.post<{
        success: boolean;
        data: CVImprovements;
      }>("/ai/analyze-cv-improvements", {
        cvId,
      });

      if (response.success && response.data) {
        setAnalysis(response.data);
      } else {
        throw new Error("Failed to analyze CV");
      }
    } catch (err: any) {
      console.error("CV analysis error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể phân tích CV. Vui lòng thử lại sau."
      );
      toast({
        title: "Lỗi",
        description: "Không thể phân tích CV. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Phân tích và cải thiện CV
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Nhận gợi ý thông minh để viết CV hay hơn và thu hút nhà tuyển
                dụng
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Đang phân tích CV của bạn...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Điểm đánh giá tổng thể
                  </h3>
                  <p className="text-sm text-gray-600">
                    CV của bạn đạt{" "}
                    <span className="font-semibold">
                      {Math.round(analysis.overallScore)}/100 điểm
                    </span>
                  </p>
                </div>
                <div className="relative">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold ${getScoreColor(
                      analysis.overallScore
                    )}`}
                  >
                    {Math.round(analysis.overallScore)}
                  </div>
                  <div
                    className={`absolute inset-0 rounded-full ${getScoreBgColor(
                      analysis.overallScore
                    )} opacity-10`}
                  />
                </div>
              </div>
              <Progress
                value={analysis.overallScore}
                className="mt-4 h-3"
              />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {analysis.strengths.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900">
                      Điểm mạnh
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="text-sm text-emerald-800 flex items-start gap-2"
                      >
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.weaknesses.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">
                      Cần cải thiện
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li
                        key={index}
                        className="text-sm text-amber-800 flex items-start gap-2"
                      >
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggestions Tabs */}
            <Tabs defaultValue="structure" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="structure" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cấu trúc
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Nội dung
                </TabsTrigger>
                <TabsTrigger value="writing" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Cách viết
                </TabsTrigger>
                <TabsTrigger value="keywords" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Từ khóa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="structure" className="space-y-3 mt-4">
                {analysis.suggestions.structure.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.suggestions.structure.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Không có gợi ý về cấu trúc. CV của bạn có cấu trúc tốt!
                  </div>
                )}
              </TabsContent>

              <TabsContent value="content" className="space-y-3 mt-4">
                {analysis.suggestions.content.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.suggestions.content.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Nội dung CV của bạn đã tốt!
                  </div>
                )}
              </TabsContent>

              <TabsContent value="writing" className="space-y-3 mt-4">
                {analysis.suggestions.writing.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.suggestions.writing.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Cách viết CV của bạn đã tốt!
                  </div>
                )}
              </TabsContent>

              <TabsContent value="keywords" className="space-y-3 mt-4">
                {analysis.suggestions.keywords.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.suggestions.keywords.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    CV của bạn đã được tối ưu tốt cho ATS!
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Specific Improvements */}
            {analysis.specificImprovements.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">
                    Gợi ý cải thiện cụ thể
                  </h4>
                </div>
                <div className="space-y-4">
                  {analysis.specificImprovements.map((improvement, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`${getPriorityColor(
                                improvement.priority
                              )} text-xs font-semibold`}
                            >
                              {improvement.priority === "high"
                                ? "Ưu tiên cao"
                                : improvement.priority === "medium"
                                ? "Ưu tiên trung bình"
                                : "Ưu tiên thấp"}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">
                              {improvement.section}
                            </span>
                            <span className="text-sm text-gray-600">
                              - {improvement.item}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Hiện tại: {improvement.current}
                          </p>
                          <p className="text-sm text-gray-700">
                            {improvement.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Đóng
              </Button>
              <Button
                onClick={handleAnalyze}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Phân tích lại
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

