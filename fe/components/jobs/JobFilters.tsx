"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, MapPin, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { industryService, Industry } from "@/lib/api";
import { getCities } from "@/lib/vietnamAddress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Constants
const JOB_LEVELS = [
  { value: "Intern", label: "Thực tập sinh" },
  { value: "Fresher", label: "Fresher" },
  { value: "Junior", label: "Junior" },
  { value: "Senior", label: "Senior" },
  { value: "Manager", label: "Manager" },
  { value: "Director", label: "Director" },
];

const JOB_TYPES = [
  { value: "Fulltime", label: "Toàn thời gian" },
  { value: "Parttime", label: "Bán thời gian" },
  { value: "Intern", label: "Thực tập" },
  { value: "Freelance", label: "Freelance" },
  { value: "Remote", label: "Làm việc từ xa" },
  { value: "Hybrid", label: "Kết hợp" },
];

const WORKING_MODES = [
  { value: "Onsite", label: "Tại văn phòng" },
  { value: "Remote", label: "Làm việc từ xa" },
  { value: "Hybrid", label: "Kết hợp" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Mới nhất" },
  { value: "updatedAt", label: "Cập nhật gần đây" },
  { value: "title", label: "Tiêu đề A-Z" },
  { value: "salaryMin", label: "Lương thấp đến cao" },
  { value: "salaryMax", label: "Lương cao đến thấp" },
  { value: "deadline", label: "Hạn nộp gần nhất" },
  { value: "views", label: "Lượt xem nhiều nhất" },
];

const SALARY_RANGES = [
  { value: "below-10m", label: "Dưới 10 triệu" },
  { value: "10m-20m", label: "10 - 20 triệu" },
  { value: "20m-50m", label: "20 - 50 triệu" },
  { value: "above-50m", label: "Trên 50 triệu" },
];

const POPULAR_SEARCHES = [
  "Frontend Developer",
  "Marketing",
  "Sales",
  "Kế toán",
  "Nhân sự",
  "Backend Developer",
  "UI/UX Designer",
  "Data Analyst",
];

// Helper mapping for salary ranges -> salaryMin / salaryMax (VND)
const SALARY_RANGE_BOUNDS: Record<string, { min?: number; max?: number }> = {
  "below-10m": { max: 10_000_000 },
  "10m-20m": { min: 10_000_000, max: 20_000_000 },
  "20m-50m": { min: 20_000_000, max: 50_000_000 },
  "above-50m": { min: 50_000_000 },
};

export interface JobFilters {
  q?: string;
  location?: string;
  city?: string;
  district?: string;
  skills?: string[];
  employer?: string;
  status?: string;
  jobType?: string;
  level?: string;
  workingMode?: string;
  industryCode?: string;
  subIndustryCode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryRange?: string;
  minSalary?: number;
  maxSalary?: number;
  createdFrom?: string;
  createdTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  isUrgent?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface JobFiltersProps {
  filters?: JobFilters;
  onChange?: (filters: JobFilters) => void;
  onReset?: () => void;
  showAdvanced?: boolean;
  className?: string;
}

export default function JobFilters({
  filters = {},
  onChange,
  onReset,
  showAdvanced = false,
  className = "",
}: JobFiltersProps) {
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(filters);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // Address data
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [industryPopoverOpen, setIndustryPopoverOpen] = useState(false);
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");
  const [industrySearchResults, setIndustrySearchResults] = useState<
    Industry[]
  >([]);
  const [loadingIndustrySearch, setLoadingIndustrySearch] = useState(false);
  const industrySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Load industries
  useEffect(() => {
    const loadIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const data = await industryService.getRootIndustries();
        setIndustries(data);
      } catch (err) {
        console.error("Failed to load industries:", err);
      } finally {
        setLoadingIndustries(false);
      }
    };
    loadIndustries();
  }, []);

  // Load cities
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const data = await getCities();
        setCities(data);
      } catch (err) {
        console.error("Failed to load cities:", err);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  // Industry search
  useEffect(() => {
    if (industrySearchTimeoutRef.current) {
      clearTimeout(industrySearchTimeoutRef.current);
    }

    if (!industrySearchTerm.trim()) {
      setIndustrySearchResults([]);
      setLoadingIndustrySearch(false);
      return;
    }

    setLoadingIndustrySearch(true);
    industrySearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await industryService.searchIndustries(
          industrySearchTerm.trim()
        );
        setIndustrySearchResults(results || []);
      } catch (err) {
        console.error("Failed to search industries:", err);
        setIndustrySearchResults([]);
      } finally {
        setLoadingIndustrySearch(false);
      }
    }, 350);

    return () => {
      if (industrySearchTimeoutRef.current) {
        clearTimeout(industrySearchTimeoutRef.current);
      }
    };
  }, [industrySearchTerm]);

  // Load sub-industries when industryCode changes
  useEffect(() => {
    const loadSubIndustries = async () => {
      if (localFilters.industryCode) {
        setLoadingIndustries(true);
        try {
          const response = await industryService.getIndustries(
            localFilters.industryCode!
          );
          if (response.success && response.data) {
            setSubIndustries(response.data);
          } else {
            setSubIndustries([]);
          }
        } catch (err) {
          console.error("Failed to load sub-industries:", err);
          setSubIndustries([]);
        } finally {
          setLoadingIndustries(false);
        }
      } else {
        setSubIndustries([]);
      }
    };
    loadSubIndustries();
  }, [localFilters.industryCode]);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
    setAppliedFilters(filters);
  }, [filters]);

  const industryNameMap = useMemo(() => {
    const map = new Map<string, Industry>();
    const addToMap = (items?: Industry[]) => {
      items?.forEach((item) => {
        map.set(item.code, item);
      });
    };
    addToMap(industries);
    addToMap(subIndustries);
    addToMap(industrySearchResults);
    return map;
  }, [industries, subIndustries, industrySearchResults]);

  const getIndustryLabel = (code?: string) => {
    if (!code) return undefined;
    const item = industryNameMap.get(code);
    if (!item) return code;
    if (typeof item.name === "string") return item.name;
    return item.name?.vi || item.name?.en || item.code;
  };

  const applyFilterChanges = (changes: Partial<JobFilters>) => {
    setLocalFilters((prev) => {
      const updated = { ...prev };
      Object.entries(changes).forEach(([key, value]) => {
        const typedKey = key as keyof JobFilters;
        if (value === undefined || value === null || value === "") {
          delete updated[typedKey];
        } else {
          (updated as any)[typedKey] = value;
        }
      });
      return updated;
    });
  };

  const updateFilter = (key: keyof JobFilters, value: any) => {
    applyFilterChanges({ [key]: value });
    // Don't trigger onChange here - only when search button is clicked
  };

  const removeFilter = (key: keyof JobFilters) => {
    applyFilterChanges({ [key]: undefined });
    // Don't trigger onChange here - only when search button is clicked
  };

  const handleSearch = () => {
    // Apply filters when search button is clicked
    setAppliedFilters(localFilters);
    onChange?.(localFilters);
  };

  const handleReset = () => {
    const emptyFilters: JobFilters = {};
    setLocalFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    onChange?.(emptyFilters);
    onReset?.();
  };

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  // Helper function to convert days to date string
  const getDateFromDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  // Helper function to get days from createdFrom date
  const getDaysFromDate = (dateString?: string): string => {
    if (!dateString) return "all";
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return "3";
    if (diffDays <= 7) return "7";
    if (diffDays <= 30) return "30";
    return "all";
  };

  // Handle posted within filter
  const handlePostedWithinChange = (value: string) => {
    if (value === "all") {
      removeFilter("createdFrom");
    } else {
      const days = parseInt(value);
      const dateString = getDateFromDaysAgo(days);
      updateFilter("createdFrom", dateString);
    }
  };

  const handlePopularSearch = (searchTerm: string) => {
    updateFilter("q", searchTerm);
    // Auto search when clicking popular search
    const newFilters = { ...localFilters, q: searchTerm };
    setLocalFilters(newFilters);
    setAppliedFilters(newFilters);
    onChange?.(newFilters);
  };

  const resetIndustrySearchState = () => {
    setIndustrySearchTerm("");
    setIndustrySearchResults([]);
    setLoadingIndustrySearch(false);
  };

  const handleClearIndustry = () => {
    applyFilterChanges({
      industryCode: undefined,
      subIndustryCode: undefined,
    });
    resetIndustrySearchState();
  };

  const handleRootIndustrySelect = (industry: Industry) => {
    applyFilterChanges({
      industryCode: industry.code,
      subIndustryCode: undefined,
    });
    resetIndustrySearchState();
  };

  const handleSubIndustrySelect = (industry: Industry) => {
    applyFilterChanges({
      industryCode:
        industry.parentCode || localFilters.industryCode || industry.code,
      subIndustryCode: industry.code,
    });
    setIndustryPopoverOpen(false);
    resetIndustrySearchState();
  };

  const handleIndustrySearchSelect = (industry: Industry) => {
    applyFilterChanges({
      industryCode: industry.parentCode || industry.code,
      subIndustryCode: industry.parentCode ? industry.code : undefined,
    });
    setIndustryPopoverOpen(false);
    resetIndustrySearchState();
  };

  const formatIndustryName = (industry?: Industry) => {
    if (!industry) return "";
    if (typeof industry.name === "string") return industry.name;
    return industry.name?.vi || industry.name?.en || industry.code;
  };

  const selectedIndustryLabel = getIndustryLabel(localFilters.industryCode);
  const selectedSubIndustryLabel = getIndustryLabel(
    localFilters.subIndustryCode
  );
  const industryTriggerLabel =
    selectedSubIndustryLabel || selectedIndustryLabel || "Tất cả ngành nghề";
  const industryTriggerSubtitle = selectedSubIndustryLabel
    ? selectedIndustryLabel
    : undefined;

  return (
    <div
      className={`w-full rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,45,95,0.25)] p-6 relative overflow-hidden ${className}`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        {/* --- Top search row --- */}
        <div className="flex items-center gap-3 w-full">
          {/* Search Input with icon */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-600 z-10" />
            <Input
              placeholder="Nhập vị trí tuyển dụng, tên công ty..."
              className="h-12 pl-12 pr-4 rounded-xl border-white/30 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all shadow-sm"
              value={localFilters.q || ""}
              onChange={(e) => updateFilter("q", e.target.value || undefined)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Industry Selector - Popover */}
          <Popover
            open={industryPopoverOpen}
            onOpenChange={(open) => {
              setIndustryPopoverOpen(open);
              if (!open) {
                resetIndustrySearchState();
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-12 w-[220px] bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl px-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] uppercase tracking-wide text-white/70">
                    Ngành nghề
                  </span>
                  <span className="text-sm font-semibold">
                    {industryTriggerLabel}
                  </span>
                  {industryTriggerSubtitle && (
                    <span className="text-[11px] text-white/80">
                      {industryTriggerSubtitle}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-white/80 ml-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[520px] border border-white/40 bg-white/95 backdrop-blur-xl rounded-2xl p-0 shadow-[0_25px_60px_rgba(15,45,95,0.25)]"
            >
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={industrySearchTerm}
                    onChange={(e) => setIndustrySearchTerm(e.target.value)}
                    placeholder="Tìm kiếm ngành hoặc chuyên môn..."
                    className="pl-9 pr-9 h-11 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-sm"
                  />
                  {industrySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setIndustrySearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {selectedSubIndustryLabel
                      ? `Đã chọn: ${selectedSubIndustryLabel}`
                      : selectedIndustryLabel
                      ? `Đã chọn: ${selectedIndustryLabel}`
                      : "Chưa chọn ngành"}
                  </span>
                  {(localFilters.industryCode ||
                    localFilters.subIndustryCode) && (
                    <button
                      type="button"
                      onClick={handleClearIndustry}
                      className="text-teal-600 font-medium hover:text-teal-700"
                    >
                      Xóa lựa chọn
                    </button>
                  )}
                </div>

                {industrySearchTerm.trim() ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/85">
                    <ScrollArea className="h-60">
                      {loadingIndustrySearch ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tìm kiếm...
                        </div>
                      ) : industrySearchResults.length > 0 ? (
                        industrySearchResults.map((industry) => {
                          const isSelected =
                            localFilters.subIndustryCode === industry.code ||
                            (!industry.parentCode &&
                              localFilters.industryCode === industry.code);
                          return (
                            <button
                              key={industry.code}
                              type="button"
                              onClick={() =>
                                handleIndustrySearchSelect(industry)
                              }
                              className={`w-full px-4 py-2 flex items-center justify-between text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-teal-50 text-teal-600"
                                  : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              <span>{formatIndustryName(industry)}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-teal-500" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500">
                          Không tìm thấy ngành phù hợp
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/85">
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Ngành chính
                      </div>
                      <ScrollArea className="h-60 pr-1">
                        {loadingIndustries ? (
                          <div className="py-6 text-center text-sm text-slate-500">
                            Đang tải danh sách...
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            <button
                              type="button"
                              onClick={handleClearIndustry}
                              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                !localFilters.industryCode
                                  ? "bg-teal-50 text-teal-600"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Tất cả ngành nghề
                            </button>
                            {industries.map((industry) => {
                              const isActive =
                                localFilters.industryCode === industry.code;
                              return (
                                <button
                                  key={industry.code}
                                  type="button"
                                  onClick={() =>
                                    handleRootIndustrySelect(industry)
                                  }
                                  className={`w-full px-3 py-2 rounded-xl text-left text-sm flex items-center justify-between transition-colors ${
                                    isActive
                                      ? "bg-teal-50 text-teal-600"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{formatIndustryName(industry)}</span>
                                  {isActive && (
                                    <Check className="h-4 w-4 text-teal-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white/85">
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Chuyên môn
                      </div>
                      <ScrollArea className="h-60 pr-1">
                        {!localFilters.industryCode ? (
                          <div className="py-6 text-center text-sm text-slate-500">
                            Chọn ngành để xem chuyên môn
                          </div>
                        ) : loadingIndustries && subIndustries.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-500">
                            Đang tải...
                          </div>
                        ) : subIndustries.length > 0 ? (
                          <div className="p-2 space-y-1">
                            {subIndustries.map((subIndustry) => {
                              const isSubActive =
                                localFilters.subIndustryCode ===
                                subIndustry.code;
                              return (
                                <button
                                  key={subIndustry.code}
                                  type="button"
                                  onClick={() =>
                                    handleSubIndustrySelect(subIndustry)
                                  }
                                  className={`w-full px-3 py-2 rounded-xl text-left text-sm flex items-center justify-between transition-colors ${
                                    isSubActive
                                      ? "bg-teal-500/10 text-teal-600 border border-teal-100"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{formatIndustryName(subIndustry)}</span>
                                  {isSubActive && (
                                    <Check className="h-4 w-4 text-teal-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-sm text-slate-500">
                            Ngành hiện tại chưa có chuyên môn chi tiết
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* City Dropdown - Teal with glass effect */}
          <Select
            value={
              localFilters.location
                ? cities.find((c) => c.label === localFilters.location)
                    ?.value || "all"
                : "all"
            }
            onValueChange={(v) => {
              if (v === "all") {
                applyFilterChanges({
                  city: undefined,
                  location: undefined,
                });
              } else {
                const selectedCity = cities.find((c) => c.value === v);
                if (selectedCity) {
                  // Only pass city via legacy location param for backend search
                  applyFilterChanges({
                    city: undefined,
                    location: selectedCity.label,
                  });
                }
              }
            }}
            disabled={loadingCities}
          >
            <SelectTrigger className="h-12 w-[180px] bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 rounded-xl font-medium flex items-center justify-between shadow-lg hover:shadow-xl transition-all [&>svg]:text-white">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white" />
                <SelectValue
                  placeholder={
                    loadingCities ? "Đang tải..." : "Tất cả địa điểm"
                  }
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả địa điểm</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Button - Teal with gradient */}
          <Button
            onClick={handleSearch}
            className="h-12 px-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Search className="h-5 w-5 text-white" />
            Tìm kiếm
          </Button>
        </div>

        {/* Popular Searches */}
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/30">
          <span className="text-sm text-gray-700 font-semibold whitespace-nowrap">
            Tìm kiếm phổ biến:
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-sm text-gray-700 font-medium hover:bg-white hover:border-teal-300 hover:text-teal-600 hover:shadow-md transition-all duration-300"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Bottom filter row --- */}
      {hasActiveFilters && (
        <div className="relative z-10 flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-white/30">
          {/* Salary */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-600 font-medium">
              Mức lương
            </Label>
            <Select
              value={localFilters.salaryRange || "all"}
              onValueChange={(v) => {
                if (v === "all") {
                  // Xóa toàn bộ filter lương khi chọn "Tất cả"
                  updateFilter("salaryRange", undefined);
                  updateFilter("salaryMin", undefined);
                  updateFilter("salaryMax", undefined);
                  updateFilter("minSalary", undefined);
                  updateFilter("maxSalary", undefined);
                  return;
                }

                const bounds = SALARY_RANGE_BOUNDS[v] || {};

                // Lưu lại cả salaryMin/salaryMax và minSalary/maxSalary
                updateFilter("salaryRange", v);
                updateFilter("salaryMin", bounds.min);
                updateFilter("minSalary", bounds.min);
                updateFilter("salaryMax", bounds.max);
                updateFilter("maxSalary", bounds.max);
              }}
            >
              <SelectTrigger className="h-9 w-[140px] border border-white/40 bg-white/70 backdrop-blur-sm hover:border-teal-400 hover:bg-white transition-all text-sm text-gray-700 shadow-sm">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {SALARY_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-600 font-medium">Cấp bậc</Label>
            <Select
              value={localFilters.level || "all"}
              onValueChange={(v) =>
                updateFilter("level", v === "all" ? undefined : v)
              }
            >
              <SelectTrigger className="h-9 w-[140px] border border-white/40 bg-white/70 backdrop-blur-sm hover:border-teal-400 hover:bg-white transition-all text-sm text-gray-700 shadow-sm">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {JOB_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-600 font-medium">
              Hình thức việc làm
            </Label>
            <Select
              value={localFilters.jobType || "all"}
              onValueChange={(v) =>
                updateFilter("jobType", v === "all" ? undefined : v)
              }
            >
              <SelectTrigger className="h-9 w-[160px] border border-white/40 bg-white/70 backdrop-blur-sm hover:border-teal-400 hover:bg-white transition-all text-sm text-gray-700 shadow-sm">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Posted Within */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-600 font-medium">
              Đăng trong vòng
            </Label>
            <Select
              value={getDaysFromDate(localFilters.createdFrom)}
              onValueChange={handlePostedWithinChange}
            >
              <SelectTrigger className="h-9 w-[140px] border border-white/40 bg-white/70 backdrop-blur-sm hover:border-teal-400 hover:bg-white transition-all text-sm text-gray-700 shadow-sm">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="3">3 ngày</SelectItem>
                <SelectItem value="7">7 ngày</SelectItem>
                <SelectItem value="30">30 ngày</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <div className="flex items-end h-9">
              <button
                onClick={handleReset}
                className="text-teal-600 text-sm font-medium hover:text-teal-700 hover:underline ml-auto transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="relative z-10 pt-5 border-t border-white/30 mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-700 font-semibold">
              Bộ lọc đang áp dụng:
            </span>
            {appliedFilters.q && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Tìm kiếm: {appliedFilters.q}
              </Badge>
            )}
            {appliedFilters.location && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Tỉnh/TP: {appliedFilters.location}
              </Badge>
            )}
            {appliedFilters.jobType && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Loại:{" "}
                {
                  JOB_TYPES.find((t) => t.value === appliedFilters.jobType)
                    ?.label
                }
              </Badge>
            )}
            {appliedFilters.level && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Cấp độ:{" "}
                {
                  JOB_LEVELS.find((l) => l.value === appliedFilters.level)
                    ?.label
                }
              </Badge>
            )}
            {appliedFilters.industryCode && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Ngành: {getIndustryLabel(appliedFilters.industryCode)}
              </Badge>
            )}
            {appliedFilters.subIndustryCode && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Chuyên môn: {getIndustryLabel(appliedFilters.subIndustryCode)}
              </Badge>
            )}
            {appliedFilters.salaryRange && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Lương:{" "}
                {
                  SALARY_RANGES.find(
                    (r) => r.value === appliedFilters.salaryRange
                  )?.label
                }
              </Badge>
            )}
            {appliedFilters.skills && appliedFilters.skills.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Kỹ năng: {appliedFilters.skills.length} kỹ năng
              </Badge>
            )}
            {appliedFilters.createdFrom && (
              <Badge
                variant="outline"
                className="text-xs bg-white/80 backdrop-blur-sm border-teal-300 text-teal-700 font-medium shadow-sm"
              >
                Đăng trong vòng:{" "}
                {getDaysFromDate(appliedFilters.createdFrom) === "3"
                  ? "3 ngày"
                  : getDaysFromDate(appliedFilters.createdFrom) === "7"
                  ? "7 ngày"
                  : "30 ngày"}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
