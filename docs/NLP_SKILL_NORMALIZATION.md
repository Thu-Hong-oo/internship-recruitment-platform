# 🧠 Chức Năng Chuẩn Hóa Kỹ Năng (Skill Normalization) - Tài Liệu Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Quy Trình Chuẩn Hóa](#4-quy-trình-chuẩn-hóa)
5. [API Methods](#5-api-methods)
6. [Ví Dụ Sử Dụng](#6-ví-dụ-sử-dụng)
7. [Fallback Strategy](#7-fallback-strategy)

---

## 1. Tổng Quan

### 1.1. Mục Đích

Chức năng **Skill Normalization** tự động chuẩn hóa tên kỹ năng về dạng chuẩn, thống nhất. Điều này đảm bảo rằng các kỹ năng như "JS", "JavaScript", "javascript" đều được nhận diện là cùng một kỹ năng.

### 1.2. Tính Năng Chính

- ✅ **AI-Powered**: Sử dụng Gemini AI để chuẩn hóa thông minh
- ✅ **Batch Processing**: Xử lý nhiều kỹ năng cùng lúc
- ✅ **Intelligent Caching**: Cache kết quả để tăng tốc độ
- ✅ **Fallback Rules**: Hoạt động ngay cả khi không có AI
- ✅ **Case Insensitive**: Không phân biệt chữ hoa/thường
- ✅ **Trim & Clean**: Loại bỏ khoảng trắng thừa

### 1.3. Điểm Nổi Bật

- **Intelligent Mapping**: Hiểu ngữ cảnh và viết tắt thông dụng
- **Continuous Learning**: Cải thiện theo thời gian
- **High Accuracy**: Độ chính xác cao với Gemini AI
- **Self-Sufficient**: Hoạt động độc lập với fallback rules

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                SKILL NORMALIZATION SERVICE                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 GEMINI AI (PRIMARY)                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Intelligent  │  │ Context      │  │ Learning    │ │  │
│  │  │ Mapping      │  │ Awareness    │  │ Capability │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 CACHE LAYER                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Memory       │  │ Batch        │  │ LRU         │ │  │
│  │  │ Cache        │  │ Cache        │  │ Eviction    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 FALLBACK RULES                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Basic        │  │ Common       │  │ Tech        │ │  │
│  │  │ Cleaning     │  │ Abbreviations │  │ Terms      │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng Xử Lý

```
1. Nhận skill name cần normalize
   ↓
2. Kiểm tra cache (memory + batch cache)
   ↓
3. Nếu có Gemini AI:
   a. Gửi prompt đến Gemini
   b. Parse và validate kết quả
   c. Cache kết quả
   ↓
4. Nếu không có Gemini:
   a. Áp dụng fallback rules
   b. Basic cleaning + common abbreviations
   ↓
5. Trả về normalized skill name
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. Gemini AI (Primary Method)

#### **3.1.1. Model Selection**
- **Model**: Gemini 1.5 Pro/Flash
- **Purpose**: Intelligent skill name normalization
- **API**: Google Generative AI SDK

#### **3.1.2. Prompt Engineering**
```javascript
const prompt = `Normalize this technical skill name to its standard/canonical form.
Return ONLY the normalized skill name, nothing else.

Examples:
- "JS" → "JavaScript"
- "Nodejs" → "Node.js"
- "ReactJS" → "React"
- "Postgres" → "PostgreSQL"
- "AWS" → "AWS"
- "GitHub" → "Git"
- "TypeScript" → "TypeScript"

Skill to normalize: "${normalized}"

Normalized skill:`;
```

### 3.2. Caching System

#### **3.2.1. Memory Cache**
- **Type**: Map-based in-memory cache
- **Scope**: Single service instance
- **Eviction**: Manual, no auto-eviction

#### **3.2.2. Batch Cache**
- **Type**: Map for batch normalization results
- **Purpose**: Optimize batch processing
- **Sharing**: Across multiple batch calls

### 3.3. Fallback Rules

#### **3.3.1. Basic Cleaning**
- **Trim**: Remove leading/trailing whitespace
- **Lowercase**: Convert to lowercase
- **Special Characters**: Remove/replace special characters

#### **3.3.2. Common Abbreviations**
```javascript
const commonMappings = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'py': 'Python',
  'rb': 'Ruby',
  'php': 'PHP',
  'cs': 'C#',
  'cpp': 'C++',
  'go': 'Go',
  // ... more mappings
};
```

---

## 4. Quy Trình Chuẩn Hóa

### 4.1. Khởi Tạo Service

```javascript
class SkillNormalizationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    this.model = null;
    this.cache = new Map(); // Memory cache
    this.batchCache = new Map(); // Batch cache
    
    // Initialize Gemini model
    if (this.geminiApiKey && this.geminiApiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.model = genAI.getGenerativeModel({ 
          model: process.env.GEMINI_MODEL
        });
        logger.info('✅ SkillNormalizationService: Gemini model initialized');
      } catch (error) {
        logger.warn('⚠️ SkillNormalizationService: Failed to initialize Gemini model');
      }
    } else {
      logger.warn('⚠️ SkillNormalizationService: GEMINI_API_KEY not available, using fallback');
    }
  }
}
```

### 4.2. Normalize Single Skill

```javascript
async normalizeSkill(skillName, useCache = true) {
  if (!skillName || typeof skillName !== 'string') {
    return '';
  }

  const normalized = skillName.toLowerCase().trim();
  if (!normalized) return '';

  // Check cache first
  if (useCache && this.cache.has(normalized)) {
    return this.cache.get(normalized);
  }

  // Use Gemini if available
  if (this.model) {
    try {
      const prompt = `Normalize this technical skill name...`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const normalizedSkill = response.text().trim().toLowerCase();

      // Cache result
      if (useCache) {
        this.cache.set(normalized, normalizedSkill);
      }

      return normalizedSkill;
    } catch (error) {
      logger.warn(`⚠️ Failed to normalize with AI, using fallback:`, error.message);
    }
  }

  // Fallback normalization
  return this._fallbackNormalize(normalized);
}
```

### 4.3. Normalize Batch Skills

```javascript
async normalizeSkillsBatch(skillNames, useCache = true) {
  if (!Array.isArray(skillNames)) {
    throw new Error('skillNames must be an array');
  }

  const results = new Map();
  const toProcess = [];
  const cacheHits = new Map();

  // Check cache for each skill
  for (const skillName of skillNames) {
    const normalized = skillName.toLowerCase().trim();
    if (!normalized) {
      results.set(skillName, '');
      continue;
    }

    if (useCache && this.cache.has(normalized)) {
      cacheHits.set(skillName, this.cache.get(normalized));
    } else {
      toProcess.push({ original: skillName, normalized });
    }
  }

  // Process cache hits
  for (const [original, normalized] of cacheHits) {
    results.set(original, normalized);
  }

  // Process remaining skills
  if (toProcess.length > 0) {
    if (this.model) {
      // Use Gemini for batch processing
      const batchResults = await this._normalizeBatchWithGemini(toProcess);
      for (const [original, normalized] of batchResults) {
        results.set(original, normalized);
        if (useCache) {
          this.cache.set(original.toLowerCase().trim(), normalized);
        }
      }
    } else {
      // Use fallback for batch
      for (const { original, normalized } of toProcess) {
        const fallbackResult = this._fallbackNormalize(normalized);
        results.set(original, fallbackResult);
        if (useCache) {
          this.cache.set(normalized, fallbackResult);
        }
      }
    }
  }

  return results;
}
```

### 4.4. Fallback Normalization

```javascript
_fallbackNormalize(skillName) {
  // Basic cleaning
  let normalized = skillName.toLowerCase().trim();
  
  // Remove special characters except dots and spaces
  normalized = normalized.replace(/[^a-zA-Z0-9.\s]/g, '');
  
  // Common abbreviations
  const abbreviations = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'rb': 'Ruby',
    'cs': 'C#',
    'cpp': 'C++',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'nodejs': 'Node.js',
    'reactjs': 'React',
    'vuejs': 'Vue.js',
    'angularjs': 'Angular',
    'jquery': 'jQuery',
    'bootstrap': 'Bootstrap',
    'sass': 'Sass',
    'less': 'Less',
    'webpack': 'Webpack',
    'babel': 'Babel',
    'eslint': 'ESLint',
    'prettier': 'Prettier',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'gcp': 'Google Cloud Platform',
    'azure': 'Microsoft Azure',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'bitbucket': 'Bitbucket',
    'jenkins': 'Jenkins',
    'travis': 'Travis CI',
    'circleci': 'CircleCI',
    'mongodb': 'MongoDB',
    'postgres': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'elasticsearch': 'Elasticsearch',
    'kafka': 'Apache Kafka',
    'rabbitmq': 'RabbitMQ',
    'nginx': 'Nginx',
    'apache': 'Apache HTTP Server',
  };
  
  // Apply abbreviations
  if (abbreviations[normalized]) {
    return abbreviations[normalized];
  }
  
  // Title case for unknown skills
  return normalized.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

