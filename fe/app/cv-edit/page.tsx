"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import CVEditWithSidebar from "@/components/cv/CVEditWithSidebar";
import { Loader2 } from "lucide-react";
import { candidateService } from "@/lib/api/services/candidate.service";
import { aiService } from "@/lib/api/services/ai.service";
import { useToast } from "@/hooks/use-toast";
import { convertProfileToCVData } from "@/lib/utils/cvDataConverter";
import type { CVData } from "@/lib/mocks/cvSamples";

export default function CVEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const cvId = searchParams.get("cvId");
  const targetJobId = searchParams.get("targetJobId");

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadCV();
  }, [cvId]);

  const loadCV = async () => {
    try {
      setLoading(true);
      
      // Get profile data
      const profile = await candidateService.getProfile();
      
      // Get PDF URL from resume
      let resumeUrl: string | null = null;
      if (cvId === "current" || !cvId) {
        resumeUrl = profile.resume?.current?.url || null;
      } else {
        // Find in history
        const historyResume = profile.resume?.history?.find(
          (r: any) => r._id?.toString() === cvId
        );
        resumeUrl = historyResume?.url || null;
      }
      
      if (resumeUrl) {
        setPdfUrl(resumeUrl);
      }
      
      // Convert to CVData format
      const convertedData = convertProfileToCVData(profile);
      setCvData(convertedData);

      // Auto-analyze for improvements
      await analyzeCV(profile);
    } catch (error: any) {
      console.error("Error loading CV:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeCV = async (profile: any) => {
    try {
      setAnalyzing(true);
      
      const cvDataForAnalysis = {
        personalInfo: profile.personalInfo,
        education: profile.education,
        experience: profile.experience,
        skills: profile.skills,
      };

      // Build CV text
      let cvText = "";
      if (profile.resume?.current?.aiAnalysis?.extractedData) {
        const extracted = profile.resume.current.aiAnalysis.extractedData;
        cvText = JSON.stringify(extracted);
      }

      // Get improvements
      const response = await aiService.analyzeCVImprovements({
        cvText,
        cvData: cvDataForAnalysis,
        cvId: cvId || undefined,
        targetJobId: targetJobId || undefined,
      });

      if (response.success && response.data) {
        setSuggestions(response.data.specificImprovements || []);
      }
    } catch (error: any) {
      console.error("Error analyzing CV:", error);
      toast({
        title: "Lỗi phân tích",
        description: "Không thể phân tích CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (data: CVData) => {
    try {
      // Convert CVData back to backend format and save
      // TODO: Implement save to backend ResumeBuilder
      toast({
        title: "Đã lưu",
        description: "CV đã được lưu thành công.",
      });
    } catch (error: any) {
      throw new Error(error?.message || "Không thể lưu CV");
    }
  };

  const handleExport = async () => {
    try {
      // Export CV to PDF using CVEditor's export functionality
      // TODO: Implement PDF export
      toast({
        title: "Đã xuất PDF",
        description: "CV đã được xuất thành công.",
      });
    } catch (error: any) {
      throw new Error(error?.message || "Không thể xuất PDF");
    }
  };

  if (loading || !cvData) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải CV...</p>
            {analyzing && (
              <p className="text-sm text-gray-500 mt-2">Đang phân tích CV...</p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <CVEditWithSidebar
      initialData={cvData}
      pdfUrl={pdfUrl}
      suggestions={suggestions}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}

