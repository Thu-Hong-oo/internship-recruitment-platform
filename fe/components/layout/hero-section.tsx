"use client";

import React from "react";
import JobFilters, {
  JobFilters as JobFiltersType,
} from "@/components/jobs/JobFilters";

interface HeroSectionProps {
  onSearch?: (keyword: string) => void;
  onFiltersChange?: (filters: JobFiltersType) => void;
  filters?: JobFiltersType;
}

export default function HeroSection({
  onSearch,
  onFiltersChange,
  filters = {},
}: HeroSectionProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white py-20">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, oklch(0.60 0.12 195) 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.60_0.12_195/.2)_0%,transparent_70%)]" />
          <div
            className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.60_0.12_195/.25),transparent_70%)] blur-3xl"
            style={{ animation: "float 20s ease-in-out infinite" }}
          />
          <div
            className="pointer-events-none absolute right-[-120px] bottom-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.08_210/.2),transparent_75%)] blur-3xl"
            style={{ animation: "float 25s ease-in-out infinite reverse" }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              Công cụ tìm việc làm riêng cho intern
            </h1>
            <p className="text-xl md:text-2xl opacity-95 font-medium max-w-3xl mx-auto leading-relaxed">
              Dễ dàng tìm chỗ thực tập, gợi ý định hướng việc làm cho sinh viên
              và nguồn nhân lực mới, dữ liệu phân tích realtime
            </p>
          </div>

          {/* Job Filters */}
          <div className="max-w-5xl mx-auto px-4">
            <JobFilters
              filters={filters}
              onChange={onFiltersChange}
              onReset={() => onFiltersChange?.({})}
              className="shadow-[0_30px_80px_rgba(15,45,95,0.25)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
