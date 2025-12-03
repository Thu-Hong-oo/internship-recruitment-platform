"use client";

import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { industryService, Industry } from "@/lib/api";

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

const MAJOR_CITIES = [
  "Tất cả địa điểm",
  "Thành phố Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bình Dương",
  "Đồng Nai",
  "An Giang",
  "Bà Rịa - Vũng Tàu",
];

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    filters.skills || []
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

  // Load sub-industries when industryCode changes
  useEffect(() => {
    const loadSubIndustries = async () => {
      if (localFilters.industryCode) {
        setLoadingIndustries(true);
        try {
          const data = await industryService.getSubIndustries(
            localFilters.industryCode!
          );
          setSubIndustries(data);
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
    setSelectedSkills(filters.skills || []);
  }, [filters]);

  const updateFilter = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  const removeFilter = (key: keyof JobFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: JobFilters = {};
    setLocalFilters(emptyFilters);
    setSelectedSkills([]);
    setSkillInput("");
    onChange?.(emptyFilters);
    onReset?.();
  };

  const addSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      const newSkills = [...selectedSkills, skillInput.trim()];
      setSelectedSkills(newSkills);
      updateFilter("skills", newSkills);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    const newSkills = selectedSkills.filter((s) => s !== skill);
    setSelectedSkills(newSkills);
    updateFilter("skills", newSkills.length > 0 ? newSkills : undefined);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc tìm kiếm
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Tìm kiếm</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="search"
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, công ty..."
              value={localFilters.q || ""}
              onChange={(e) => updateFilter("q", e.target.value || undefined)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Basic Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Location */}
          <div>
            <Label htmlFor="location">Địa điểm</Label>
            <Select
              value={localFilters.city || localFilters.location || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  removeFilter("city");
                  removeFilter("location");
                } else {
                  updateFilter("city", value);
                  updateFilter("location", value);
                }
              }}
            >
              <SelectTrigger id="location" className="mt-1">
                <SelectValue placeholder="Chọn địa điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {MAJOR_CITIES.slice(1).map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type */}
          <div>
            <Label htmlFor="jobType">Loại công việc</Label>
            <Select
              value={localFilters.jobType || "all"}
              onValueChange={(value) =>
                updateFilter("jobType", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="jobType" className="mt-1">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div>
            <Label htmlFor="level">Cấp độ</Label>
            <Select
              value={localFilters.level || "all"}
              onValueChange={(value) =>
                updateFilter("level", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="level" className="mt-1">
                <SelectValue placeholder="Tất cả cấp độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp độ</SelectItem>
                {JOB_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Working Mode */}
          <div>
            <Label htmlFor="workingMode">Hình thức làm việc</Label>
            <Select
              value={localFilters.workingMode || "all"}
              onValueChange={(value) =>
                updateFilter("workingMode", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="workingMode" className="mt-1">
                <SelectValue placeholder="Tất cả hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hình thức</SelectItem>
                {WORKING_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Industry */}
          <div>
            <Label htmlFor="industry">Ngành nghề</Label>
            <Select
              value={localFilters.industryCode || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  removeFilter("industryCode");
                  removeFilter("subIndustryCode");
                } else {
                  updateFilter("industryCode", value);
                  updateFilter("subIndustryCode", undefined);
                }
              }}
              disabled={loadingIndustries}
            >
              <SelectTrigger id="industry" className="mt-1">
                <SelectValue placeholder="Chọn ngành nghề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.code} value={industry.code}>
                    {typeof industry.name === "string" ? industry.name : industry.name?.vi || industry.name?.en || industry.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Industry */}
          {localFilters.industryCode && subIndustries.length > 0 && (
            <div>
              <Label htmlFor="subIndustry">Lĩnh vực</Label>
              <Select
                value={localFilters.subIndustryCode || "all"}
                onValueChange={(value) =>
                  updateFilter("subIndustryCode", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="subIndustry" className="mt-1">
                  <SelectValue placeholder="Chọn lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {subIndustries.map((subIndustry) => (
                    <SelectItem key={subIndustry.code} value={subIndustry.code}>
                      {typeof subIndustry.name === "string" ? subIndustry.name : subIndustry.name?.vi || subIndustry.name?.en || subIndustry.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Salary Range */}
          <div>
            <Label htmlFor="salaryRange">Mức lương</Label>
            <Select
              value={localFilters.salaryRange || "all"}
              onValueChange={(value) =>
                updateFilter("salaryRange", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="salaryRange" className="mt-1">
                <SelectValue placeholder="Chọn mức lương" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức lương</SelectItem>
                {SALARY_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <Label htmlFor="sortBy">Sắp xếp theo</Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={localFilters.sortBy || "createdAt"}
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger id="sortBy" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortOrder || "desc"}
                onValueChange={(value) =>
                  updateFilter("sortOrder", value as "asc" | "desc")
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Giảm dần</SelectItem>
                  <SelectItem value="asc">Tăng dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <Label htmlFor="skills">Kỹ năng</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="skills"
              type="text"
              placeholder="Nhập kỹ năng và nhấn Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              className="flex-1"
            />
            <Button type="button" onClick={addSkill} variant="outline">
              Thêm
            </Button>
          </div>
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-sm"
              type="button"
            >
              <span>Bộ lọc nâng cao</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Salary Min */}
              <div>
                <Label htmlFor="salaryMin">Lương tối thiểu (VND)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localFilters.salaryMin || localFilters.minSalary || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value)
                      : undefined;
                    updateFilter("salaryMin", value);
                    updateFilter("minSalary", value);
                  }}
                  className="mt-1"
                />
              </div>

              {/* Salary Max */}
              <div>
                <Label htmlFor="salaryMax">Lương tối đa (VND)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localFilters.salaryMax || localFilters.maxSalary || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value)
                      : undefined;
                    updateFilter("salaryMax", value);
                    updateFilter("maxSalary", value);
                  }}
                  className="mt-1"
                />
              </div>

              {/* Created From */}
              <div>
                <Label htmlFor="createdFrom">Ngày đăng từ</Label>
                <Input
                  id="createdFrom"
                  type="date"
                  value={localFilters.createdFrom || ""}
                  onChange={(e) =>
                    updateFilter("createdFrom", e.target.value || undefined)
                  }
                  className="mt-1"
                />
              </div>

              {/* Created To */}
              <div>
                <Label htmlFor="createdTo">Ngày đăng đến</Label>
                <Input
                  id="createdTo"
                  type="date"
                  value={localFilters.createdTo || ""}
                  onChange={(e) =>
                    updateFilter("createdTo", e.target.value || undefined)
                  }
                  className="mt-1"
                />
              </div>

              {/* Deadline From */}
              <div>
                <Label htmlFor="deadlineFrom">Hạn nộp từ</Label>
                <Input
                  id="deadlineFrom"
                  type="date"
                  value={localFilters.deadlineFrom || ""}
                  onChange={(e) =>
                    updateFilter("deadlineFrom", e.target.value || undefined)
                  }
                  className="mt-1"
                />
              </div>

              {/* Deadline To */}
              <div>
                <Label htmlFor="deadlineTo">Hạn nộp đến</Label>
                <Input
                  id="deadlineTo"
                  type="date"
                  value={localFilters.deadlineTo || ""}
                  onChange={(e) =>
                    updateFilter("deadlineTo", e.target.value || undefined)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Urgent Jobs */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isUrgent"
                checked={localFilters.isUrgent || false}
                onChange={(e) =>
                  updateFilter("isUrgent", e.target.checked || undefined)
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="isUrgent" className="cursor-pointer">
                Chỉ hiển thị việc làm khẩn cấp (hạn nộp trong 7 ngày)
              </Label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Bộ lọc đang áp dụng:</span>
              {localFilters.q && (
                <Badge variant="outline" className="text-xs">
                  Tìm kiếm: {localFilters.q}
                </Badge>
              )}
              {localFilters.city && (
                <Badge variant="outline" className="text-xs">
                  Địa điểm: {localFilters.city}
                </Badge>
              )}
              {localFilters.jobType && (
                <Badge variant="outline" className="text-xs">
                  Loại: {JOB_TYPES.find((t) => t.value === localFilters.jobType)?.label}
                </Badge>
              )}
              {localFilters.level && (
                <Badge variant="outline" className="text-xs">
                  Cấp độ: {JOB_LEVELS.find((l) => l.value === localFilters.level)?.label}
                </Badge>
              )}
              {localFilters.workingMode && (
                <Badge variant="outline" className="text-xs">
                  Hình thức: {WORKING_MODES.find((m) => m.value === localFilters.workingMode)?.label}
                </Badge>
              )}
              {localFilters.industryCode && (
                <Badge variant="outline" className="text-xs">
                  Ngành: {(() => {
                    const industry = industries.find((i) => i.code === localFilters.industryCode);
                    if (!industry) return localFilters.industryCode;
                    return typeof industry.name === "string" 
                      ? industry.name 
                      : industry.name?.vi || industry.name?.en || industry.code;
                  })()}
                </Badge>
              )}
              {localFilters.salaryRange && (
                <Badge variant="outline" className="text-xs">
                  Lương: {SALARY_RANGES.find((r) => r.value === localFilters.salaryRange)?.label}
                </Badge>
              )}
              {selectedSkills.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Kỹ năng: {selectedSkills.length} kỹ năng
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

