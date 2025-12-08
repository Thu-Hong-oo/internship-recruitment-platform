# 🔗 LangChain + Gemini Approach cho CV Parsing

## 📊 Tổng Quan

LangChain là framework mạnh mẽ để làm việc với LLMs, có thể kết hợp với Gemini để:
1. **Structured Output** - JSON schema validation
2. **Document Loaders** - Load PDF/DOCX tốt hơn
3. **Chains** - Pipeline xử lý phức tạp
4. **Prompt Management** - Quản lý prompts tốt hơn

---

## 🔍 So Sánh với Current Approach

### Current Approach (Direct Gemini API)

```javascript
// File: backend/src/services/ai/cvParsingService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const result = await model.generateContent(prompt);
const text = result.response.text();
// Parse JSON từ text response
```

**Ưu điểm**:
- ✅ Đơn giản, trực tiếp
- ✅ Không cần thêm dependencies
- ✅ Fast (ít abstraction layer)

**Nhược điểm**:
- ❌ Phải parse JSON từ text
- ❌ Không có schema validation
- ❌ Không có document loaders tốt
- ❌ Prompt management thủ công

---

### LangChain + Gemini Approach

```javascript
// Option 1: LangChain với Gemini
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');

// Initialize model
const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  temperature: 0,
});

// Define schema
const schema = {
  type: 'object',
  properties: {
    extractedData: {
      type: 'object',
      properties: {
        personalInfo: { type: 'object' },
        experience: { type: 'array' },
        education: { type: 'object' },
        skills: { type: 'array' },
      }
    }
  }
};

// Create parser
const parser = StructuredOutputParser.fromZodSchema(schema);

// Create chain
const chain = PromptTemplate.fromTemplate(prompt)
  .pipe(llm)
  .pipe(parser);
```

**Ưu điểm**:
- ✅ **Structured output** - Schema validation tự động
- ✅ **Document loaders** - PDF/DOCX loading tốt hơn
- ✅ **Chains** - Pipeline xử lý phức tạp
- ✅ **Prompt management** - Dễ quản lý prompts
- ✅ **Error handling** - Better error handling
- ✅ **Retry logic** - Built-in retry

**Nhược điểm**:
- ❌ Thêm dependencies
- ❌ Slightly slower (abstraction layer)
- ❌ Learning curve

---

## 📦 Packages Cần Cài

```bash
# LangChain Google GenAI integration
npm install @langchain/google-genai

# LangChain core (đã có)
npm install @langchain/core

# LangChain community (đã có)
npm install @langchain/community

# Document loaders
npm install @langchain/community
```

**Note**: `@langchain/community` và `@langchain/core` đã có trong `package.json`

---

## 🎯 Implementation Example

### Option 1: LangChain với Structured Output

```javascript
// File: backend/src/services/ai/cvParsingServiceLangChain.js

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { z } = require('zod');

class CVParsingServiceLangChain {
  constructor() {
    // Initialize Gemini via LangChain
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      temperature: 0,
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Define schema với Zod
    this.schema = z.object({
      extractedData: z.object({
        personalInfo: z.object({
          fullName: z.string().nullable(),
          email: z.string().email().nullable(),
          phone: z.string().nullable(),
          address: z.string().nullable(),
          dateOfBirth: z.string().nullable(),
          summary: z.string().nullable(),
        }),
        education: z.object({
          type: z.enum(['university', 'college', 'highschool']).nullable(),
          institution: z.string().nullable(),
          degree: z.string().nullable(),
          field: z.string().nullable(),
          graduationYear: z.number().nullable(),
          startYear: z.number().nullable(),
          endYear: z.number().nullable(),
          gpa: z.number().nullable(),
        }),
        experience: z.array(z.object({
          type: z.enum(['fulltime', 'parttime', 'internship', 'freelance']),
          company: z.string(),
          position: z.string(),
          location: z.string().nullable(),
          startDate: z.string(),
          endDate: z.string(),
          description: z.string(),
        })),
        skills: z.array(z.object({
          name: z.string(),
          type: z.enum(['technical', 'soft', 'language']),
          level: z.enum(['beginner', 'intermediate', 'advanced']),
        })),
        certificates: z.array(z.object({
          name: z.string(),
          issuer: z.string().nullable(),
          year: z.number().nullable(),
        })),
      }),
      skills: z.array(z.string()),
      suggestions: z.array(z.string()),
    });

    // Create parser
    this.parser = StructuredOutputParser.fromZodSchema(this.schema);
  }

  async parseResumeFromText(text) {
    const prompt = PromptTemplate.fromTemplate(`
Bạn là chuyên gia phân tích CV. Hãy trích xuất thông tin từ CV sau:

{text}

