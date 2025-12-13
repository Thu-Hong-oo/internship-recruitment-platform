"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Briefcase,
  Star,
  GraduationCap,
  Target,
} from "lucide-react";

interface RadarChartProps {
  score: number;
  tier?: "A" | "B" | "C" | "D";
  breakdown?: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    projectsScore?: number;
  };
  className?: string;
}

const tierConfig = {
  A: {
    label: "Xuất sắc",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  B: {
    label: "Tốt",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  C: {
    label: "Khá",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  D: {
    label: "Yếu",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

// Custom tick component with icons
const CustomTick = ({ payload, x, y, textAnchor, icon: IconComponent }: any) => {
  const isLeft = x < 0;
  const isTop = y < 0;
  const textOffset = IconComponent ? (isLeft ? -8 : 15) : 0;
  
  // Calculate text width to prevent clipping
  const textLength = payload.value?.length || 0;
  const estimatedWidth = textLength * 7; // Approximate width per character
  
  return (
    <g transform={`translate(${x},${y})`}>
      {IconComponent && (
        <foreignObject 
          x={isLeft ? -30 : -10} 
          y={isTop ? -12 : -2} 
          width={20} 
          height={20}
        >
          <div className="flex items-center justify-center w-5 h-5 text-green-600">
            <IconComponent className="w-4 h-4" />
          </div>
        </foreignObject>
      )}
      <text
        x={textOffset}
        y={5}
        textAnchor={textAnchor}
        fill="#059669"
        fontSize={12}
        fontWeight={500}
        className="fill-emerald-700"
      >
        {payload.value}
      </text>
    </g>
  );
};

export function RadarChart({
  score,
  tier,
  breakdown,
  className = "",
}: RadarChartProps) {
  const tierValue: "A" | "B" | "C" | "D" =
    tier || (score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D");
  const config = tierConfig[tierValue];

  // Prepare data for radar chart with icons
  const chartData = [
    {
      subject: "Vị trí công việc",
      value: breakdown?.skillsScore || 0,
      fullMark: 100,
      icon: Briefcase,
    },
    {
      subject: "Kinh nghiệm",
      value: breakdown?.experienceScore || 0,
      fullMark: 100,
      icon: Star,
    },
    {
      subject: "Định hướng",
      value: breakdown?.educationScore || 0,
      fullMark: 100,
      icon: GraduationCap,
    },
    {
      subject: "Yếu tố khác",
      value: breakdown?.projectsScore || score || 0,
      fullMark: 100,
      icon: Target,
    },
  ];

  return (
    <Card className={`${className} bg-white border-slate-200`}>
      <CardHeader className="pb-3 border-b border-slate-200">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Điểm phù hợp</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{score}%</span>
            <Badge className={`${config.bgColor} ${config.color} font-semibold border ${config.borderColor}`}>
              {config.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart
              data={chartData}
              margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            >
              <PolarGrid 
                stroke="#e5e7eb" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={(props) => {
                  const dataIndex = chartData.findIndex(
                    (d) => d.subject === props.payload.value
                  );
                  const icon = chartData[dataIndex]?.icon;
                  return (
                    <CustomTick
                      {...props}
                      icon={icon}
                    />
                  );
                }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Điểm phù hợp"
                dataKey="value"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ fill: "#fbbf24", r: 5, strokeWidth: 2, stroke: "#10b981" }}
              />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats below chart */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
          <div className="text-slate-600 text-xs sm:text-sm">
            Điểm được tính dựa trên tổng hợp các yếu tố
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-green-600 font-semibold text-lg">
                {Math.round(score)}%
              </div>
              <div className="text-slate-500 text-xs">Tổng điểm</div>
            </div>
            {breakdown && (
              <div className="text-right">
                <div className="text-green-600 font-semibold text-lg">
                  {Math.round(
                    (breakdown.skillsScore +
                      breakdown.experienceScore +
                      breakdown.educationScore +
                      (breakdown.projectsScore || 0)) /
                      4
                  )}%
                </div>
                <div className="text-slate-500 text-xs">Trung bình</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

