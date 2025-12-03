"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { aiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CVAnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{
    extractedSkills: string[];
    experience: Array<{
      position: string;
      company: string;
      duration: string;
    }>;
    education: Array<{
      degree: string;
      major: string;
      school: string;
    }>;
    suggestions: string[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeCVFromFile(selectedFile);
      setAnalysisResult(response.data);
      toast({
        title: "CV Analyzed Successfully",
        description: "Your CV has been analyzed. Check the results below.",
      });
    } catch (error) {
      console.error("CV Analysis Error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!cvText.trim()) {
      toast({
        title: "Empty CV Text",
        description: "Please enter your CV text",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeCVFromText(cvText);
      setAnalysisResult(response.data);
      toast({
        title: "CV Analyzed Successfully",
        description: "Your CV text has been analyzed. Check the results below.",
      });
    } catch (error) {
      console.error("CV Analysis Error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze CV text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CV Analysis</h1>
          <p className="text-muted-foreground">
            Upload your CV or paste its content to get AI-powered analysis and
            insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upload Your CV</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="file" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="space-y-2">
                        <label htmlFor="cv-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </label>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOC, or DOCX (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        id="cv-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>

                    {selectedFile && (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Selected: {selectedFile.name}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleAnalyzeFile}
                      disabled={!selectedFile || isAnalyzing}
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
                          <FileText className="mr-2 h-4 w-4" />
                          Analyze CV
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <Textarea
                      placeholder="Paste your CV content here..."
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      rows={12}
                      className="resize-none"
                    />

                    <Button
                      onClick={handleAnalyzeText}
                      disabled={!cvText.trim() || isAnalyzing}
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
                          <FileText className="mr-2 h-4 w-4" />
                          Analyze Text
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
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Upload or paste your CV to see analysis results</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult && (
              <>
                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Extracted Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.extractedSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Experience */}
                {analysisResult.experience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.experience.map((exp, index) => (
                          <div key={index} className="border-l-2 pl-4">
                            <h4 className="font-semibold">{exp.position}</h4>
                            <p className="text-sm text-muted-foreground">
                              {exp.company} • {exp.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {analysisResult.education.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResult.education.map((edu, index) => (
                          <div key={index}>
                            <h4 className="font-semibold">{edu.degree}</h4>
                            <p className="text-sm text-muted-foreground">
                              {edu.major} • {edu.school}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                {analysisResult.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-yellow-600 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/job-recommendations")}
                    className="flex-1"
                  >
                    Get Job Recommendations
                  </Button>
                  <Button
                    onClick={() => router.push("/skill-gap-analysis")}
                    variant="outline"
                    className="flex-1"
                  >
                    Analyze Skill Gaps
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
