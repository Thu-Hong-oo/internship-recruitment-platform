# 🎓 Hệ Thống Xây Dựng Lộ Trình Phát Triển Kỹ Năng

## 📋 Tổng Quan

Hệ thống tạo **lộ trình học tập cá nhân hóa** dựa trên:
1. **Skill Gaps Analysis**: So sánh CV skills vs Job requirements
2. **AI Generation**: Sử dụng Gemini AI để tạo roadmap structure
3. **Intelligent Resource Recommendation**: Enhance với real resources từ RAG/Intelligent Recommendation
4. **Learning Theory**: Dựa trên Bloom's Taxonomy, Spaced Repetition, ZPD

---

## 🔄 Quy Trình Tạo Roadmap

### **Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT DATA                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ CV Data      │  │ Job Data    │  │ Target Role     │  │
│  │ - skills     │  │ - skills    │  │ - timeframe     │  │
│  │ - experience │  │ - required  │  │ - currentLevel  │  │
│  │ - education  │  │ - level     │  │                 │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│          STEP 1: Identify Skill Gaps                        │
│  _identifySkillGapsDetailed(cvData, jobData)                │
│                                                              │
│  Algorithm:                                                  │
│  1. Normalize skill names (lowercase, trim)                │
│  2. Compare CV skills vs Job skills                         │
│  3. Check if skill exists (substring matching)             │
│  4. Check if level needs improvement                        │
│  5. Calculate priority:                                     │
│     - Required skills → priority: 'critical', importance: 0.9│
│     - Nice-to-have → priority: 'medium', importance: 0.6    │
│     - Level gap → priority: 'high', importance: 0.7         │
│  6. Sort by importance (descending)                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│          STEP 2: Generate Roadmap Structure (AI)            │
│  _generateRoadmapWithAI(skillGaps, targetRole, timeframe)   │
│                                                              │
│  Method: Gemini AI (Google)                                 │
│  Fallback: _getDefaultRoadmapStructure()                   │
│                                                              │
│  AI Prompt includes:                                        │
│  - Skill gaps (top 8)                                       │
│  - Target role                                              │
│  - Current level                                            │
│  - Timeframe (weeks)                                        │
│                                                              │
│  AI generates:                                              │
│  - Phases (2-4 phases: Foundation → Specialization)         │
│  - Weeks với learning objectives                            │
│  - Resources (courses, videos, docs)                       │
│  - Projects & Assessments                                   │
│  - Milestones & Success Metrics                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│          STEP 3: Enhance with Real Resources                │
│  _enhanceWithRealResources(phases, context)                 │
│                                                              │
│  For each week:                                             │
│  1. Extract skill và learning objectives                   │
│  2. Determine current/target level từ skill gaps           │
│  3. Call ResourceRecommendationService:                     │
│     - RAG search (if available)                            │
│     - Intelligent recommendations (fallback)               │
│     - Health check URLs                                     │
│     - Credibility assessment                                │
│  4. Replace AI-generated resources với real resources      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│          OUTPUT: Personalized Learning Roadmap              │
│  {                                                           │
│    candidateId,                                             │
│    targetJobId,                                            │
│    targetRole,                                             │
│    currentLevel,                                           │
│    skillGaps: [...],                                       │
│    phases: [                                                │
│      {                                                      │
│        phaseNumber: 1,                                     │
│        title: "Foundation Phase",                         │
│        weeks: [                                            │
│          {                                                 │
│            weekNumber: 1,                                  │
│            focus: "JavaScript ES6",                        │
│            learningObjectives: [...],                      │
│            resources: [                                    │
│              {                                             │
│                type: "course",                             │
│                title: "...",                               │
│                url: "https://...",                        │
│                credibility: 0.85,                         │
│                ...                                         │
│              }                                             │
│            ],                                              │
│            projects: [...],                                │
│            assessments: [...]                             │
│          }                                                 │
│        ]                                                   │
│      }                                                     │
│    ],                                                      │
│    milestones: [...],                                     │
│    successMetrics: [...]                                  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Dữ Liệu Đầu Vào

### **1. CV Data (Candidate Profile)**
```javascript
{
  skills: [
    { name: "JavaScript", level: "beginner" },
    { name: "React", level: "none" }
  ],
  experience: [
    { company: "...", role: "...", duration: "1 year" }
  ],
  education: [
    { degree: "Bachelor", field: "Computer Science" }
  ],
  currentLevel: "beginner" // beginner | intermediate | advanced | expert
}
```

### **2. Job Data (Target Job)**
```javascript
{
  title: "Frontend Developer",
  skills: [
    { name: "React", level: "intermediate", required: true },
    { name: "TypeScript", level: "beginner", required: false },
    { name: "Redux", level: "intermediate", required: true }
  ],
  requirements: {
    experience: "2+ years",
    education: "Bachelor"
  }
}
```

### **3. Target Role & Timeframe**
```javascript
{
  targetRole: "Frontend Developer",
  timeframe: 12, // weeks
  currentLevel: "beginner"
}
```

---

## 🔍 Chi Tiết Các Bước

### **STEP 1: Identify Skill Gaps**

**Algorithm: `_identifySkillGapsDetailed`**

```javascript
// 1. Normalize skill names
cvSkillNames = cvSkills.map(s => s.name.toLowerCase());
jobSkillName = jobSkill.name.toLowerCase();

// 2. Check if skill exists (substring matching)
hasSkill = cvSkillNames.some(
  cvSkill => cvSkill.includes(jobSkillName) || 
             jobSkillName.includes(cvSkill)
);

// 3. If skill doesn't exist → Gap
if (!hasSkill) {
  skillGaps.push({
    skill: jobSkill.name,
    currentLevel: 'none',
    targetLevel: jobSkill.level || 'intermediate',
    priority: jobSkill.required ? 'critical' : 'medium',
    importance: jobSkill.required ? 0.9 : 0.6,
  });
}

// 4. If skill exists but level needs improvement
else if (needsLevelImprovement(currentLevel, targetLevel)) {
  skillGaps.push({
    skill: jobSkill.name,
    currentLevel,
    targetLevel,
    priority: 'high',
    importance: 0.7,
  });
}

// 5. Sort by importance
return skillGaps.sort((a, b) => b.importance - a.importance);
```

**Ví dụ:**
```
CV Skills: ["JavaScript (beginner)", "HTML (intermediate)"]
Job Skills: ["React (intermediate, required)", "TypeScript (beginner, optional)"]

Skill Gaps:
1. React: currentLevel='none', targetLevel='intermediate', priority='critical', importance=0.9
2. TypeScript: currentLevel='none', targetLevel='beginner', priority='medium', importance=0.6
```

---

### **STEP 2: Generate Roadmap Structure (Rule-Based Algorithm)** ✅ **TỰ LÀM**

**Method: `_generateRoadmapWithAI`** (sử dụng Rule-Based Generator)

**Primary:** Rule-Based Roadmap Generator (deterministic, có căn cứ)
**Optional:** AI Enhancement (nếu có GEMINI_API_KEY, chỉ enhance, không thay thế)

**Rule-Based Algorithm: `RuleBasedRoadmapGenerator`**

**Algorithm Steps:**
1. **Determine Phase Count**: Based on timeframe
   - <= 8 weeks: 2 phases
   - <= 16 weeks: 3 phases
   - > 16 weeks: 4 phases

2. **Create Phases**: Based on templates
   - Phase 1: Foundation (Bloom: Remember → Understand)
   - Phase 2: Intermediate (Bloom: Understand → Apply)
   - Phase 3: Advanced (Bloom: Apply → Analyze)
   - Phase 4: Specialization (Bloom: Analyze → Create)

3. **Distribute Skills**: By priority (critical > high > medium > low)
   - Critical skills → Early phases
   - Even distribution across phases

4. **Generate Weeks**: Rule-based
   - Distribute skills across weeks
   - Generate learning objectives based on Bloom's Taxonomy
   - Assign time commitment (12-15 hours/week)

5. **Generate Milestones**: Phase boundaries + midpoint

6. **Generate Success Metrics**: Standard templates

**Output Format:**
```json
{
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Foundation Phase",
      "duration": "4 weeks",
      "focus": "fundamentals",
      "bloomLevel": "remember",
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "React, TypeScript",
          "learningObjectives": [
            "Understand React basics",
            "Learn React fundamentals",
            "Learn TypeScript concepts"
          ],
          "timeCommitment": "12-15 hours/week",
          "resources": [], // Will be filled by _enhanceWithRealResources
          "projects": [],
          "assessments": []
        }
      ]
    }
  ],
  "milestones": [
    {
      "weekNumber": 6,
      "title": "Midpoint Review",
      "description": "Complete half of the learning roadmap",
      "criteria": ["Complete all projects from first half", "Pass all assessments"]
    }
  ],
  "successMetrics": [
    "Complete 80% of all exercises",
    "Build 3 portfolio projects",
    "Pass all weekly assessments",
    "Apply to 5 Frontend Developer positions"
  ],
  "difficulty": "intermediate"
}
```

**AI Enhancement (Optional):**
- Nếu có GEMINI_API_KEY: AI chỉ enhance (thêm objectives, project ideas, assessment suggestions)
- Rule-based structure vẫn là base, AI chỉ bổ sung
- Nếu AI fail → Fallback to rule-based only

**Fallback:** Nếu rule-based fail → `_getDefaultRoadmapStructure()`
- Template-based structure
- 3 phases (Foundation, Intermediate, Advanced)
- Default resources từ `_getDefaultResources()`

---

### **STEP 3: Enhance with Real Resources**

**Method: `_enhanceWithRealResources`**

**Process:**
```javascript
for (const phase of phases) {
  for (const week of phase.weeks) {
    // 1. Extract skill và objectives
    const focusSkill = week.focus; // "JavaScript ES6"
    const learningObjectives = week.learningObjectives;
    
    // 2. Find skill gap info
    const skillGap = context.skillGaps.find(
      gap => gap.skill.toLowerCase().includes(focusSkill.toLowerCase())
    );
    
    // 3. Call ResourceRecommendationService
    const recommendedResources = await resourceRecommendationService.recommendResources({
      skill: focusSkill,
      currentLevel: skillGap.currentLevel || 'beginner',
      targetLevel: skillGap.targetLevel || 'intermediate',
      phaseNumber: phase.phaseNumber,
      learningObjectives,
      weekNumber: week.weekNumber,
      totalWeeks: context.timeframe,
    });
    
    // 4. Replace AI-generated resources với real resources
    week.resources = recommendedResources; // ✅ Real URLs, validated
  }
}
```

**ResourceRecommendationService Flow:**
1. **RAG Search** (if vector DB available):
   - Semantic search với embeddings
   - Filter by metadata (level, type, rating)
   - Top 10 candidates

2. **Intelligent Recommendations** (fallback):
   - Default resources based on skill
   - Template-based recommendations

3. **Health Check**:
   - Validate URL format
   - Check URL health (HEAD request)
   - Filter dead links
   - Normalize URLs

4. **Credibility Assessment**:
   - Provider reputation (40%)
   - User rating (30%)
   - Resource type (20%)
   - Certificate offered (10%)

5. **Ranking & Diversification**:
   - Recommendation score = Credibility × 0.5 + Relevance × 0.3 + Fit × 0.2
   - MMR algorithm để đa dạng
   - Return top 5 resources

---

## 🎯 Căn Cứ Nghiên Cứu

### **1. Bloom's Taxonomy (1956)**
- **Remember**: Phase 1, Week 1-2 (introduction, basics)
- **Understand**: Phase 1, Week 3-4 (concepts, principles)
- **Apply**: Phase 2, Week 1-4 (practice, exercises)
- **Analyze**: Phase 3, Week 1-4 (advanced techniques)
- **Create**: Phase 4, Week 1-4 (build production apps)

### **2. Spaced Repetition Theory (Ebbinghaus, 1885)**
- Milestones tại intervals tăng dần
- Review points: Week 4, Week 8, Week 12
- Resources có review materials được ưu tiên

### **3. Zone of Proximal Development (Vygotsky, 1978)**
- Resources phải ở "zone" giữa current và target level
- Asymmetric penalty: Phạt nặng hơn khi quá khó (frustration > boredom)
- Progression tracking: Đảm bảo smooth learning

### **4. Source Credibility Theory (Hovland & Weiss, 1951)**
- Multi-factor scoring: Provider (40%) + Rating (30%) + Type (20%) + Cert (10%)
- Official docs > Courses > Videos > Articles

---

## 📝 Endpoint

### **POST `/api/nlp/learning-roadmap`**

**Request - TỐI THIỂU (Đơn giản nhất):**
```json
{
  "targetJobId": "692144d3c42961b41b9f50f5"
}
```
Hoặc:
```json
{
  "targetRole": "Frontend Developer"
}
```

**Request - ĐẦY ĐỦ (Nếu muốn override):**
```json
{
  "targetJobId": "692144d3c42961b41b9f50f5",
  "targetRole": "Frontend Developer", // Optional if targetJobId provided
  "timeframe": 12, // weeks, default: 12 (optional)
  "cvData": { // Optional - sẽ TỰ ĐỘNG lấy từ profile nếu không có
    "skills": [...],
    "experience": [...],
    "education": [...],
    "currentLevel": "beginner"
  }
}
```

**Lưu ý:**
- ✅ **Chỉ cần `targetJobId` HOẶC `targetRole`** (bắt buộc một trong hai)
- ✅ **`cvData` là optional** - Hệ thống tự động lấy từ `CandidateProfile`
- ✅ **`timeframe` là optional** - Default: 12 weeks
- ✅ Nếu có `targetJobId`, hệ thống tự động lấy `targetRole` từ job data

**Response:**
```json
{
  "success": true,
  "message": "Learning roadmap generated successfully",
  "data": {
    "_id": "...",
    "candidateId": "...",
    "targetJobId": "...",
    "targetRole": "Frontend Developer",
    "currentLevel": "beginner",
    "skillGaps": [
      {
        "skill": "React",
        "currentLevel": "none",
        "targetLevel": "intermediate",
        "priority": "critical",
        "importance": 0.9
      }
    ],
    "phases": [...],
    "milestones": [...],
    "successMetrics": [...],
    "totalDuration": "12 weeks",
    "estimatedTotalHours": 180,
    "difficulty": "intermediate"
  }
}
```

---

## 🔑 Điểm Quan Trọng

### **1. Skill Gaps Analysis**
- ✅ So sánh CV skills vs Job requirements
- ✅ Check level improvement needs
- ✅ Priority: Required > Nice-to-have
- ✅ Sort by importance

### **2. Roadmap Structure Generation**
- ✅ **Rule-Based Algorithm** (primary): Deterministic, reproducible, có căn cứ
- ✅ **AI Enhancement** (optional): Chỉ enhance, không thay thế
- ✅ Fallback to template nếu rule-based fail
- ✅ Generate phases, weeks, objectives dựa trên Bloom's Taxonomy

### **3. Resource Enhancement**
- ✅ Replace AI-generated resources với real resources
- ✅ RAG search (if available) hoặc Intelligent recommendations
- ✅ Health check URLs
- ✅ Credibility assessment

### **4. Personalization**
- ✅ Dựa trên skill gaps cụ thể
- ✅ Phù hợp với current level → target level
- ✅ Timing-aware (phase, week)
- ✅ Learning objectives cụ thể

---

## ⚠️ Limitations & Giải Pháp

### **1. AI Hallucination** ✅ **ĐÃ GIẢI QUYẾT**
**Vấn đề:** AI có thể generate fake URLs hoặc resources không tồn tại

**Giải pháp:**
- ✅ **Rule-Based Generator** thay thế AI cho structure generation
- ✅ `_enhanceWithRealResources()` replace resources với real resources từ RAG/Intelligent Recommendation
- ✅ Health check URLs trước khi trả về
- ✅ AI chỉ enhance (optional), không thay thế structure

### **2. Skill Matching**
**Vấn đề:** Substring matching có thể miss hoặc false positive

**Giải pháp:**
- ✅ Normalize skill names (lowercase, trim)
- ✅ Bidirectional substring matching
- ✅ Future: Semantic matching với embeddings

### **3. Resource Quality**
**Vấn đề:** Resources có thể không phù hợp với level

**Giải pháp:**
- ✅ Level-based matching trong ResourceRecommendationService
- ✅ Asymmetric penalty cho resources quá khó
- ✅ Fit score đảm bảo resources trong ZPD

---

## 📈 Kết Luận

Hệ thống xây dựng lộ trình phát triển kỹ năng dựa trên:

1. **Skill Gaps Analysis**: So sánh CV vs Job requirements (Rule-based)
2. **Rule-Based Roadmap Generation**: Deterministic algorithm dựa trên Bloom's Taxonomy, ZPD
3. **AI Enhancement** (Optional): Chỉ enhance, không thay thế
4. **Real Resource Enhancement**: RAG/Intelligent Recommendation với health check
5. **Learning Theory**: Bloom's Taxonomy, ZPD, Spaced Repetition

**Độ tin cậy:** ⭐⭐⭐⭐⭐ (5/5)
- ✅ **Rule-Based Algorithm**: Deterministic, reproducible, có căn cứ
- ✅ **Căn cứ khoa học rõ ràng**: Bloom's Taxonomy, ZPD, Spaced Repetition
- ✅ **Real resources**: RAG/Intelligent Recommendation với health check
- ✅ **Transparent**: Logic rõ ràng, có thể giải thích
- ✅ **Maintainable**: Dễ maintain và improve
- ⚠️ Skill matching có thể cải thiện với semantic search

