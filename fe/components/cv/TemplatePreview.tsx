"use client";

import { type CVTemplate } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Loader2, Palette } from "lucide-react";

interface TemplatePreviewProps {
  template: CVTemplate;
  onGenerate: (template: CVTemplate) => void;
  isGenerating?: boolean;
  isPopular?: boolean;
}

const categoryColors = {
  general: "bg-blue-100 text-blue-800 border-blue-200",
  technology: "bg-green-100 text-green-800 border-green-200",
  business: "bg-purple-100 text-purple-800 border-purple-200",
  design: "bg-pink-100 text-pink-800 border-pink-200",
  executive: "bg-gray-100 text-gray-800 border-gray-200",
  traditional: "bg-yellow-100 text-yellow-800 border-yellow-200",
  healthcare: "bg-emerald-100 text-emerald-800 border-emerald-200",
  education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  marketing: "bg-red-100 text-red-800 border-red-200",
} as const;

const styleColors = {
  modern: "bg-gradient-to-r from-blue-500 to-purple-600",
  classic: "bg-gradient-to-r from-gray-600 to-gray-800",
  creative: "bg-gradient-to-r from-pink-500 to-red-500",
  minimal: "bg-gradient-to-r from-purple-500 to-indigo-600",
  executive: "bg-gradient-to-r from-gray-700 to-blue-800",
  professional: "bg-gradient-to-r from-green-500 to-teal-600",
} as const;

export default function TemplatePreview({
  template,
  onGenerate,
  isGenerating = false,
  isPopular = false,
}: TemplatePreviewProps) {
  const primaryColor = "oklch(0.65 0.18 195)";
  const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, oklch(0.78 0.09 210) 55%, oklch(0.9 0.04 195) 100%)`;
  const cardAuraGradient =
    "radial-gradient(circle at top, oklch(0.65 0.18 195 / 0.4) 0%, transparent 65%)";
  const glassSurfaceGradient =
    "linear-gradient(140deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)";
  const highlightOverlay =
    "linear-gradient(135deg, oklch(0.65 0.18 195 / 0.12) 0%, transparent 70%)";

  const getCategoryColor = (category: string) => {
    return (
      categoryColors[category as keyof typeof categoryColors] ||
      categoryColors.general
    );
  };

  const getStyleColor = (style: string) => {
    return styleColors[style as keyof typeof styleColors] || styleColors.modern;
  };

  return (
    <Card
      className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_32px_75px_rgba(15,45,95,0.18)]"
      style={{ background: glassSurfaceGradient }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: highlightOverlay }}
      />
      <span
        className="pointer-events-none absolute -top-32 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full blur-3xl opacity-40"
        style={{ background: cardAuraGradient }}
      />

      <CardContent className="relative p-6">
        {/* Template Preview */}
        <div className="mb-4 flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: template.colors?.primary || "#2563eb" }}
            />
            <div
              className="h-6 w-6 rounded"
              style={{
                backgroundColor: template.colors?.secondary || "#64748b",
              }}
            />
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: template.colors?.accent || "#10b981" }}
            />
          </div>
        </div>

        {/* Template Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {template.name}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {template.description}
              </p>
            </div>
            {isPopular && (
              <Badge className="border-none bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
                <Star className="mr-1 h-3 w-3 fill-white" />
                Phổ biến
              </Badge>
            )}
          </div>

          {/* Category and Style */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
              {template.category}
            </Badge>
            <Badge
              className={`text-xs text-white ${getStyleColor(template.style)}`}
            >
              {template.style}
            </Badge>
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3 text-slate-500" />
              <p className="text-xs font-medium text-slate-500">
                Color Palette:
              </p>
            </div>
            <div className="flex gap-2">
              <div
                className="h-4 w-4 rounded-full border border-white shadow-sm"
                style={{
                  backgroundColor: template.colors?.primary || "#2563eb",
                }}
                title="Primary"
              />
              <div
                className="h-4 w-4 rounded-full border border-white shadow-sm"
                style={{
                  backgroundColor: template.colors?.secondary || "#64748b",
                }}
                title="Secondary"
              />
              <div
                className="h-4 w-4 rounded-full border border-white shadow-sm"
                style={{
                  backgroundColor: template.colors?.accent || "#10b981",
                }}
                title="Accent"
              />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Sections:</p>
            <div className="flex flex-wrap gap-1">
              {template.sections.slice(0, 3).map((section) => (
                <Badge key={section} variant="outline" className="text-xs">
                  {section}
                </Badge>
              ))}
              {template.sections.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.sections.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => onGenerate(template)}
            disabled={isGenerating}
            className="w-full rounded-xl bg-[#007b91] text-white shadow-inner shadow-[oklch(0.65_0.18_195/.35)] transition-all duration-300 hover:bg-[oklch(0.65_0.18_195)] disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tạo CV với template này
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
