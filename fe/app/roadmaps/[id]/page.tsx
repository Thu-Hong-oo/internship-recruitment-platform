"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Map,
  Target,
  CheckCircle2,
  Clock,
  PlayCircle,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  Star,
  MessageSquare,
  ArrowLeft,
  Play,
  Pause,
} from "lucide-react";
import { ProgressTracker } from "@/components/ai/ProgressTracker";
import { nlpService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { LearningRoadmap, LearningResource } from "@/lib/api/services/nlp.service";

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const roadmapId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [recommendedResources, setRecommendedResources] = useState<LearningResource[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (roadmapId) {
      fetchRoadmap();
      fetchRecommendedResources();
    }
  }, [roadmapId]);

  const fetchRoadmap = async () => {
    setIsLoading(true);
    try {
      const response = await nlpService.getLearningRoadmap(roadmapId);
      setRoadmap(response.data);
    } catch (error) {
      console.error("Failed to fetch roadmap:", error);
      toast({
        title: "Error",
        description: "Failed to load roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedResources = async () => {
    try {
      const response = await nlpService.getRecommendedResources(roadmapId);
      setRecommendedResources(response.data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    }
  };

  const handleToggleWeek = async (weekNumber: number) => {
    if (!roadmap) return;

    try {
      const isCompleted = roadmap.progress.completedWeeks >= weekNumber;
      await nlpService.updateRoadmapProgress(roadmapId, {
        weekNumber,
        completed: !isCompleted,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Progress Updated",
        description: `Week ${weekNumber} marked as ${!isCompleted ? "completed" : "incomplete"}`,
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleResource = async (resourceId: string, completed: boolean) => {
    try {
      await nlpService.updateRoadmapProgress(roadmapId, {
        resourceId,
        completed: !completed,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Resource Updated",
        description: `Resource marked as ${!completed ? "completed" : "incomplete"}`,
      });
    } catch (error) {
      console.error("Failed to update resource:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update resource status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await nlpService.submitRoadmapFeedback(roadmapId, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      
      await fetchRoadmap();
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      
      setShowFeedbackDialog(false);
      setFeedbackRating(0);
      setFeedbackComment("");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      case "course":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "paused":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!roadmap) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Roadmap Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The requested roadmap could not be found
                </p>
                <Button onClick={() => router.push("/roadmaps")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Roadmaps
                </Button>
              </div>
            </CardContent>
          </Card>
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
            onClick={() => router.push("/roadmaps")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmaps
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">{roadmap.targetRole}</h1>
                <Badge className={getStatusColor(roadmap.status)}>
                  {roadmap.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {roadmap.timeframe} weeks • {roadmap.phases.length} phases •{" "}
                {roadmap.phases.reduce((acc, phase) => acc + phase.resources.length, 0)} resources
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Feedback</DialogTitle>
                    <DialogDescription>
                      Help us improve your learning experience
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFeedbackRating(rating)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                rating <= feedbackRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Comments (Optional)</Label>
                      <Textarea
                        id="feedback"
                        placeholder="Share your thoughts..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={feedbackRating === 0 || isSubmittingFeedback}
                      className="w-full"
                    >
                      {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            <ProgressTracker
              totalWeeks={roadmap.progress.totalWeeks}
              completedWeeks={roadmap.progress.completedWeeks}
              totalResources={roadmap.progress.totalResources}
              completedResources={roadmap.progress.completedResources}
              currentPhase={roadmap.progress.currentPhase}
              phases={roadmap.phases.map((phase) => ({
                name: phase.name,
                status:
                  phase.phaseNumber < roadmap.progress.currentPhase
                    ? "completed"
                    : phase.phaseNumber === roadmap.progress.currentPhase
                    ? "current"
                    : "pending",
              }))}
            />

            {/* Phases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-600" />
                  Learning Phases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {roadmap.phases.map((phase) => (
                    <AccordionItem key={phase.phaseNumber} value={`phase-${phase.phaseNumber}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          {phase.phaseNumber < roadmap.progress.currentPhase ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : phase.phaseNumber === roadmap.progress.currentPhase ? (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-semibold">
                              Phase {phase.phaseNumber}: {phase.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Week {phase.weekRange.start} - {phase.weekRange.end} •{" "}
                              {phase.resources.length} resources
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">{phase.description}</p>

                          {/* Milestones */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Milestones</h4>
                            <ul className="space-y-2">
                              {phase.milestones.map((milestone, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span>{milestone}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Resources */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Resources</h4>
                            <div className="space-y-2">
                              {phase.resources.map((resource) => (
                                <div
                                  key={resource._id}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={resource.completed}
                                    onChange={() =>
                                      handleToggleResource(resource._id, resource.completed)
                                    }
                                    className="w-4 h-4 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {getResourceIcon(resource.type)}
                                      <span className="font-medium text-sm">{resource.title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {resource.description}
                                    </p>
                                    {resource.estimatedTime && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {resource.estimatedTime}
                                      </p>
                                    )}
                                  </div>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Week Tracker */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Weekly Progress</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(
                                { length: phase.weekRange.end - phase.weekRange.start + 1 },
                                (_, i) => phase.weekRange.start + i
                              ).map((week) => (
                                <button
                                  key={week}
                                  onClick={() => handleToggleWeek(week)}
                                  className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-colors ${
                                    week <= roadmap.progress.completedWeeks
                                      ? "bg-green-100 border-green-600 text-green-700"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  {week}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Feedback */}
            {roadmap.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Your Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`w-5 h-5 ${
                            rating <= roadmap.feedback!.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {roadmap.feedback.comment && (
                      <p className="text-sm text-muted-foreground">{roadmap.feedback.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(roadmap.feedback.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Resources */}
            {recommendedResources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendedResources.slice(0, 5).map((resource) => (
                      <a
                        key={resource._id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {getResourceIcon(resource.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{resource.title}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {resource.description}
                            </p>
                            {resource.estimatedTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {resource.estimatedTime}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/skill-gap-analysis")}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Analyze Skill Gaps
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/job-recommendations")}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Find Matching Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
