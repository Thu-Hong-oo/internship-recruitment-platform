# 🧭 Hướng dẫn Navigation từ Trang Danh sách Jobs

## 📍 Hiện tại bạn đang ở: `http://localhost:3001/` (Trang chủ - Danh sách Jobs)

---

## 🎯 **CÁCH CHUYỂN ĐẾN CÁC TRANG AI/NLP**

### **1️⃣ Từ Danh sách Jobs → Job Detail**
```tsx
// Trang: fe/app/page.tsx
// Click vào bất kỳ job card nào
<Link href={`/jobs/${job._id}`}>
  <Card>
    <h3>{job.title}</h3>
    <p>{job.company.name}</p>
  </Card>
</Link>
```
**➡️ Chuyển đến:** `/jobs/[id]`

---

### **2️⃣ Từ Job Detail → Skill Gap Analysis**

**Thêm button này vào file:** `fe/app/jobs/[id]/page.tsx`

```tsx
// Thêm vào phần action buttons (dưới nút "Ứng tuyển")
<div className="space-y-3">
  <ApplyButton job={job} />
  
  {/* ✅ THÊM BUTTON NÀY */}
  <Button 
    variant="outline"
    className="w-full"
    onClick={() => router.push(`/skill-gap-analysis?jobId=${job._id}`)}
  >
    <Sparkles className="mr-2 h-4 w-4" />
    Phân tích khoảng cách kỹ năng
  </Button>
  
  <Button variant="outline" className="w-full">
    <Heart className="mr-2 h-4 w-4" />
    Lưu việc làm
  </Button>
</div>
```

**Import icons:**
```tsx
import { Sparkles, Heart } from "lucide-react";
```

**➡️ Chuyển đến:** `/skill-gap-analysis?jobId=xxx`

---

### **3️⃣ Từ Skill Gap Analysis → Learning Roadmap**

**Đã có sẵn trong:** `fe/app/skill-gap-analysis/page.tsx`

```tsx
// Button tự động xuất hiện sau khi phân tích xong
{result && (
  <Button 
    onClick={() => router.push('/roadmaps')}
    className="mt-4"
  >
    <BookOpen className="mr-2 h-4 w-4" />
    Tạo lộ trình học từ skill gaps
  </Button>
)}
```

**➡️ Chuyển đến:** `/roadmaps`

---

### **4️⃣ QUAN TRỌNG: Thêm Menu Navigation AI/NLP vào Header**

**File cần chỉnh sửa:** `fe/components/layout/header.tsx`

**Thêm dropdown menu "AI & Phát triển kỹ năng":**

```tsx
{/* Thêm vào navigation section, sau dropdown "Việc làm" */}
<nav className="hidden md:flex items-center space-x-8">
  {/* Dropdown Việc làm - ĐÃ CÓ */}
  <div className="relative">...</div>

  {/* ✅ THÊM DROPDOWN MỚI - AI & KỸ NĂNG */}
  <div className="relative">
    <button
      className="flex items-center text-foreground hover:text-primary transition-colors duration-200"
      onMouseEnter={aiDropdown.openDropdown}
      onMouseLeave={aiDropdown.closeDropdown}
    >
      AI & Kỹ năng
      <ChevronDown className="w-4 h-4 ml-1" />
    </button>
    {aiDropdown.isOpen && (
      <div
        className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50"
        onMouseEnter={aiDropdown.openDropdown}
        onMouseLeave={aiDropdown.closeDropdown}
      >
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            TÍNH NĂNG AI
          </h3>
          <div className="space-y-3">
            {/* CV Analysis */}
            <Link
              href="/cv-analysis"
              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-3" />
              Phân tích CV bằng AI
              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </Link>

            {/* Job Recommendations */}
            <Link
              href="/job-recommendations"
              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Gợi ý việc làm AI
              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </Link>

            {/* Skill Gap Analysis */}
            <Link
              href="/skill-gap-analysis"
              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <Target className="w-4 h-4 mr-3" />
              Phân tích khoảng cách kỹ năng
              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </Link>

            {/* Learning Roadmaps */}
            <Link
              href="/roadmaps"
              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <Map className="w-4 h-4 mr-3" />
              Lộ trình học tập
              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </Link>

            {/* Candidate Insights */}
            <Link
              href="/insights"
              className="flex items-center text-gray-600 hover:text-primary cursor-pointer group p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Thông tin ứng viên
              <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Dropdown CV - ĐÃ CÓ */}
  <div className="relative">...</div>
</nav>
```

**Thêm custom hook cho dropdown AI:**
```tsx
// Thêm vào phần hooks (dưới cvDropdown)
const aiDropdown = useDropdown(150);
```

**Import các icons cần thiết:**
```tsx
import {
  FileText,
  TrendingUp,
  Target,
  Map,
  BarChart3,
  // ... existing imports
} from "lucide-react";
```

---

## 🗺️ **SƠ ĐỒ NAVIGATION FLOW**

