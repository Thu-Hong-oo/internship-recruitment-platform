"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, X, ChevronRight, Sparkles, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { industriesAPI, Industry } from "@/lib/api";

interface HeroSectionProps {
  onSearch?: (keyword: string) => void;
  onFiltersChange?: (filters: FilterState) => void;
}

export interface FilterState {
  search?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  industryCode?: string;
  skills?: string[];
  minSalary?: number;
  maxSalary?: number;
}

export default function HeroSection({
  onSearch,
  onFiltersChange,
}: HeroSectionProps) {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tất cả địa điểm");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false);

  // Location options
  const locations = [
    "Tất cả địa điểm",
    "Ho Chi Minh",
    "Ha Noi",
    "Da Nang",
    "Can Tho",
    "Hai Phong",
    "An Giang",
    "Ba Ria - Vung Tau",
    "Bac Lieu",
    "Bac Giang",
    "Bac Kan",
    "Bac Ninh",
    "Ben Tre",
    "Binh Dinh",
    "Binh Duong",
    "Binh Phuoc",
    "Binh Thuan",
    "Ca Mau",
    "Cao Bang",
    "Dak Lak",
    "Dak Nong",
    "Dien Bien",
    "Dong Nai",
    "Dong Thap",
    "Gia Lai",
    "Ha Giang",
    "Ha Nam",
    "Ha Tinh",
    "Hai Duong",
    "Hau Giang",
    "Hoa Binh",
    "Hung Yen",
    "Khanh Hoa",
    "Kien Giang",
    "Kon Tum",
    "Lai Chau",
    "Lam Dong",
    "Lang Son",
    "Lao Cai",
    "Long An",
    "Nam Dinh",
    "Nghe An",
    "Ninh Binh",
    "Ninh Thuan",
    "Phu Tho",
    "Phu Yen",
    "Quang Binh",
    "Quang Nam",
    "Quang Ngai",
    "Quang Ninh",
    "Quang Tri",
    "Soc Trang",
    "Son La",
    "Tay Ninh",
    "Thai Binh",
    "Thai Nguyen",
    "Thanh Hoa",
    "Thua Thien Hue",
    "Tien Giang",
    "Tra Vinh",
    "Tuyen Quang",
    "Vinh Long",
    "Vinh Phuc",
    "Yen Bai",
  ];

  // Industries state
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [currentIndustryPage, setCurrentIndustryPage] = useState(1);
  const industriesPerPage = 5;
  const [hoveredIndustry, setHoveredIndustry] = useState<Industry | null>(null);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);
  const [loadingSubIndustries, setLoadingSubIndustries] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchResults, setSearchResults] = useState<Industry[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(
    new Set()
  );
  const [allIndustriesMap, setAllIndustriesMap] = useState<
    Map<string, Industry>
  >(new Map());

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const data = await industriesAPI.getRootIndustries();
        setIndustries(data);
        // Build map for quick lookup
        const map = new Map<string, Industry>();
        data.forEach((industry) => map.set(industry.code, industry));
        setAllIndustriesMap(map);
      } catch (error) {
        console.error("Failed to fetch industries:", error);
        setIndustries([]);
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, []);

  // Search industries when search query changes
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, reset
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce search API call
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingIndustries(true);
        const data = await industriesAPI.searchIndustries(searchQuery.trim());
        setSearchResults(data);
        // Update map with search results
        setAllIndustriesMap((prevMap) => {
          const map = new Map(prevMap);
          data.forEach((industry: Industry) =>
            map.set(industry.code, industry)
          );
          return map;
        });
      } catch (error) {
        console.error("Failed to search industries:", error);
        setSearchResults([]);
      } finally {
        setLoadingIndustries(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Build breadcrumb path for an industry
  const buildBreadcrumbPath = (industry: Industry): string[] => {
    const path: string[] = [];
    let current: Industry | undefined = industry;

    // Build path by traversing parent codes
    while (current) {
      path.unshift(current.name.vi.toUpperCase());
      if (current.parentCode) {
        current = allIndustriesMap.get(current.parentCode);
      } else {
        break;
      }
    }

    return path;
  };

  // Toggle industry selection
  const toggleIndustrySelection = (industryCode: string) => {
    setSelectedIndustries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(industryCode)) {
        newSet.delete(industryCode);
      } else {
        newSet.add(industryCode);
      }
      return newSet;
    });
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedIndustries(new Set());
  };

  // Fetch sub-industries when hovering over an industry
  useEffect(() => {
    if (!hoveredIndustry) {
      setSubIndustries([]);
      return;
    }

    const fetchSubIndustries = async () => {
      try {
        setLoadingSubIndustries(true);
        const response = await industriesAPI.getIndustries(
          hoveredIndustry.code
        );
        if (response.success && response.data) {
          setSubIndustries(response.data);
          // Update map with sub-industries
          setAllIndustriesMap((prevMap) => {
            const map = new Map(prevMap);
            response.data.forEach((industry: Industry) =>
              map.set(industry.code, industry)
            );
            return map;
          });
        } else {
          setSubIndustries([]);
        }
      } catch (error) {
        console.error("Failed to fetch sub-industries:", error);
        setSubIndustries([]);
      } finally {
        setLoadingSubIndustries(false);
      }
    };

    // Debounce để tránh fetch quá nhiều khi hover nhanh
    const timeoutId = setTimeout(() => {
      fetchSubIndustries();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [hoveredIndustry]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Calculate pagination
  const totalIndustryPages = Math.ceil(industries.length / industriesPerPage);
  const startIndex = (currentIndustryPage - 1) * industriesPerPage;
  const endIndex = startIndex + industriesPerPage;
  const displayedIndustries = industries.slice(startIndex, endIndex);

  // Filter industries by search query
  const filteredIndustries = searchQuery
    ? industries.filter(
        (industry) =>
          industry.name.vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          industry.name.en?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayedIndustries;

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchKeyword);
    } else {
      const qs = new URLSearchParams();
      if (searchKeyword) qs.set("q", searchKeyword);
      router.push(`/search?${qs.toString()}`);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white py-20">
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, oklch(0.60 0.12 195) 0%, oklch(0.72 0.08 210) 55%, oklch(0.88 0.03 195) 100%)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.60_0.12_195/.2)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.60_0.12_195/.25),transparent_70%)] blur-3xl"
            style={{ animation: 'float 20s ease-in-out infinite' }} />
          <div className="pointer-events-none absolute right-[-120px] bottom-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.08_210/.2),transparent_75%)] blur-3xl"
            style={{ animation: 'float 25s ease-in-out infinite reverse' }} />
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

          {/* Search Form */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/90 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,45,95,0.25)] p-8">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_80%)]" />
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main search input - takes most space */}
                <div className="flex-[3] relative group">
                  {/* cách cạnh trên 50% */}
                  <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-primary" />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                    }}
                  >
                    <Input
                      placeholder="Nhập vị trí tuyển dụng, tên công ty..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="search-input pl-14 pr-6 placeholder:text-muted-foreground/60 text-foreground font-medium"
                    />
                  </form>
                </div>

                {/* Job category dropdown */}
                <div className="relative flex-1 min-w-[200px]">
                  <Button
                    onClick={() => setShowJobCategoryModal(true)}
                    className="dropdown-button w-full justify-start font-medium"
                  >
                    <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                    Danh mục nghề
                    <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                  </Button>

                  {/* Job Category Dropdown */}
                  {showJobCategoryModal && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[900px] bg-white text-foreground rounded-xl shadow-2xl border border-border z-50">
                      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-gray-900">
                            Chọn Nhóm nghề, Nghề hoặc Chuyên môn
                          </h2>
                          <button
                            onClick={() => {
                              setShowJobCategoryModal(false);
                              setSearchQuery("");
                              setSelectedIndustries(new Set());
                            }}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-5 h-5" />
                            <span className="text-sm">Đóng</span>
                          </button>
                        </div>
                        <div className="relative mt-3">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                          <Input
                            placeholder="Nhập từ khóa tìm kiếm"
                            className="pl-10 pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {searchQuery.trim() ? (
                        // Search mode: single column with breadcrumbs
                        <div className="max-h-[60vh] overflow-y-auto">
                          <div className="p-4">
                            {loadingIndustries ? (
                              <div className="text-sm text-muted-foreground py-4">
                                Đang tải...
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="space-y-1">
                                {searchResults.map((industry) => {
                                  const breadcrumb =
                                    buildBreadcrumbPath(industry);
                                  const isSelected = selectedIndustries.has(
                                    industry.code
                                  );
                                  return (
                                    <label
                                      key={industry._id}
                                      className="flex items-start p-3 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleIndustrySelection(industry.code)
                                        }
                                        className="mr-3 mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                          {industry.name.vi}
                                        </div>
                                        {breadcrumb.length > 1 && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {breadcrumb.join(" > ")}
                                          </div>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground py-4 text-center">
                                Không tìm thấy kết quả
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Normal mode: 3 columns
                        <div className="grid grid-cols-3 divide-x max-h-[60vh] overflow-y-auto">
                          <div className="p-4">
                            <h3 className="font-semibold mb-3 text-gray-900">
                              NHÓM NGHỀ
                            </h3>
                            {loadingIndustries ? (
                              <div className="text-sm text-muted-foreground py-4">
                                Đang tải danh mục...
                              </div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  {filteredIndustries.map((industry) => (
                                    <label
                                      key={industry._id}
                                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                        hoveredIndustry?._id === industry._id
                                          ? "bg-primary/5"
                                          : "hover:bg-gray-50"
                                      }`}
                                      onMouseEnter={() => {
                                        if (hoverTimeoutRef.current) {
                                          clearTimeout(hoverTimeoutRef.current);
                                          hoverTimeoutRef.current = null;
                                        }
                                        setHoveredIndustry(industry);
                                      }}
                                      onMouseLeave={() => {
                                        hoverTimeoutRef.current = setTimeout(
                                          () => {
                                            setHoveredIndustry(null);
                                          },
                                          200
                                        );
                                      }}
                                    >
                                      <div className="flex items-center">
                                        <Checkbox className="mr-3" />
                                        <span className="text-sm">
                                          {industry.name.vi}
                                          {industry.name.en &&
                                            ` (${industry.name.en})`}
                                        </span>
                                      </div>
                                      <button
                                        className="text-primary text-xs ml-2 hover:underline"
                                        onClick={() => {
                                          setShowJobCategoryModal(false);
                                          const params = new URLSearchParams();
                                          params.set(
                                            "industryCode",
                                            industry.code
                                          );
                                          router.push(
                                            `/search?${params.toString()}`
                                          );
                                        }}
                                      >
                                        Xem
                                      </button>
                                    </label>
                                  ))}
                                </div>
                                {!searchQuery && totalIndustryPages > 1 && (
                                  <div className="mt-4 flex items-center justify-between">
                                    <button
                                      onClick={() =>
                                        setCurrentIndustryPage((prev) =>
                                          Math.max(1, prev - 1)
                                        )
                                      }
                                      disabled={currentIndustryPage === 1}
                                      className="px-2 py-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      ←
                                    </button>
                                    <span className="text-sm text-muted-foreground">
                                      {currentIndustryPage}/{totalIndustryPages}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setCurrentIndustryPage((prev) =>
                                          Math.min(totalIndustryPages, prev + 1)
                                        )
                                      }
                                      disabled={
                                        currentIndustryPage >=
                                        totalIndustryPages
                                      }
                                      className="px-2 py-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      →
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div
                            className="p-4"
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredIndustry(null);
                            }}
                          >
                            <h3 className="font-semibold mb-3 text-gray-900">
                              NGHỀ
                            </h3>
                            {loadingSubIndustries ? (
                              <div className="text-sm text-muted-foreground py-4">
                                Đang tải...
                              </div>
                            ) : hoveredIndustry && subIndustries.length > 0 ? (
                              <div className="space-y-1">
                                {subIndustries
                                  .slice(0, 10)
                                  .map((subIndustry) => (
                                    <label
                                      key={subIndustry._id}
                                      className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                                      onClick={() => {
                                        setShowJobCategoryModal(false);
                                        const params = new URLSearchParams();
                                        params.set(
                                          "industryCode",
                                          subIndustry.code
                                        );
                                        router.push(
                                          `/search?${params.toString()}`
                                        );
                                      }}
                                    >
                                      <Checkbox className="mr-3" />
                                      <span className="text-sm font-medium">
                                        {subIndustry.name.vi}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground py-4">
                                {hoveredIndustry
                                  ? "Chưa có danh mục con"
                                  : "Hover vào nhóm nghề để xem"}
                              </div>
                            )}
                          </div>
                          <div
                            className="p-4"
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredIndustry(null);
                            }}
                          >
                            <h3 className="font-semibold mb-3 text-gray-900">
                              VỊ TRÍ CHUYÊN MÔN
                            </h3>
                            {hoveredIndustry && subIndustries.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {subIndustries
                                  .slice(0, 7)
                                  .map((subIndustry) => (
                                    <button
                                      key={subIndustry._id}
                                      onClick={() => {
                                        setShowJobCategoryModal(false);
                                        const params = new URLSearchParams();
                                        params.set(
                                          "industryCode",
                                          subIndustry.code
                                        );
                                        router.push(
                                          `/search?${params.toString()}`
                                        );
                                      }}
                                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors"
                                    >
                                      {subIndustry.name.vi}
                                    </button>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground py-4">
                                {hoveredIndustry
                                  ? "Chưa có vị trí chuyên môn"
                                  : "Hover vào nhóm nghề để xem"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-4 border-t border-gray-200 flex justify-between items-center sticky bottom-0 bg-white rounded-b-xl">
                        <div className="text-sm text-gray-600">
                          Bạn gặp vấn đề với Danh mục Nghề?{" "}
                          <span className="text-primary cursor-pointer">
                            Gửi góp ý
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {searchQuery.trim() &&
                            selectedIndustries.size > 0 && (
                              <Button
                                variant="outline"
                                onClick={clearAllSelections}
                              >
                                Bỏ chọn tất cả ({selectedIndustries.size})
                              </Button>
                            )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowJobCategoryModal(false);
                              setSearchQuery("");
                              setSelectedIndustries(new Set());
                            }}
                          >
                            Hủy
                          </Button>
                          <Button
                            className="bg-primary hover:brightness-110"
                            onClick={() => {
                              if (searchQuery.trim()) {
                                // Navigate with selected industries
                                const params = new URLSearchParams();
                                Array.from(selectedIndustries).forEach(
                                  (code) => {
                                    params.append("industry", code);
                                  }
                                );
                                router.push(`/search?${params.toString()}`);
                              }
                              setShowJobCategoryModal(false);
                              setSearchQuery("");
                              setSelectedIndustries(new Set());
                            }}
                            disabled={
                              !!searchQuery.trim() &&
                              selectedIndustries.size === 0
                            }
                          >
                            Chọn
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location dropdown */}
                <Button
                  onClick={() => setShowLocationModal(true)}
                  className="dropdown-button flex-1 min-w-[180px] justify-start font-medium"
                >
                  <MapPin className="w-4 h-4 mr-3 text-primary" />
                  {selectedLocation}
                  <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                </Button>

                {/* Search button */}
                <Button
                  onClick={handleSearch}
                  type="button"
                  className="search-button flex-shrink-0 min-w-[140px]"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Tìm kiếm
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 relative">
                <span className="text-sm text-slate-700 font-semibold">
                  Tìm kiếm phổ biến:
                </span>
                {[
                  "Frontend Developer",
                  "Marketing",
                  "Sales",
                  "Kế toán",
                  "Nhân sự",
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchKeyword(tag)}
                    className="px-4 py-2 text-sm bg-white/90 text-slate-700 rounded-xl hover:bg-white hover:text-[oklch(0.60_0.12_195)] transition-all duration-300 font-semibold border border-white/40 backdrop-blur-sm hover:scale-105 hover:shadow-md shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Button 
                onClick={() => router.push('/cv-analysis')}
                size="lg"
                variant="outline"
                className="gap-2 bg-white/80 hover:bg-white border-white/50 hover:border-white text-primary hover:text-primary shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Phân tích CV
              </Button>
              
              <Button 
                onClick={() => router.push('/job-recommendations')}
                size="lg"
                variant="outline"
                className="gap-2 bg-white/80 hover:bg-white border-white/50 hover:border-white text-primary hover:text-primary shadow-md"
              >
                <TrendingUp className="w-4 h-4" />
                Gợi ý việc làm AI
              </Button>
              
              <Button 
                onClick={() => router.push('/skill-gap-analysis')}
                size="lg"
                variant="outline"
                className="gap-2 bg-white/80 hover:bg-white border-white/50 hover:border-white text-primary hover:text-primary shadow-md"
              >
                <Target className="w-4 h-4" />
                Phân tích kỹ năng
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{selectedLocation}</span>
                </div>
                <button onClick={() => setShowLocationModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Nhập Tỉnh/Thành phố" className="pl-10" />
              </div>
            </div>
            <div className="flex max-h-96">
              <div className="w-full">
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {locations.map((city) => (
                      <div
                        key={city}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedLocation(city);
                          setShowLocationModal(false);
                        }}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedLocation === city}
                            onCheckedChange={() => {
                              setSelectedLocation(city);
                              setShowLocationModal(false);
                            }}
                          />
                          <span className="ml-3 text-sm">{city}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedDistricts([])}
              >
                Bỏ chọn tất cả
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowLocationModal(false)}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
