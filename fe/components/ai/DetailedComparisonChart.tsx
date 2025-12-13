"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface DetailedComparisonChartProps {
  score: number;
  tier?: "A" | "B" | "C" | "D";
  breakdown?: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    projectsScore?: number;
  };
  strengths?: string[];
  concerns?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  className?: string;
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

export function DetailedComparisonChart({
  score,
  tier,
  breakdown,
  strengths,
  concerns,
  matchedSkills,
  missingSkills,
  className = "",
}: DetailedComparisonChartProps) {
  const tierValue: "A" | "B" | "C" | "D" =
    tier || (score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D");
  const config = tierConfig[tierValue];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Match Score</span>
          <Badge
            className={`${config.bgColor} ${config.color} ${config.borderColor} font-bold`}
          >
            Tier {tierValue}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{Math.round(score)}%</div>
          <p className={`text-sm ${config.color} font-semibold`}>
            {config.label}
          </p>
          <Progress value={score} className="mt-4 h-3" />
        </div>

        {/* Breakdown Chart - Bar chart style (like TopCV) */}
        {breakdown && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Score Breakdown</h4>
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

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {strengths.map((strength, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {concerns && concerns.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {concerns.map((concern, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