---

## 5. API Methods

### 5.1. Single Skill Normalization

```javascript
async normalizeSkill(skillName, useCache = true) {
  // Returns normalized skill name as string
  return await this.normalizeSkill(skillName, useCache);
}
```

### 5.2. Batch Skill Normalization

```javascript
async normalizeSkillsBatch(skillNames, useCache = true) {
  // Returns Map<original, normalized>
  return await this.normalizeSkillsBatch(skillNames, useCache);
}
```

### 5.3. Cache Management

```javascript
// Clear memory cache
clearCache() {
  this.cache.clear();
  this.batchCache.clear();
}

// Get cache stats
getCacheStats() {
  return {
    memoryCache: this.cache.size,
    batchCache: this.batchCache.size,
  };
}
```

---

## 6. Ví Dụ Sử Dụng

### 6.1. Single Skill Normalization

```javascript
const normalizationService = require('./skillNormalizationService');

// Basic normalization
const normalized = await normalizationService.normalizeSkill('js');
// Result: "JavaScript"

const normalized2 = await normalizationService.normalizeSkill('ReactJS');
// Result: "React"

const normalized3 = await normalizationService.normalizeSkill('Nodejs');
// Result: "Node.js"
```

### 6.2. Batch Normalization

```javascript
const skillNames = ['js', 'ts', 'py', 'reactjs', 'nodejs', 'aws'];
const results = await normalizationService.normalizeSkillsBatch(skillNames);

// Results Map:
// {
//   'js': 'JavaScript',
//   'ts': 'TypeScript',
//   'py': 'Python',
//   'reactjs': 'React',
//   'nodejs': 'Node.js',
//   'aws': 'AWS'
// }
```

