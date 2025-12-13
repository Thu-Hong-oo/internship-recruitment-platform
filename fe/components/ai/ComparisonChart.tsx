"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ComparisonChartProps {
  score: number;
  tier?: "A" | "B" | "C" | "D";
  breakdown?: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    projectsScore?: number;
  };
  className?: string;
  showLabel?: boolean;
  compact?: boolean; // For job cards
}

const tierConfig = {
  A: {
    label: "Xuất sắc",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    progressColor: "bg-green-500",
  },
  B: {
    label: "Tốt",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    progressColor: "bg-blue-500",
  },
  C: {
    label: "Khá",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    progressColor: "bg-yellow-500",
  },
  D: {
    label: "Trung bình",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    progressColor: "bg-orange-500",
  },
};

const categoryLabels: Record<string, string> = {
  skillsScore: "Kỹ năng",
  experienceScore: "Kinh nghiệm",
  educationScore: "Học vấn",
  projectsScore: "Dự án",
};

export function ComparisonChart({
  score,
  tier,
  breakdown,
  className = "",
  showLabel = true,
  compact = false,
}: ComparisonChartProps) {
  const tierValue: "A" | "B" | "C" | "D" =
    tier || (score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D");
  const config = tierConfig[tierValue];

  if (compact) {
    // Compact version for job cards - just show circular progress
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              className={config.progressColor}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${config.color}`}>
              {Math.round(score)}%
            </span>
          </div>
        </div>
        {showLabel && (
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Điểm phù hợp</div>
            <Badge
              variant="outline"
              className={`${config.bgColor} ${config.color} ${config.borderColor} text-xs px-2 py-0`}
            >
              {config.label}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Full version with breakdown chart
  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="text-3xl font-bold">{Math.round(score)}%</div>
            <Badge
              className={`${config.bgColor} ${config.color} ${config.borderColor} font-semibold`}
            >
              {config.label}
            </Badge>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Breakdown Chart - Bar chart style */}
        {breakdown && (
          <div className="space-y-3 pt-2 border-t">
            {Object.entries(breakdown)
              .filter(([_, value]) => value !== undefined)
              .map(([key, value]) => {
                const label = categoryLabels[key] || key;
                const percentage = Math.round(value);
                
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.progressColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

