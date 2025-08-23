"use client";

import { useState } from "react";
import { Search, MapPin, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface HeroSectionProps {
  onSearch: (keyword: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showJobCategoryModal, setShowJobCategoryModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Hồ Chí Minh");
  const [selectedDistricts, setSelectedDistricts] = useState([
    "Tất cả",
    "Bình Chánh",
    "Bình Tân",
    "Bình Thạnh",
    "Cần Giờ",
    "Củ Chi",
    "Gò Vấp",
  ]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSearch = () => {
    onSearch(searchKeyword);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Tìm việc làm nhanh 24h, việc làm mới nhất trên toàn quốc
            </h1>
            <p className="text-xl opacity-90">
              Tiếp cận <strong>40,000+</strong> tin tuyển dụng việc làm mỗi ngày
              từ hàng nghìn doanh nghiệp uy tín tại Việt Nam
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="search-container p-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main search input - takes most space */}
                <div className="flex-[3] relative group">
                  <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors duration-300" />
                  <Input
                    placeholder="Nhập vị trí tuyển dụng, tên công ty..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="search-input pl-14 pr-6 placeholder:text-muted-foreground/60 text-foreground font-medium"
                  />
                </div>

                {/* Job category dropdown */}
                <Button
                  onClick={() => setShowJobCategoryModal(true)}
                  className="dropdown-button flex-1 min-w-[200px] justify-start text-foreground font-medium"
                >
                  <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                  Danh mục nghề
                  <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                </Button>

                {/* Location dropdown */}
                <Button
                  onClick={() => setShowLocationModal(true)}
                  className="dropdown-button flex-1 min-w-[180px] justify-start text-foreground font-medium"
                >
                  <MapPin className="w-4 h-4 mr-3 text-primary" />
                  {selectedLocation}
                  <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
                </Button>

                {/* Search button */}
                <Button
                  onClick={handleSearch}
                  className="search-button flex-shrink-0 min-w-[140px]"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Tìm kiếm
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground font-medium">
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
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors duration-200 font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
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
              <div className="w-1/2 border-r border-gray-200">
                <div className="p-4">
                  <div className="space-y-2">
                    {[
                      "Hà Nội",
                      "Hồ Chí Minh",
                      "Bình Dương",
                      "Bắc Ninh",
                      "Đồng Nai",
                      "Hưng Yên",
                      "Hải Dương",
                    ].map((city) => (
                      <div
                        key={city}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedLocation === city}
                            onChange={() => setSelectedLocation(city)}
                          />
                          <span className="ml-3">{city}</span>
                        </div>
                        {city === "Hồ Chí Minh" && (
                          <span className="text-sm text-gray-500">Tất cả</span>
                        )}
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-1/2">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">QUẬN/HUYỆN</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[
                      "Tất cả",
                      "Bình Chánh",
                      "Bình Tân",
                      "Bình Thạnh",
                      "Cần Giờ",
                      "Củ Chi",
                      "Gò Vấp",
                    ].map((district) => (
                      <div key={district} className="flex items-center">
                        <Checkbox
                          checked={selectedDistricts.includes(district)}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedDistricts([
                                ...selectedDistricts,
                                district,
                              ]);
                            } else {
                              setSelectedDistricts(
                                selectedDistricts.filter((d) => d !== district)
                              );
                            }
                          }}
                        />
                        <span className="ml-3">{district}</span>
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

      {/* Job Category Modal */}
      {showJobCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Chọn Nhóm nghề, Nghề hoặc Chuyên môn
                </h2>
                <button onClick={() => setShowJobCategoryModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Nhập từ khóa tìm kiếm" className="pl-10" />
              </div>
            </div>
            <div className="flex max-h-96">
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">NHÓM NGHỀ</h3>
                  <div className="space-y-2">
                    {[
                      "Kinh doanh/Bán hàng",
                      "Marketing/PR/Quảng cáo",
                      "Chăm sóc khách hàng (Customer Service)/Vận hành",
                      "Nhân sự/Hành chính/Pháp chế",
                      "Công nghệ Thông tin",
                      "Lao động phổ thông",
                    ].map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Checkbox />
                          <span className="ml-3 text-sm">{category}</span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">NGHỀ</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Software Engineering", checked: false },
                      { name: "Software Testing", checked: false },
                      { name: "Artificial Intelligence (AI)", checked: false },
                    ].map((job) => (
                      <div key={job.name} className="p-2">
                        <div className="flex items-center mb-2">
                          <Checkbox checked={job.checked} />
                          <span className="ml-3 font-medium">{job.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-1/3">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">VỊ TRÍ CHUYÊN MÔN</h3>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Software Engineer",
                        "Backend Developer",
                        "Frontend Developer",
                        "Mobile Developer",
                        "Fullstack Developer",
                        "Blockchain Engineer",
                      ].map((position) => (
                        <div
                          key={position}
                          className="px-2 py-1 text-xs border border-gray-300 rounded"
                        >
                          {position}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-600">
                Bạn gặp vấn đề với Danh mục Nghề?{" "}
                <span className="text-green-600 cursor-pointer">Gửi góp ý</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Bỏ chọn tất cả</Button>
                <Button variant="outline">Hủy</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowJobCategoryModal(false)}
                >
                  Chọn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
