"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SkillGapChartProps {
  currentSkills: string[];
  requiredSkills: string[];
  skillGaps: {
    critical: string[];
    important: string[];
    optional: string[];
  };
  matchScore?: number;
  recommendations?: string[];
  className?: string;
}

export function SkillGapChart({
  currentSkills,
  requiredSkills,
  skillGaps,
  matchScore,
  recommendations,
  className = "",
}: SkillGapChartProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "critical"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const gapSections = [
    {
      key: "critical",
      title: "Kỹ năng quan trọng (Critical)",
      icon: AlertTriangle,
      skills: skillGaps.critical,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      key: "important",
      title: "Kỹ năng ưu tiên (Important)",
      icon: AlertCircle,
      skills: skillGaps.important,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      key: "optional",
      title: "Kỹ năng bổ sung (Optional)",
      icon: Info,
      skills: skillGaps.optional,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  return (
    <Card className={`border border-slate-100 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
              Phân tích khoảng cách kỹ năng
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              So sánh kỹ năng hiện tại với yêu cầu từ tin tuyển dụng.
            </p>
          </div>
          {matchScore !== undefined && (
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100">
                <span className="text-xl font-bold text-blue-700">
                  {matchScore}
                </span>
                <span className="text-[10px] text-muted-foreground absolute bottom-1">
                  % phù hợp
                </span>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                Mức phù hợp tổng thể
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-100">
            <div className="text-3xl font-extrabold text-emerald-700">
              {currentSkills.length}
            </div>
            <div className="text-xs mt-1 text-emerald-900 font-medium">
              Kỹ năng hiện tại
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100">
            <div className="text-3xl font-extrabold text-blue-700">
              {requiredSkills.length}
            </div>
            <div className="text-xs mt-1 text-blue-900 font-medium">
              Kỹ năng yêu cầu
            </div>
          </div>
        </div>

        {/* Skill Gaps by Category */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">
            Kỹ năng cần phát triển
          </h4>
          {gapSections.map((section) => {
            if (section.skills.length === 0) return null;
            const isExpanded = expandedSection === section.key;
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className={`border ${section.borderColor} rounded-lg overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full p-4 flex items-center justify-between ${section.bgColor} hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <span className="font-semibold">{section.title}</span>
                    <Badge variant="outline">{section.skills.length}</Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="flex flex-wrap gap-2">
                      {section.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="font-semibold text-sm">Gợi ý cải thiện</h4>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                >
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <Button className="w-full" size="lg">
          Tạo lộ trình học tập
        </Button>
      </CardContent>
    </Card>
  );
}
