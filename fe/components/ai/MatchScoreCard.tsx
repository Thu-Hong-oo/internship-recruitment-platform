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

interface MatchScoreCardProps {
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
  className?: string;
}

const tierConfig = {
  A: {
    label: "Excellent Match",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  B: {
    label: "Good Match",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  C: {
    label: "Fair Match",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
  },
  D: {
    label: "Low Match",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
};

export function MatchScoreCard({
  score,
  tier,
  breakdown,
  strengths,
  concerns,
  className = "",
}: MatchScoreCardProps) {
  const tierValue: "A" | "B" | "C" | "D" =
    tier ||
    (score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D");
  const config = tierConfig[tierValue];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Match Score</span>
          <Badge className={`${config.bgColor} ${config.textColor} font-bold`}>
            Tier {tierValue}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{score}%</div>
          <p className={`text-sm ${config.textColor}`}>{config.label}</p>
          <Progress value={score} className="mt-4 h-3" />
        </div>

        {/* Breakdown Scores */}
        {breakdown && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Score Breakdown</h4>
            {Object.entries(breakdown).map(([key, value]) => {
              if (value === undefined) return null;
              const label = key
                .replace("Score", "")
                .replace(/([A-Z])/g, " $1")
                .trim();
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{label}</span>
                    <span className="font-semibold">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
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
