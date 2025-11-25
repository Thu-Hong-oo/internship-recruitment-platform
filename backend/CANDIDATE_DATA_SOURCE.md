# 📋 Nguồn Dữ Liệu Ứng Viên: CV Upload vs Profile Tự Nhập

## 🎯 Tóm Tắt

Hệ thống lấy thông tin kỹ năng, kinh nghiệm, và sự hiểu biết của ứng viên từ **PROFILE** (đã được điền từ CV upload bằng AI hoặc tự nhập thủ công).

---

## 🔄 Luồng Xử Lý Chi Tiết

### **1. Upload CV (Có AI Parse Tự Động)** ✅

#### **Bước 1: Upload CV File**
```
Ứng viên upload CV (PDF/DOC/DOCX)
    ↓
ResumeController._parseAndUploadResume()
```

#### **Bước 2: AI Parse CV**
```javascript
// backend/src/controllers/candidate/ResumeController.js
parseResult = await aiService.parseResumeFromBuffer(
  req.file.buffer,
  req.file.mimetype
);
```

**AI Service: Google Gemini AI** ✅
- **Model**: `process.env.GEMINI_MODEL || 'gemini-pro'` (default: `gemini-pro`)
- **Có thể dùng**: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`
- **Fallback**: Nếu Gemini API fail (quota limit, timeout, no API key) → Dùng rule-based parsing

**AI (Gemini) trích xuất:**
- ✅ **Personal Info**: Họ tên, email, phone, address, dateOfBirth
- ✅ **Skills**: Technical skills, soft skills, languages (với level)
- ✅ **Experience**: Internships, work experience (position, company, dates, description)
- ✅ **Education**: University, degree, major, graduation year, GPA
- ✅ **Certificates**: Chứng chỉ, bằng cấp
- ✅ **Awards**: Giải thưởng, thành tích

#### **Bước 3: Lưu Parsed Data**
```javascript
// Lưu vào profile.resume.current.aiAnalysis
newResumeEntry = {
  aiAnalysis: {
    extractedData: parseResult.extractedData,
    skills: parseResult.skills,
    suggestions: parseResult.suggestions,
    analyzedAt: new Date(),
  }
}
```

#### **Bước 4: Tự Động Điền Vào Profile** ✅ **QUAN TRỌNG**
```javascript
// backend/src/controllers/candidate/ResumeController.js (line 919-926)
if (parseResult && parseResult.extractedData) {
  const profileController = new ProfileController();
  await profileController.mapParsedCVToProfile(profile);
}
```

**Hàm `mapParsedCVToProfile()` tự động điền:**
- ✅ Skills → `profile.skills.technical[]`, `profile.skills.soft[]`, `profile.skills.languages[]`
- ✅ Experience → `profile.experience.internships[]`
- ✅ Education → `profile.education.university`
- ✅ Personal Info → `profile.personalInfo`

**Kết quả:** Profile được tự động điền từ CV, ứng viên có thể chỉnh sửa sau.

---

### **2. Profile Tự Nhập (Không Upload CV)** ✅

Ứng viên có thể:
- ✅ Tự nhập skills vào profile
- ✅ Tự nhập experience vào profile
- ✅ Tự nhập education vào profile
- ✅ Chỉnh sửa thông tin đã được điền từ CV

**Lưu trữ:** Tất cả thông tin lưu trong `CandidateProfile` model.

---

### **3. Generate Learning Roadmap: Lấy Dữ Liệu Từ Đâu?** 🎯

#### **Luồng Xử Lý:**

```javascript
// backend/src/controllers/advancedNLPController.js (line 238-409)
async generateLearningRoadmap(req, res) {
  const { cvData, targetJobId, targetRole, timeframe } = req.body;
  
  let candidateData = cvData; // Bước 1: Kiểm tra cvData từ request body
  
  if (!candidateData) {
    // Bước 2: Nếu không có cvData, lấy từ PROFILE
    const profile = await CandidateProfile.findOne({
      userId: candidateId,
    });
    
    if (profile) {
      // Convert từ profile format sang array format
      candidateData = {
        skills: convertSkillsFromProfile(profile.skills),
        experience: convertExperienceFromProfile(profile.experience),
        education: convertEducationFromProfile(profile.education),
        currentLevel: calculateCurrentLevel(profile.experience),
      };
    }
  }
  
  // Bước 3: Generate roadmap với candidateData
  const roadmap = await aiService.generatePersonalizedRoadmap({
    cvData: candidateData,
    // ...
  });
}
```

#### **Ưu Tiên:**

1. **Nếu có `cvData` trong request body** → Dùng `cvData` (cho phép override)
2. **Nếu không có `cvData`** → Lấy từ `CandidateProfile` (đã được điền từ CV hoặc tự nhập)

---

## 📊 So Sánh: CV Upload vs Profile Tự Nhập

| Aspect | CV Upload (AI Parse) | Profile Tự Nhập |
|--------|---------------------|-----------------|
| **Nguồn dữ liệu** | CV file (PDF/DOC/DOCX) | Form input |
| **Xử lý** | AI (Gemini) parse tự động | Ứng viên nhập thủ công |
| **Tự động điền** | ✅ Có (tự động điền vào profile) | ❌ Không (nhập trực tiếp) |
| **Độ chính xác** | ⚠️ Phụ thuộc vào AI parsing | ✅ Ứng viên tự kiểm soát |
| **Tốc độ** | ⚡ Nhanh (1 lần upload) | 🐌 Chậm (nhập từng field) |
| **Lưu trữ** | `profile.resume.current.aiAnalysis` + `profile.skills/experience/education` | `profile.skills/experience/education` |
| **Generate Roadmap** | Lấy từ `profile` | Lấy từ `profile` |

---

## 🎯 Kết Luận

### **Câu Trả Lời:**

**Hệ thống lấy thông tin từ PROFILE** (đã được điền từ CV upload bằng AI hoặc tự nhập thủ công).

**Luồng:**
1. **Upload CV** → AI parse → **Tự động điền vào Profile** ✅
2. **Tự nhập** → **Lưu trực tiếp vào Profile** ✅
3. **Generate Roadmap** → **Lấy từ Profile** (hoặc `cvData` trong request nếu có) ✅

### **Lợi Ích:**

✅ **Nhất quán**: Tất cả thông tin đều lưu trong Profile
✅ **Linh hoạt**: Ứng viên có thể upload CV hoặc tự nhập
✅ **Tự động hóa**: AI parse CV và tự động điền, tiết kiệm thời gian
✅ **Có thể chỉnh sửa**: Ứng viên có thể chỉnh sửa thông tin sau khi được điền từ CV

---

## 🤖 AI Service Details

### **AI được dùng: Google Gemini AI**

**Model Configuration:**
```javascript
// backend/src/services/aiService.js (line 8, 220-232)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
this.model = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    maxOutputTokens: 2048,
  }
});
```

**Supported Models:**
- ✅ `gemini-pro` (default)
- ✅ `gemini-1.5-flash`
- ✅ `gemini-1.5-pro`
- ✅ `gemini-2.0-flash-exp`

### **Fallback Mechanism** ✅

**Khi Gemini API fail:**
1. **Quota limit** → Fallback to rule-based parsing
2. **Timeout** → Fallback to rule-based parsing
3. **No API key** → Fallback to rule-based parsing
4. **Model not found** → Fallback to rule-based parsing

**Rule-based parsing** (`fallbackParseResume()`):
- ✅ Extract text từ CV file
- ✅ Regex patterns để extract: personal info, education, experience
- ✅ Enhanced skill extraction (keyword matching)
- ✅ Certificates & awards extraction

**Code:**
```javascript
// backend/src/services/aiService.js (line 761-794)
fallbackParseResume() {
  // Rule-based parsing với regex patterns
  // Extract: personalInfo, education, experience, skills, certificates
}
```

### **Lỗi Thường Gặp & Giải Pháp**

#### **1. Gemini API Quota Limit** ⚠️
```
Error: QuotaFailure - GenerateRequestsPerMinutePerProjectPerModel-FreeTier
```
**Giải pháp:**
- ✅ Hệ thống tự động fallback sang rule-based parsing
- ✅ Hoặc đợi 48 giây (theo retry delay)
- ✅ Hoặc upgrade Gemini API plan

#### **2. Cloudinary Upload Timeout** ⚠️
```
Error: Request Timeout (file upload)
```
**Giải pháp:**
- ✅ Tăng timeout cho Cloudinary upload
- ✅ Hoặc dùng local storage thay vì Cloudinary

---

## 📝 Code References

- **CV Upload & Parse**: `backend/src/controllers/candidate/ResumeController.js` (line 877-945)
- **Auto-fill Profile**: `backend/src/controllers/candidate/ProfileController.js` (line 47-293)
- **Generate Roadmap**: `backend/src/controllers/advancedNLPController.js` (line 238-409)
- **AI Parse Service**: `backend/src/services/aiService.js` (line 346-568)
- **Fallback Parsing**: `backend/src/services/aiService.js` (line 761-794)

