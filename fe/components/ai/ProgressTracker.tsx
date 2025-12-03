"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  totalWeeks: number;
  completedWeeks: number;
  totalResources: number;
  completedResources: number;
  currentPhase: number;
  phases: Array<{
    phaseNumber: number;
    title: string;
    duration: string;
    completed?: boolean;
  }>;
  className?: string;
}

export function ProgressTracker({
  totalWeeks,
  completedWeeks,
  totalResources,
  completedResources,
  currentPhase,
  phases,
  className = "",
}: ProgressTrackerProps) {
  const overallProgress = (completedWeeks / totalWeeks) * 100;
  const resourceProgress = (completedResources / totalResources) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Learning Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {completedWeeks} / {totalWeeks} weeks
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {overallProgress.toFixed(0)}% Complete
          </p>
        </div>

        {/* Resource Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Resources Completed</span>
            <span className="text-muted-foreground">
              {completedResources} / {totalResources}
            </span>
          </div>
          <Progress value={resourceProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {resourceProgress.toFixed(0)}% Complete
          </p>
        </div>

        {/* Phase Progress */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm">Phase Progress</h4>
          <div className="space-y-3">
            {phases.map((phase) => {
              const isCurrent = phase.phaseNumber === currentPhase;
              const isCompleted = phase.completed;
              const isPending = phase.phaseNumber > currentPhase;

              return (
                <div
                  key={phase.phaseNumber}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    isCurrent && "bg-blue-50 border border-blue-200",
                    isCompleted && "bg-green-50 border border-green-200",
                    isPending && "bg-gray-50 border border-gray-200"
                  )}
                >
                  <div className="mt-0.5">
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {isCurrent && (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                    {isPending && (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        Phase {phase.phaseNumber}: {phase.title}
                      </span>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-700"
                        >
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {phase.duration}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentPhase}
            </div>
            <div className="text-xs text-muted-foreground">Current Phase</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedWeeks}
            </div>
            <div className="text-xs text-muted-foreground">Weeks Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalWeeks - completedWeeks}
            </div>
            <div className="text-xs text-muted-foreground">Weeks Left</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