```
📍 Trang chủ (/)
   ├─➡️ Job Detail (/jobs/[id])
   │    ├─➡️ Skill Gap Analysis (/skill-gap-analysis?jobId=xxx)
   │    │    └─➡️ Learning Roadmap (/roadmaps)
   │    ├─➡️ Apply Job
   │    └─➡️ Save Job
   │
   ├─➡️ Header Menu: "AI & Kỹ năng"
   │    ├─➡️ CV Analysis (/cv-analysis)
   │    ├─➡️ Job Recommendations (/job-recommendations)
   │    ├─➡️ Skill Gap Analysis (/skill-gap-analysis)
   │    ├─➡️ Learning Roadmaps (/roadmaps)
   │    └─➡️ Candidate Insights (/insights)
   │
   └─➡️ Search Jobs (/search)
```

---

## 📊 **USER JOURNEY EXAMPLES**

### **Journey 1: Tìm việc → Phân tích kỹ năng → Học tập**
```
1. Trang chủ (/) → Browse jobs
2. Click job card → Job Detail (/jobs/123)
3. Click "Phân tích khoảng cách kỹ năng" → Skill Gap Analysis
4. Xem skill gaps (critical, important, optional)
5. Click "Tạo lộ trình học" → Learning Roadmap
6. Track progress theo tuần
```

### **Journey 2: Upload CV → Nhận gợi ý việc làm**
```
1. Header → "AI & Kỹ năng" → "Phân tích CV bằng AI"
2. Upload CV file hoặc paste text
3. Xem extracted skills, experience, education
4. Click "Xem việc làm phù hợp" → Job Recommendations
5. Browse ranked jobs (A/B/C/D tiers)
6. Click job → Apply
```

### **Journey 3: Khám phá lộ trình học**
```
1. Header → "AI & Kỹ năng" → "Lộ trình học tập"
2. Browse popular roadmaps
3. Filter theo role/industry
4. Click "Tạo lộ trình mới"
5. Chọn target job
6. System generate roadmap với resources
```

---

## 🎨 **QUICK ACTIONS BUTTONS**

**Thêm vào trang chủ (fe/app/page.tsx) - Phần Hero Section:**

```tsx
<div className="flex gap-4 justify-center mt-8">
  <Button 
    onClick={() => router.push('/cv-analysis')}
    size="lg"
    className="gap-2"
  >
    <Sparkles className="w-5 h-5" />
    Phân tích CV
  </Button>
  
  <Button 
    onClick={() => router.push('/job-recommendations')}
    size="lg"
    variant="outline"
    className="gap-2"
  >
    <TrendingUp className="w-5 h-5" />
    Gợi ý việc làm AI
  </Button>
  
  <Button 
    onClick={() => router.push('/skill-gap-analysis')}
    size="lg"
    variant="outline"
    className="gap-2"
  >
    <Target className="w-5 h-5" />
    Phân tích kỹ năng
  </Button>
</div>
```

---

## ✅ **CHECKLIST IMPLEMENTATION**

- [ ] 1. Thêm button "Phân tích khoảng cách kỹ năng" vào Job Detail page
- [ ] 2. Thêm dropdown "AI & Kỹ năng" vào Header
- [ ] 3. Thêm Quick Actions buttons vào Hero Section (trang chủ)
- [ ] 4. Test navigation flow từ trang chủ đến tất cả các trang
- [ ] 5. Verify query params (`?jobId=xxx`) hoạt động đúng

---

## 🚀 **BONUS: Deep Links từ External**

Bạn cũng có thể truy cập trực tiếp:

```
http://localhost:3001/cv-analysis
http://localhost:3001/job-recommendations
http://localhost:3001/skill-gap-analysis
http://localhost:3001/skill-gap-analysis?jobId=674b5e6e8e3c4a5d12345678
http://localhost:3001/roadmaps
http://localhost:3001/roadmaps/674c1a2b3d4e5f6789012345
http://localhost:3001/insights
```

---

## 📝 **NOTES**

- **Authentication Required:** Tất cả các trang AI/NLP đều cần đăng nhập (candidate role)
- **API Token:** Đảm bảo có auth token trong localStorage
- **Query Params:** Khi chuyển từ Job Detail → Skill Gap Analysis, jobId được truyền qua URL
- **State Management:** Các trang sử dụng `useState` và `useEffect` để fetch data từ APIs

---

## 🎯 **TÓM TẮT**

**Để chuyển từ danh sách jobs sang các trang AI/NLP:**

1. **Trực tiếp:** Click "AI & Kỹ năng" trong header → Chọn trang
2. **Từ Job Detail:** Click button "Phân tích khoảng cách kỹ năng"
3. **Quick Actions:** Click buttons trong Hero Section (trang chủ)
4. **Direct URL:** Nhập trực tiếp đường dẫn vào browser

**Tất cả các trang đã được implement và sẵn sàng sử dụng!** ✅
