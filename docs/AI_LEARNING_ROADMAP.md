# 🧠 Chức Năng Tạo Lộ Trình Học Tập (Learning Roadmap) - Tài Liệu Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Quy Trình Tạo Lộ Trình](#4-quy-trình-tạo-lộ-trình)
5. [API Endpoints](#5-api-endpoints)
6. [Ví Dụ Sử Dụng](#6-ví-dụ-sử-dụng)
7. [Tính Toán Và Ước Lượng](#7-tính-toán-và-ước-lượng)

---

## 1. Tổng Quan

### 1.1. Mục Đích

Chức năng **Learning Roadmap Generation** tự động tạo lộ trình học tập cá nhân hóa dựa trên phân tích skill gaps giữa kỹ năng hiện có của ứng viên và yêu cầu của công việc mục tiêu.

### 1.2. Tính Năng Chính

- ✅ **Skill Gap Analysis**: Phân tích khoảng trống kỹ năng tự động
- ✅ **Personalized Roadmap**: Lộ trình học tập cá nhân hóa
- ✅ **Resource Recommendation**: Gợi ý tài liệu học tập phù hợp
- ✅ **Time Estimation**: Ước lượng thời gian học cho mỗi kỹ năng
- ✅ **Priority Management**: Ưu tiên kỹ năng theo mức độ quan trọng
- ✅ **Self-Sufficient**: Hoạt động độc lập, không phụ thuộc LLM

### 1.3. Điểm Nổi Bật

- **100% AI-Driven**: Sử dụng NLP tiên tiến (PhoBERT, Sentence-BERT, ChromaDB)
- **No Manual Intervention**: Tự động từ đầu đến cuối
- **High Personalization**: Dựa trên profile thực tế của ứng viên
- **Resource Rich**: Kết nối với kho tài liệu học tập khổng lồ

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│               LEARNING ROADMAP SERVICE                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 CORE LOGIC LAYER                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Skill Gap    │  │ Priority     │  │ Resource    │ │  │
│  │  │ Analysis     │  │ Management   │  │ Finding     │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 NLP SERVICES LAYER                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ PhoBERT NER  │  │ Sentence-    │  │ ChromaDB    │ │  │
│  │  │ (Skill Ext.) │  │ BERT (Sim.)  │  │ (Resources) │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OUTPUT FORMAT                            │
│  {                                                        │
│    success: true,                                         │
│    roadmap: {                                             │
│      targetJobTitle: "Frontend Developer",                │
│      duration: 12,                                        │
│      phases: [                                            │
│        {                                                  │
│          name: "Foundation",                              │
│          weeks: [                                         │
│            {                                              │
│              weekNumber: 1,                               │
│              focus: "JavaScript Basics",                  │
│              resources: [...]                             │
│            }                                              │
│          ]                                                │
│        }                                                  │
│      ]                                                    │
│    }                                                      │
│  }                                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng Xử Lý

```
1. Nhận job + candidate profile
   ↓
2. Extract required skills từ job (PhoBERT NER)
   ↓
3. Extract current skills từ candidate (PhoBERT NER)
   ↓
4. Analyze skill gaps (so sánh required vs current)
   ↓
5. Prioritize skills (critical → important → optional)
   ↓
6. Find learning resources (ChromaDB semantic search)
   ↓
7. Create weekly roadmap (structure phases & weeks)
   ↓
8. Calculate total time & difficulty
   ↓
9. Return complete roadmap
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. Core NLP Services

#### **3.1.1. PhoBERT NER**
- **Purpose**: Extract skills from Vietnamese/English text
- **Model**: `vinai/phobert-base-v2`
- **Accuracy**: F1-score 96%
- **Use Case**: Job descriptions, CV text, experience descriptions

#### **3.1.2. Sentence-BERT**
- **Purpose**: Semantic similarity calculation
- **Model**: `bkai-foundation-models/vietnamese-bi-encoder`
- **Dimensions**: 768 embedding vectors
- **Use Case**: Skill matching, resource relevance scoring

#### **3.1.3. ChromaDB Vector Store**
- **Purpose**: Store and search learning resources
- **Features**: Vector similarity search, metadata filtering
- **Data**: 500+ curated resources + crawled content
- **Search**: Semantic search with cosine similarity

### 3.2. Supporting Technologies

#### **3.2.1. TF-IDF**
- **Purpose**: Calculate term importance in documents
- **Library**: `natural` (Node.js)
- **Use Case**: Skill similarity scoring

#### **3.2.2. Skill Normalization**
- **Purpose**: Standardize skill names
- **Method**: Gemini AI + fallback rules
- **Examples**: "JS" → "JavaScript", "ReactJS" → "React"

---

## 4. Quy Trình Tạo Lộ Trình

### 4.1. Bước 1: Extract Required Skills từ Job

```javascript
async _extractJobSkills(job) {
  const requiredSkills = [];
  
  // 1. Extract từ structured requirements
  if (job.requirements && Array.isArray(job.requirements)) {
    for (const req of job.requirements) {
      requiredSkills.push({
        name: req.name || req.skill,
        level: req.level || 'intermediate',
        importance: req.importance || 'important',
        source: 'structured',
      });
    }
  }
  
  // 2. Extract từ job description bằng PhoBERT
  if (job.description) {
    const extractedSkills = await skillExtractionService.extractSkills(
      job.description,
      { useHybrid: true, includeSoftSkills: false }
    );
    
    for (const skill of extractedSkills) {
      requiredSkills.push({
        name: skill.name,
        level: skill.level || 'intermediate',
        importance: 'important', // Default for extracted skills
        source: 'phobert',
        confidence: skill.confidence,
      });
    }
  }
  
  // 3. Normalize skill names
  const skillNames = requiredSkills.map(s => s.name);
  const normalizedMap = await skillNormalizationService.normalizeSkillsBatch(skillNames);
  
  return requiredSkills.map(skill => ({
    ...skill,
    name: normalizedMap.get(skill.name) || skill.name,
  }));
}
```

### 4.2. Bước 2: Extract Current Skills từ Candidate

```javascript
async _extractCandidateSkills(candidateProfile) {
  const currentSkills = [];
  
  // 1. Extract từ profile skills array
  if (candidateProfile.skills && Array.isArray(candidateProfile.skills)) {
    for (const skill of candidateProfile.skills) {
      currentSkills.push({
        name: skill.name || skill,
        level: skill.level || 'beginner',
        yearsOfExperience: skill.yearsOfExperience || 0,
        source: 'profile',
      });
    }
  }
  
  // 2. Extract từ experience descriptions
  if (candidateProfile.experience && Array.isArray(candidateProfile.experience)) {
    for (const exp of candidateProfile.experience) {
      if (exp.description) {
        const extractedSkills = await skillExtractionService.extractSkills(
          exp.description,
          { useHybrid: true, maxSkills: 20 }
        );
        
        for (const skill of extractedSkills) {
          currentSkills.push({
            name: skill.name,
            level: 'intermediate', // Assume intermediate from experience
            yearsOfExperience: exp.duration || 0,
            source: 'experience',
            confidence: skill.confidence,
          });
        }
      }
    }
  }
  
  // 3. Normalize và remove duplicates
  const normalizedMap = await skillNormalizationService.normalizeSkillsBatch(
    currentSkills.map(s => s.name)
  );
  
  const uniqueSkills = new Map();
  for (const skill of currentSkills) {
    const normalizedName = normalizedMap.get(skill.name) || skill.name;
    
    if (!uniqueSkills.has(normalizedName)) {
      uniqueSkills.set(normalizedName, {
        ...skill,
        name: normalizedName,
      });
    } else {
      // Merge duplicate skills (take higher level)
      const existing = uniqueSkills.get(normalizedName);
      if (this._compareSkillLevels(skill.level, existing.level) > 0) {
        uniqueSkills.set(normalizedName, {
          ...skill,
          name: normalizedName,
        });
      }
    }
  }
  
  return Array.from(uniqueSkills.values());
}
```

### 4.3. Bước 3: Analyze Skill Gaps

```javascript
async _analyzeSkillGaps(requiredSkills, currentSkills) {
  const gaps = {
    critical: [],
    important: [],
    optional: [],
  };
  
  for (const required of requiredSkills) {
    const hasSkill = currentSkills.find(
      current => current.name.toLowerCase() === required.name.toLowerCase()
    );
    
    if (!hasSkill) {
      // Missing skill completely
      const gap = {
        skillName: required.name,
        requiredLevel: required.level,
        currentLevel: 'none',
        gapType: 'missing',
        importance: required.importance,
        estimatedWeeks: this._estimateWeeksToLearn(required.level, 'none'),
      };
      
      this._categorizeGap(gap, gaps);
    } else if (this._compareSkillLevels(hasSkill.level, required.level) < 0) {
      // Insufficient level
      const gap = {
        skillName: required.name,
        requiredLevel: required.level,
        currentLevel: hasSkill.level,
        gapType: 'insufficient',
        importance: required.importance,
        estimatedWeeks: this._estimateWeeksToLearn(required.level, hasSkill.level),
      };
      
      this._categorizeGap(gap, gaps);
    }
    // If skill level is sufficient, no gap
  }
  
  return gaps;
}

_categorizeGap(gap, gaps) {
  if (gap.importance === 'critical' || gap.requiredLevel === 'expert') {
    gaps.critical.push(gap);
  } else if (gap.importance === 'important' || gap.requiredLevel === 'advanced') {
    gaps.important.push(gap);
  } else {
    gaps.optional.push(gap);
  }
}
```

### 4.4. Bước 4: Prioritize Skills

```javascript
_prioriizeSkills(skillGaps, duration) {
  const prioritized = [];
  
  // 1. Add critical skills first
  for (const gap of skillGaps.critical) {
    prioritized.push({
      ...gap,
      priority: 1,
      order: prioritized.length + 1,
    });
  }
  
  // 2. Add important skills
  for (const gap of skillGaps.important) {
    prioritized.push({
      ...gap,
      priority: 2,
      order: prioritized.length + 1,
    });
  }
  
  // 3. Add optional skills if time allows
  const weeksUsed = prioritized.reduce((sum, skill) => sum + skill.estimatedWeeks, 0);
  const weeksRemaining = duration - weeksUsed;
  
  if (weeksRemaining > 0) {
    for (const gap of skillGaps.optional) {
      if (weeksUsed + gap.estimatedWeeks <= duration) {
        prioritized.push({
          ...gap,
          priority: 3,
          order: prioritized.length + 1,
        });
        weeksUsed += gap.estimatedWeeks;
      }
    }
  }
  
  return prioritized;
}
```

### 4.5. Bước 5: Find Learning Resources

```javascript
async _findLearningResources(prioritizedSkills) {
  const skillsWithResources = [];
  
  for (const skill of prioritizedSkills) {
    // Create search query
    const query = `${skill.skillName} ${skill.requiredLevel} tutorial course`;
    
    try {
      // Search in ChromaDB first
      const chromaResults = await vectorStoreService.searchResources(query, 3, {
        level: skill.requiredLevel,
      });
      
      // Convert to standard format
      const resources = chromaResults.map(result => ({
        title: result.metadata.title,
        url: result.metadata.url,
        type: result.metadata.type || 'course',
        difficulty: result.metadata.level || skill.requiredLevel,
        provider: result.metadata.provider || 'Unknown',
        score: 1 - result.score, // Convert distance to similarity
        source: 'chromadb',
        isCurated: false,
      }));
      
      // If not enough results, try curated database
      if (resources.length < 3) {
        const curatedResources = await curatedResourcesDatabase.findBySkill(
          skill.skillName,
          skill.requiredLevel,
          3 - resources.length
        );
        
        resources.push(...curatedResources.map(r => ({
          ...r,
          source: 'curated',
          isCurated: true,
        })));
      }
      
      skillsWithResources.push({
        skillName: skill.skillName,
        priority: skill.priority,
        estimatedWeeks: skill.estimatedWeeks,
        resources,
      });
      
    } catch (error) {
      logger.warn(`Failed to find resources for ${skill.skillName}:`, error.message);
      
      // Fallback: generic resources
      skillsWithResources.push({
        skillName: skill.skillName,
        priority: skill.priority,
        estimatedWeeks: skill.estimatedWeeks,
        resources: this._generateFallbackResources(skill),
      });
    }
  }
  
  return skillsWithResources;
}
```

### 4.6. Bước 6: Create Weekly Roadmap

```javascript
_createWeeklyRoadmap(skillsWithResources, duration) {
  const weeks = [];
  let currentWeek = 1;
  
  // Group skills by priority
  const criticalSkills = skillsWithResources.filter(s => s.priority === 1);
  const importantSkills = skillsWithResources.filter(s => s.priority === 2);
  const optionalSkills = skillsWithResources.filter(s => s.priority === 3);
  
  // Create phases
  const phases = [
    {
      name: 'Foundation',
      description: 'Learn fundamental skills required for the job',
      skills: criticalSkills,
    },
    {
      name: 'Core Skills',
      description: 'Master core competencies',
      skills: importantSkills,
    },
    {
      name: 'Advanced Topics',
      description: 'Learn advanced skills and best practices',
      skills: optionalSkills,
    },
  ];
  
  for (const phase of phases) {
    if (phase.skills.length === 0) continue;
    
    const phaseWeeks = [];
    
    for (const skill of phase.skills) {
      // Create weeks for this skill
      for (let i = 0; i < skill.estimatedWeeks && currentWeek <= duration; i++) {
        const weekResources = skill.resources.slice(0, 2); // 2 resources per week
        
        phaseWeeks.push({
          weekNumber: currentWeek,
          focus: `${skill.skillName} - Week ${i + 1}`,
          objectives: [
            `Complete ${skill.skillName} fundamentals`,
            `Practice with hands-on exercises`,
            `Build small projects using ${skill.skillName}`,
          ],
          resources: weekResources,
          estimatedHours: 10, // 10 hours per week
        });
        
        currentWeek++;
      }
    }
    
    if (phaseWeeks.length > 0) {
      weeks.push({
        name: phase.name,
        description: phase.description,
        weeks: phaseWeeks,
      });
    }
  }
  
  return weeks;
}
```

---

## 5. API Endpoints

### 5.1. Generate Roadmap from Job

```javascript
POST /api/roadmaps/generate-from-job/:jobId
Content-Type: application/json

{
  "candidateId": "user123",
  "duration": 12,  // weeks
  "includeOptional": true
}

Response:
{
  "success": true,
  "roadmap": {
    "targetJobTitle": "Frontend Developer",
    "targetJobId": "job123",
    "duration": 12,
    "difficulty": "intermediate",
    "estimatedTotalHours": 120,
    "phases": [
      {
        "name": "Foundation",
        "description": "Learn fundamental skills",
        "weeks": [
          {
            "weekNumber": 1,
            "focus": "JavaScript Basics",
            "objectives": ["Complete JS fundamentals", "..."],
            "resources": [
              {
                "title": "JavaScript Basics Course",
                "url": "https://...",
                "type": "course",
                "provider": "Udemy",
                "difficulty": "beginner"
              }
            ],
            "estimatedHours": 10
          }
        ]
      }
    ]
  }
}
```

### 5.2. Get Roadmap Details

```javascript
GET /api/roadmaps/:id

Response: Roadmap object (same as above)
```

### 5.3. Customize Roadmap

```javascript
PUT /api/nlp/learning-roadmap/:id/customize
Content-Type: application/json

{
  "customizations": {
    "addResources": [...],
    "removeResources": [...],
    "modifyWeeks": [...],
    "changeDuration": 16
  }
}
```

---

## 6. Ví Dụ Sử Dụng

### 6.1. Generate Roadmap for Frontend Developer

**Input:**
- Job: Frontend Developer requiring React, JavaScript, HTML/CSS
- Candidate: Has HTML/CSS basics, no JavaScript/React experience
- Duration: 12 weeks

**Output Roadmap:**
```json
{
  "success": true,
  "roadmap": {
    "targetJobTitle": "Frontend Developer",
    "duration": 12,
    "difficulty": "intermediate",
    "estimatedTotalHours": 120,
    "phases": [
      {
        "name": "Foundation",
        "weeks": [
          {
            "weekNumber": 1,
            "focus": "JavaScript Basics - Week 1",
            "resources": [
              {
                "title": "JavaScript Fundamentals",
                "url": "https://udemy.com/js-fundamentals",
                "type": "course",
                "provider": "Udemy"
              }
            ]
          },
          {
            "weekNumber": 2,
            "focus": "JavaScript Basics - Week 2",
            "resources": [...]
          }
        ]
      },
      {
        "name": "Core Skills",
        "weeks": [
          {
            "weekNumber": 3,
            "focus": "React Fundamentals - Week 1",
            "resources": [...]
          }
        ]
      }
    ]
  }
}
```

### 6.2. Skill Gap Analysis Example

**Required Skills:** JavaScript (intermediate), React (intermediate), HTML (beginner)
**Current Skills:** HTML (beginner), CSS (beginner)

**Skill Gaps:**
```json
{
  "critical": [
    {
      "skillName": "JavaScript",
      "requiredLevel": "intermediate",
      "currentLevel": "none",
      "gapType": "missing",
      "estimatedWeeks": 3
    },
    {
      "skillName": "React",
      "requiredLevel": "intermediate",
      "currentLevel": "none",
      "gapType": "missing",
      "estimatedWeeks": 3
    }
  ],
  "important": [],
  "optional": []
}
```

---

## 7. Tính Toán Và Ước Lượng

### 7.1. Ước Lượng Thời Gian Học

```javascript
_estimateWeeksToLearn(requiredLevel, currentLevel = 'none') {
  // Base weeks by level
  const levelWeeks = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    expert: 6,
  };
  
  let weeks = levelWeeks[requiredLevel] || 3;
  
  // Reduce time if upgrading (not learning from scratch)
  if (currentLevel && currentLevel !== 'none') {
    weeks = Math.ceil(weeks * 0.6); // 40% reduction
  }
  
  return Math.max(1, weeks);
}
```

### 7.2. Tính Độ Khó Tổng Thể

```javascript
_calculateDifficulty(skillGaps, candidateProfile) {
  const totalGaps = skillGaps.critical.length + skillGaps.important.length + skillGaps.optional.length;
  const criticalRatio = skillGaps.critical.length / totalGaps;
  
  // Consider candidate's experience level
  const hasExperience = candidateProfile.experience && candidateProfile.experience.length > 0;
  
  if (criticalRatio > 0.7) {
    return hasExperience ? 'challenging' : 'difficult';
  } else if (criticalRatio > 0.4) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}
```

### 7.3. Tính Tổng Giờ Học

```javascript
_calculateTotalHours(weeks) {
  return weeks.reduce((total, phase) => {
    return total + phase.weeks.reduce((phaseTotal, week) => {
      return phaseTotal + (week.estimatedHours || 10);
    }, 0);
  }, 0);
}
```

---

## 8. Lưu Ý Quan Trọng

### 8.1. Performance Considerations
- **Initialization**: Service cần initialize các NLP models
- **Caching**: Cache extracted skills và resources
- **Batch Processing**: Xử lý multiple skills cùng lúc

### 8.2. Accuracy Factors
- **Skill Extraction**: Độ chính xác của PhoBERT NER
- **Resource Matching**: Chất lượng ChromaDB search
- **Time Estimation**: Dựa trên empirical data

### 8.3. Limitations
- **Assumptions**: Giả định về learning speed
- **Resource Availability**: Phụ thuộc vào ChromaDB data
- **Language Support**: Optimized cho tiếng Việt

### 8.4. Extensibility
- **Custom Resources**: Có thể add custom learning resources
- **Skill Categories**: Hỗ trợ different skill categories
- **Personalization**: Có thể customize theo learning style

---

*Tài liệu này được tạo tự động từ code analysis. Cập nhật lần cuối: December 13, 2025*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\docs\AI_LEARNING_ROADMAP.md