{format_instructions}
`);

    // Create chain
    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      this.parser,
    ]);

    try {
      const result = await chain.invoke({
        text: text,
        format_instructions: this.parser.getFormatInstructions(),
      });

      return result;
    } catch (error) {
      console.error('LangChain parsing error:', error);
      throw error;
    }
  }
}
```

---

### Option 2: LangChain với Document Loaders

```javascript
const { PyPDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { DocxLoader } = require('@langchain/community/document_loaders/fs/docx');

class CVParsingServiceLangChain {
  async loadDocument(filePath, mimeType) {
    let loader;
    
    if (mimeType === 'application/pdf') {
      loader = new PyPDFLoader(filePath);
    } else if (mimeType.includes('word') || mimeType.includes('docx')) {
      loader = new DocxLoader(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const documents = await loader.load();
    return documents.map(doc => doc.pageContent).join('\n');
  }

  async parseResumeFromFile(filePath, mimeType) {
    // Step 1: Load document
    const text = await this.loadDocument(filePath, mimeType);

    // Step 2: Parse với structured output
    const result = await this.parseResumeFromText(text);

    return result;
  }
}
```

---

## 📊 So Sánh Chi Tiết

| Feature | Direct Gemini API | LangChain + Gemini |
|---------|-------------------|-------------------|
| **Setup** | ⭐ Dễ | ⭐⭐ Trung bình |
| **Structured Output** | ❌ Manual parse | ✅ Schema validation |
| **Document Loaders** | ❌ Manual (pdf-parse) | ✅ Built-in loaders |
| **Error Handling** | ⭐ Manual | ⭐⭐⭐ Built-in |
| **Retry Logic** | ⭐ Manual | ⭐⭐⭐ Built-in |
| **Prompt Management** | ⭐ Manual | ⭐⭐⭐ Template system |
| **Chains** | ❌ Manual | ✅ Built-in |
| **Performance** | ⭐⭐⭐ Fast | ⭐⭐ Slightly slower |
| **Dependencies** | ✅ Minimal | ⭐ More packages |
| **Learning Curve** | ⭐ Easy | ⭐⭐ Moderate |

---

## 🎯 Kết Luận và Recommendation

### ✅ Nên Dùng LangChain Nếu:

1. **Cần structured output mạnh mẽ** - Schema validation tự động
2. **Cần document loaders tốt** - PDF/DOCX parsing tốt hơn
3. **Cần chains phức tạp** - Multi-step processing
4. **Cần prompt management** - Quản lý nhiều prompts
5. **Cần error handling tốt** - Built-in retry, error handling

### ❌ KHÔNG Nên Dùng LangChain Nếu:

1. **Đơn giản là đủ** - Current approach đã tốt
2. **Performance critical** - Direct API nhanh hơn
3. **Minimal dependencies** - Giữ codebase nhẹ
4. **Đã có solution tốt** - Current approach đang hoạt động tốt

---

## 💡 Hybrid Approach (BEST)

Kết hợp cả 2:

```javascript
async parseResumeFromBuffer(fileBuffer, mimeType) {
  // Strategy 1: LangChain (nếu cần structured output mạnh)
  if (process.env.USE_LANGCHAIN === 'true') {
    try {
      return await this._parseWithLangChain(fileBuffer, mimeType);
    } catch (error) {
      logger.warn('LangChain failed, falling back...');
    }
  }

  // Strategy 2: Direct Gemini API (current, faster)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await this._parseWithGeminiDirect(fileBuffer, mimeType);
    } catch (error) {
      logger.warn('Direct Gemini failed, falling back...');
    }
  }

  // Strategy 3: Rule-based fallback
  return await this._parseWithRuleBased(fileBuffer, mimeType);
}
```

---

## 📝 Action Items

### Option 1: Keep Current (Recommended)
- ✅ Current approach đã tốt
- ✅ Upgrade to Gemini JSON mode (FREE)
- ✅ Simple, fast, reliable

### Option 2: Add LangChain (Optional)
- ⏳ Install `@langchain/google-genai`
- ⏳ Implement LangChain service
- ⏳ Add feature flag `USE_LANGCHAIN`
- ⏳ Test và compare với current

### Option 3: Hybrid (Best of Both)
- ⭐ Use LangChain cho complex cases
- ⭐ Use Direct API cho simple cases
- ⭐ Feature flag để switch

---

## 🔑 Key Points

1. **LangChain** = **Better structure**, nhưng **more complex**
2. **Direct API** = **Simpler**, **faster**, đang hoạt động tốt
3. **Hybrid** = **Best flexibility** - Dùng cả 2 tùy use case

---

**Date**: 2025-12-02  
**Status**: 📋 Research Complete  
**Recommendation**: 
- **Immediate**: Upgrade current to Gemini JSON mode (FREE, easy)
- **Future**: Consider LangChain nếu cần structured output mạnh hơn