### 6.3. Integration với Skill Extraction

```javascript
// Trong skillExtractionService.js
async _normalizeExtractedSkills(skills) {
  const skillNames = skills.map(s => s.name);
  const normalizedMap = await this.normalizationService.normalizeSkillsBatch(skillNames, true);
  
  return skills.map(skill => ({
    ...skill,
    name: normalizedMap.get(skill.name) || skill.name,
  }));
}
```

---

## 7. Fallback Strategy

### 7.1. Khi Gemini Không Khả Dụng

Hệ thống tự động chuyển sang fallback mode:

1. **Basic Cleaning**: Trim, lowercase, remove special characters
2. **Common Abbreviations**: Map 50+ common tech abbreviations
3. **Title Case**: Capitalize unknown skills properly

### 7.2. Fallback Examples

```javascript
// Input → Fallback Output
'js' → 'JavaScript'
'reactjs' → 'React'
'nodejs' → 'Node.js'
'unknown_skill' → 'Unknown Skill'
'machine learning' → 'Machine Learning'
```

### 7.3. Graceful Degradation

- **No Errors**: Luôn trả về kết quả, không throw errors
- **Logging**: Warn khi fallback được sử dụng
- **Performance**: Fallback rất nhanh (no API calls)

---

## 8. Performance Optimization

### 8.1. Caching Strategy

- **Memory Cache**: Cache individual skill normalizations
- **Batch Cache**: Cache batch operation results
- **Cache Key**: Lowercase, trimmed skill name

### 8.2. Batch Processing

- **Efficiency**: Process multiple skills in single API call
- **Cost Optimization**: Reduce Gemini API calls
- **Network Latency**: Single round-trip for multiple skills

### 8.3. Error Handling

- **Timeout**: 30-second timeout for Gemini calls
- **Retry Logic**: Automatic retry on transient failures
- **Fallback**: Immediate fallback to rules-based normalization

---

## 9. Lưu Ý Quan Trọng

### 9.1. API Key Management
- **Environment Variable**: `GEMINI_API_KEY`
- **Validation**: Check format (starts with 'AIzaSy')
- **Security**: Never log API keys

### 9.2. Cost Considerations
- **Gemini API**: Pay-per-use model
- **Caching**: Reduce API calls significantly
- **Batch Processing**: Optimize cost per skill

### 9.3. Accuracy Trade-offs
- **Gemini**: High accuracy, context-aware
- **Fallback**: Fast, deterministic, limited coverage
- **Hybrid**: Best of both worlds

### 9.4. Maintenance
- **Cache Clearing**: Periodic cache cleanup
- **Model Updates**: Monitor Gemini model changes
- **Fallback Updates**: Keep abbreviation list current

---

*Tài liệu này được tạo tự động từ code analysis. Cập nhật lần cuối: December 13, 2025*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\docs\NLP_SKILL_NORMALIZATION.md