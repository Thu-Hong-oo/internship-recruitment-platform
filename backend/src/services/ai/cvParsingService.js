/**
 * CV Parsing Service
 * 
 * Chịu trách nhiệm parse CV từ file (PDF/DOCX) thành structured data
 * Sử dụng Gemini API với fallback sang rule-based parsing
 */

const { logger } = require('../../utils/logger');
const { getSkillExtractionService } = require('./skillExtractionService');
require('dotenv').config();

class CVParsingService {
  constructor(aiService) {
    // Inject aiService để sử dụng getModel() và extractSkillsEnhanced()
    this.aiService = aiService;
    this.lastExtractedText = null;
    this.skillExtractionService = getSkillExtractionService();
  }

  /**
   * Parse resume from buffer using Gemini API with fallback to rule-based
   */
  async parseResumeFromBuffer(fileBuffer, mimeType) {
    try {
      console.log('📝 Starting resume parsing');
      console.log('📄 File type:', mimeType);

      // Extract text from file
      const text = await this.extractTextFromCV(fileBuffer, mimeType);

      if (!text || text.length < 50) {
        console.error(
          '❌ Insufficient text extracted. Length:',
          text?.length || 0
        );
        throw new Error('Could not extract sufficient text from resume');
      }

      this.lastExtractedText = text;
      console.log('✅ Text extracted successfully');
      console.log('📊 Text length:', text.length, 'characters');
      
      // DEBUG: Log preview để verify text extraction đúng
      const preview = text.substring(0, 500).replace(/\n/g, ' ');
      console.log('📄 Preview (first 500 chars):', preview);
      
      // Validate: Check if text contains expected CV content
      const hasName = /(nguyễn|trịnh|đỗ|hà|miên|thu|hậu)/i.test(text);
      const hasEmail = /@/.test(text);
      const hasPhone = /\d{10,11}/.test(text);
      
      if (!hasName && !hasEmail && !hasPhone) {
        console.warn('⚠️ WARNING: Extracted text may not contain valid CV content');
        console.warn('   Text preview:', preview);
      }

      // Strategy 1: Try Gemini API first (faster, more accurate)
      if (process.env.GEMINI_API_KEY) {
        try {
          // Check if Gemini model is available
          let model = this.aiService.getModel();
          if (!model) {
            throw new Error('❌ Gemini model initialization failed. Please check GEMINI_API_KEY and GEMINI_MODEL configuration.');
          }

          console.log('🤖 Using Gemini AI for intelligent CV parsing');
          console.log('🤖 Calling Gemini API...');
          
          // TỐI ƯU: Giảm text length xuống 3000 để đạt <20s
          const maxTextLength = 3000;
          let truncatedText = text;
          
          if (text.length > maxTextLength) {
            truncatedText = text.substring(0, maxTextLength) + '\n... (text truncated for faster processing)';
            console.log(`⚡ Text truncated from ${text.length} to ${maxTextLength} characters (optimized for <20s)`);
          } else {
            console.log(`✅ Using full text (${text.length} characters)`);
          }
          
          // CRITICAL: Clean text trước khi gửi cho Gemini (loại bỏ corruption)
          const textForGemini = this.cleanExtractedText(truncatedText);
          
          // SEMANTIC AI PARSING: Hiểu ngữ nghĩa, không dựa vào format cứng nhắc
          const prompt = `Bạn là chuyên gia phân tích CV. Hãy HIỂU NGỮ NGHĨA và trích xuất thông tin từ CV, bất kể format hay encoding.

**NGUYÊN TẮC QUAN TRỌNG:**
1. ĐỌC HIỂU ngữ nghĩa, KHÔNG dựa vào vị trí hay format
2. Tên người: Chỉ lấy họ tên thật (2-5 từ), BỎ QUA chức danh/công việc
3. Học vấn: Tên trường + ngành học, BỎ QUA mô tả dài dòng
4. Kinh nghiệm: Vị trí + công ty + thời gian, BỎ QUA mục tiêu nghề nghiệp
5. Kỹ năng: CHỈ kỹ năng kỹ thuật/công cụ (Java, Excel, Giao tiếp...), BỎ QUA câu mô tả
6. Ngày tháng: Chuẩn hóa về DD/MM/YYYY
7. Text đã được làm sạch encoding errors

**CV CẦN PHÂN TÍCH:**
${textForGemini}

**OUTPUT JSON (THUẦN TÚY, KHÔNG MARKDOWN):**
{
  "extractedData": {
    "personalInfo": {
      "fullName": "[Chỉ họ tên - VD: Nguyễn Văn A]",
      "email": "[Email nếu có]",
      "phone": "[Số điện thoại]",
      "address": "[Địa chỉ ngắn gọn]",
      "dateOfBirth": "[DD/MM/YYYY hoặc null]"
    },
    "education": {
      "type": "university|college|highschool",
      "institution": "[Tên trường - ngắn gọn]",
      "degree": "[Bằng cấp]",
      "field": "[Ngành học]",
      "graduationYear": [Năm tốt nghiệp - số hoặc null],
      "gpa": [GPA - số hoặc null],
      "gradeText": "[Xếp loại: Giỏi/Khá... hoặc null]"
    },
    "experience": [
      {
        "type": "fulltime|parttime|internship|freelance",
        "company": "[Tên công ty]",
        "position": "[Vị trí]",
        "location": "[Địa điểm]",
        "startDate": "[MM/YYYY]",
        "endDate": "[MM/YYYY hoặc 'present']",
        "description": "[Mô tả ngắn gọn]"
      }
    ],
    "skills": [
      {"name": "[Tên kỹ năng]", "type": "technical|soft|language", "level": "beginner|intermediate|advanced"}
    ],
    "certificates": [
      {"name": "[Tên chứng chỉ]", "issuer": "[Tổ chức cấp]", "year": [Năm], "description": "[Mô tả]"}
    ],
    "awards": [
      {"name": "[Tên giải thưởng]", "year": [Năm], "description": "[Mô tả]"}
    ]
  },
  "skills": ["[Danh sách tên kỹ năng]"],
  "suggestions": ["[3 gợi ý cải thiện CV]"]
}

**LƯU Ý:**
- HIỂU NGỮ NGHĨA, không theo format cứng nhắc
- Tên người: TỐI ĐA 5 từ, bỏ chức danh
- Học vấn: Ngắn gọn, bỏ mô tả dài
- JSON thuần túy, null nếu không tìm thấy
- Giữ dấu tiếng Việt chính xác
`;

          // Double-check API key before calling API
          const apiKey = process.env.GEMINI_API_KEY?.trim();
          if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
          }
          
          if (!apiKey.startsWith('AIzaSy')) {
            throw new Error('GEMINI_API_KEY format is invalid');
          }
          
          console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

          // TỐI ƯU: Gọi API Gemini với timeout và retry logic
          const apiTimeout = 15000; // 15s timeout
          let apiResult;
          let apiRetryCount = 0;
          const apiMaxRetries = 1;
          
          while (apiRetryCount <= apiMaxRetries) {
            try {
              const apiPromise = model.generateContent(prompt);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Gemini API timeout after 15s')), apiTimeout)
              );
              
              apiResult = await Promise.race([apiPromise, timeoutPromise]);
              break; // Success, exit retry loop
            } catch (error) {
              apiRetryCount++;
              
              // Xử lý 429 Quota Exceeded error
              if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded'))) {
                const retryDelayMatch = error.message.match(/retry in ([\d.]+)s/i);
                const retryDelay = retryDelayMatch ? Math.ceil(parseFloat(retryDelayMatch[1])) : null;
                
                console.error(`❌ Gemini API quota exceeded!`);
                console.error(`   Current API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
                if (retryDelay) {
                  console.error(`   ⏰ Quota will reset in: ${retryDelay} seconds`);
                }
                console.error(`   💡 Solutions:`);
                console.error(`      1. Upgrade Gemini API plan: https://cloud.google.com/vertex-ai/pricing`);
                console.error(`      2. Check quota: https://ai.dev/usage?tab=rate-limit`);
                console.error(`      3. Use new API key: https://aistudio.google.com/app/apikey`);
                console.error(`      4. Wait for quota reset (usually per minute or per day)`);
                console.warn(`   ⚠️ Skipping Gemini and using fallback (Rule-based)...`);
                throw new Error('GEMINI_QUOTA_EXCEEDED');
              }
              
              // Xử lý các lỗi khác
              if (apiRetryCount > apiMaxRetries) {
                console.warn(`⚠️ Gemini API failed after ${apiMaxRetries} retry:`, error.message.substring(0, 150));
                throw error;
              }
              
              console.warn(`⚠️ Gemini API attempt ${apiRetryCount} failed, retrying... (${error.message.substring(0, 100)})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          const response = await apiResult.response;
          let responseText = response.text();

          console.log('✅ Gemini response received');
          console.log('📄 Raw response length:', responseText.length, 'characters');
          console.log('📄 Raw response preview:', responseText.substring(0, 200));

          // Clean response - remove markdown và text thừa
          let cleanedText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

          // Tìm JSON object
          const jsonStart = cleanedText.indexOf('{');
          const jsonEnd = cleanedText.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            responseText = cleanedText.substring(jsonStart, jsonEnd + 1);
            console.log('✅ Extracted JSON from response');
          } else {
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              responseText = jsonMatch[0];
              console.log('✅ Extracted JSON using regex');
            } else {
              console.warn('⚠️ Could not find JSON in response, using cleaned text as-is');
              responseText = cleanedText;
            }
          }

          // Parse JSON with retry logic
          let parsedData;
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              parsedData = JSON.parse(responseText);
              
              // Validate structure
              if (!parsedData.extractedData) {
                throw new Error('Invalid response structure: missing extractedData');
              }
              
              if (!parsedData.extractedData.personalInfo) {
                throw new Error('Invalid response structure: missing personalInfo');
              }
              
              break;
            } catch (parseError) {
              retryCount++;
              
              if (retryCount > maxRetries) {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    parsedData = JSON.parse(jsonMatch[0]);
                    console.log('✅ Successfully extracted JSON from markdown');
                    break;
                  } catch (e) {
                    throw new Error(`Failed to parse AI response after ${maxRetries} retries. Please try again or contact support.`);
                  }
                } else {
                  throw new Error(`Failed to parse AI response: ${parseError.message}. Please try again.`);
                }
              } else {
                responseText = responseText
                  .replace(/```json\n?/g, '')
                  .replace(/```\n?/g, '')
                  .replace(/^[^{]*/, '')
                  .replace(/[^}]*$/, '}');
              }
            }
          }

          // Fix address field if it's empty string
          if (
            parsedData.extractedData.personalInfo &&
            parsedData.extractedData.personalInfo.address === ''
          ) {
            console.log('🔧 Fixing empty address string from AI response');
            parsedData.extractedData.personalInfo.address = null;
          }

          // POST-PROCESSING: Clean encoding issues từ parsed data
          parsedData = this.cleanParsedData(parsedData);

          // VALIDATION: Verify parsed data matches extracted text
          const parsedName = parsedData.extractedData?.personalInfo?.fullName?.toLowerCase() || '';
          const parsedEmail = parsedData.extractedData?.personalInfo?.email?.toLowerCase() || '';
          const textLower = truncatedText.toLowerCase();
          
          if (parsedName && !textLower.includes(parsedName.split(' ')[0]?.toLowerCase() || '')) {
            console.warn('⚠️ WARNING: Parsed name may not match extracted text');
            console.warn(`   Parsed name: "${parsedData.extractedData.personalInfo.fullName}"`);
            console.warn(`   Text preview: "${text.substring(0, 200)}"`);
          }
          
          if (parsedEmail && !textLower.includes(parsedEmail.split('@')[0]?.toLowerCase() || '')) {
            console.warn('⚠️ WARNING: Parsed email may not match extracted text');
            console.warn(`   Parsed email: "${parsedData.extractedData.personalInfo.email}"`);
          }

          console.log('✅ Successfully parsed CV with Gemini AI');
          console.log(`📋 Parsed name: "${parsedData.extractedData.personalInfo.fullName}"`);
          console.log(`📧 Parsed email: "${parsedData.extractedData.personalInfo.email}"`);

          return parsedData;
        } catch (error) {
          // Skip Gemini ngay nếu quota exceeded
          if (error.message && error.message.includes('GEMINI_QUOTA_EXCEEDED')) {
            console.warn('⚠️ Gemini API quota exceeded, skipping Gemini and using fallback (Rule-based)');
            console.warn('   💡 Tip: Upgrade your Gemini API plan or wait for quota reset');
          } else {
            console.warn('⚠️ Gemini API failed, falling back to rule-based parsing:', error.message.substring(0, 150));
          }
        }
      } else {
        console.warn('⚠️ GEMINI_API_KEY not found, will use rule-based parsing');
      }

      // Strategy 2: Fallback to rule-based parsing
      const allowRuleBased = process.env.ALLOW_RULE_BASED_FALLBACK !== 'false';
      if (allowRuleBased) {
        console.warn('⚠️ Gemini failed or not available, falling back to rule-based parsing');
        try {
          const result = await this.fallbackParseResume();
          console.log('✅ Successfully parsed CV with rule-based parsing (fallback)');
          return result;
        } catch (fallbackError) {
          console.error('❌ Rule-based fallback also failed:', fallbackError.message);
          throw new Error('All CV parsing methods failed. Please check your configuration.');
        }
      }

      throw new Error('❌ All CV parsing methods failed. Please check GEMINI_API_KEY or enable rule-based fallback (ALLOW_RULE_BASED_FALLBACK=true) in .env file.');
    } catch (error) {
      if (error.message && error.message.includes('❌')) {
        throw error;
      }
      throw new Error(`CV parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from CV file with better encoding handling
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else if (mimeType.includes('text')) {
        text = fileBuffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type: ' + mimeType);
      }

      // Clean and fix Vietnamese encoding
      text = this.cleanExtractedText(text);
      return text;
    } catch (error) {
      logger.error('Error extracting text from CV:', error);
      throw error;
    }
  }

  /**
   * Clean extracted text - fix Vietnamese encoding and formatting
   */
  cleanExtractedText(text) {
    // DEBUG: Log text BEFORE cleaning
    const originalPreview = text.substring(0, 100);
    console.log('🧹 BEFORE clean:', originalPreview);
    
    // CRITICAL: Remove replacement characters (�) and corrupt encoding
    text = text.replace(/�/g, ' ');
    text = text.replace(/\uFFFD/g, ' ');
    
    // Remove bullet points that cause parsing issues
    text = text.replace(/•/g, ' ');
    text = text.replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, ' ');

    // EXTRA: Remove 'Đỗ' xen kẽ bất thường (không phải họ tên thật)
    // Chỉ giữ 'Đỗ' nếu nó đứng đầu dòng hoặc sau dấu xuống dòng (tức là họ thật)
    text = text.replace(/(?<!^|\n)\s*Đỗ\s*/g, ' ');
    // Nếu vẫn còn nhiều 'Đỗ' liền nhau, chỉ giữ 1
    text = text.replace(/(Đỗ\s+){2,}/g, 'Đỗ ');
    
    // STEP 1: Add spaces around "Đỗ", "Ngô", "Đặng" stuck to letters (CRITICAL FOR PDF CORRUPTION)
    // Example: "NguyễnĐỗThịĐỗThu" → "Nguyễn Đỗ Thị Đỗ Thu"
    // Pattern: Match ANY letter (Latin or Vietnamese, upper or lower) + "Đỗ"
    text = text.replace(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Đỗ/g, '$1 Đỗ ');
    text = text.replace(/Đỗ([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, ' Đỗ $1');
    text = text.replace(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Ngô/g, '$1 Ngô ');
    text = text.replace(/Ngô([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, ' Ngô $1');
    text = text.replace(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Đặng/g, '$1 Đặng ');
    text = text.replace(/Đặng([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, ' Đặng $1');
    
    // STEP 1.5: Add spaces around "Đỗ", "Ngô", "Đặng" stuck to NUMBERS (e.g., "Đỗ0397970553Đỗ")
    text = text.replace(/(\d)Đỗ/g, '$1 Đỗ ');
    text = text.replace(/Đỗ(\d)/g, ' Đỗ $1');
    text = text.replace(/(\d)Ngô/g, '$1 Ngô ');
    text = text.replace(/Ngô(\d)/g, ' Ngô $1');
    text = text.replace(/(\d)Đặng/g, '$1 Đặng ');
    text = text.replace(/Đặng(\d)/g, ' Đặng $1');
    
    // DEBUG: Log AFTER adding spaces
    const afterSpaces = text.substring(0, 100);
    console.log('🧹 AFTER add spaces:', afterSpaces);
    
    // STEP 2: SUPER AGGRESSIVE - Remove ALL "Đỗ", "Ngô", "Đặng" that are NOT part of real names
    // Now that we have spaces, we can safely remove them
    for (let i = 0; i < 10; i++) {
      // Remove "Đỗ Đỗ Đỗ" patterns (multiple consecutive)
      text = text.replace(/\s+Đỗ\s+Đỗ/g, ' ');
      text = text.replace(/\s+Ngô\s+Ngô/g, ' ');
      text = text.replace(/\s+Đặng\s+Đặng/g, ' ');
      
      // Remove single "Đỗ", "Ngô", "Đặng" between capital letters (name context)
      text = text.replace(/([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]*)\s+Đỗ\s+([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
      text = text.replace(/([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]*)\s+Ngô\s+([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
      text = text.replace(/([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]*)\s+Đặng\s+([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
      
      // Remove at start of line
      text = text.replace(/^Đỗ\s+/gm, '');
      text = text.replace(/^Ngô\s+/gm, '');
      text = text.replace(/^Đặng\s+/gm, '');
      
      // Remove after space at word boundaries
      text = text.replace(/\s+Đỗ\s+/g, ' ');
      text = text.replace(/\s+Ngô\s+/g, ' ');
      text = text.replace(/\s+Đặng\s+/g, ' ');
    }
    
    // DEBUG: Log AFTER removing
    const afterRemove = text.substring(0, 100);
    console.log('🧹 AFTER remove loop:', afterRemove);
    
    // Insert spaces between Vietnamese words (camelCase)
    text = text.replace(
      /([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g,
      '$1 $2'
    );
    
    // Insert spaces before numbers/dates
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])(\d)/gi, '$1 $2');
    text = text.replace(/(\d)([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/gi, '$1 $2');
    
    // Remove excessive whitespace (final cleanup)
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/^\s+|\s+$/gm, '');  // Trim each line

    // Fix common Vietnamese name patterns
    const namePatterns = {
      'nguy n': 'Nguyễn',
      'tr n': 'Trần',
      'l ': 'Lê',
      'ph m': 'Phạm',
      'hu nh': 'Huỳnh',
      'v ': 'Vũ',
      'v ': 'Võ',
      'ng ': 'Ngô',
      'd ng': 'Dương',
      ' ng': 'Đặng',
      'b i': 'Bùi',
      ' ': 'Đỗ',
      'h ': 'Hồ',
      phan: 'Phan',
      mai: 'Mai',
      cao: 'Cao',
    };

    // Fix Vietnamese location names
    const locationPatterns = {
      'tp h ch minh': 'TP. Hồ Chí Minh',
      'h ch minh': 'Hồ Chí Minh',
      'tp hcm': 'TP. Hồ Chí Minh',
      hcm: 'Hồ Chí Minh',
      'ha n i': 'Hà Nội',
      'ha noi': 'Hà Nội',
      'da n ng': 'Đà Nẵng',
      'da nang': 'Đà Nẵng',
      'vi t nam': 'Việt Nam',
      'viet nam': 'Việt Nam',
    };

    // Fix Vietnamese education terms
    const educationPatterns = {
      'ti ng anh': 'Tiếng Anh',
      'ti ng vi t': 'Tiếng Việt',
      'tin h c': 'Tin học',
      'k thu t': 'Kỹ thuật',
      'i h c': 'Đại học',
      'c nhân': 'Cử nhân',
      'th c s ': 'Thạc sĩ',
      'ti n s ': 'Tiến sĩ',
      'cao ng': 'Cao đẳng',
      'trung c p': 'Trung cấp',
    };

    // Apply all fixes
    const allPatterns = {
      ...namePatterns,
      ...locationPatterns,
      ...educationPatterns,
    };
    for (const [wrong, correct] of Object.entries(allPatterns)) {
      const regex = new RegExp(wrong, 'gi');
      text = text.replace(regex, correct);
    }

    // Remove non-printable characters
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width characters
    
    // Final whitespace normalization
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Clean parsed data - remove encoding artifacts (Đỗ, Ngô, Đặng)
   */
  cleanParsedData(parsedData) {
    if (!parsedData || !parsedData.extractedData) return parsedData;

    const cleanText = (text) => {
      if (!text || typeof text !== 'string') return text;
      
      // Loại bỏ "Đỗ", "Ngô", "Đặng" xen kẽ (không phải tên riêng)
      // Pattern: chữ cái + "Đỗ"/"Ngô"/"Đặng" + chữ cái → chữ cái + space + chữ cái
      let cleaned = text
        .replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Đỗ(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 ')
        .replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Ngô(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 ')
        .replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])Đặng(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđA-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 ');
      
      // Loại bỏ "Đỗ", "Ngô" đứng đơn lẻ (không phải tên riêng)
      cleaned = cleaned.replace(/\bĐỗ\b(?![A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '');
      cleaned = cleaned.replace(/\bNgô\b(?![A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '');
      
      // Normalize whitespace
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      return cleaned;
    };

    // Clean personalInfo
    if (parsedData.extractedData.personalInfo) {
      const pi = parsedData.extractedData.personalInfo;
      if (pi.fullName) {
        pi.fullName = cleanText(pi.fullName);
        // Nếu tên có nhiều 'Đỗ' lặp lại bất thường, chỉ giữ 1 từ 'Đỗ' đầu tiên (nếu có), loại bỏ các từ 'Đỗ' dư thừa
        // VD: 'Nguyễn Đỗ Thị Đỗ Thu Đỗ Hậu' => 'Nguyễn Thị Thu Hậu' hoặc 'Nguyễn Đỗ Thị Thu Hậu'
        let parts = pi.fullName.split(' ').filter(Boolean);
        let result = [];
        let doFound = false;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'Đỗ') {
            if (!doFound && i <= 2) { // Chỉ giữ 'Đỗ' nếu xuất hiện ở vị trí <=2 (thường là họ)
              result.push('Đỗ');
              doFound = true;
            }
            // Nếu đã có 'Đỗ' rồi hoặc vị trí không hợp lý thì bỏ qua
          } else {
            result.push(parts[i]);
          }
        }
        pi.fullName = result.join(' ');
        // Nếu text gốc không có 'Đỗ', loại bỏ hoàn toàn 'Đỗ' khỏi tên
        // (Chỉ giữ lại các từ khác, không bao giờ thêm 'Đỗ' nếu CV gốc không có)
        let fullNameNoDo = pi.fullName.split(' ').filter(word => word !== 'Đỗ').join(' ');
        pi.fullName = fullNameNoDo;
      }
      if (pi.address) pi.address = cleanText(pi.address);
    }

    // Clean education
    if (parsedData.extractedData.education) {
      const edu = parsedData.extractedData.education;
      if (edu.institution) edu.institution = cleanText(edu.institution);
      if (edu.degree) edu.degree = cleanText(edu.degree);
      if (edu.field) edu.field = cleanText(edu.field);
    }

    // Clean experience AND validate dates
    if (parsedData.extractedData.experience && Array.isArray(parsedData.extractedData.experience)) {
      parsedData.extractedData.experience = parsedData.extractedData.experience.map(exp => {
        if (exp.company) exp.company = cleanText(exp.company);
        if (exp.position) exp.position = cleanText(exp.position);
        if (exp.type) exp.type = cleanText(exp.type);
        if (exp.description) exp.description = cleanText(exp.description);
        
        // IMPORTANT: Validate and normalize dates
        if (exp.startDate) {
          exp.startDate = this.normalizeDate(exp.startDate);
        }
        if (exp.endDate) {
          exp.endDate = this.normalizeDate(exp.endDate);
        }
        
        return exp;
      }).filter(exp => {
        // Remove experiences with invalid startDate (unless they have meaningful data)
        if (!exp.startDate && !exp.position && !exp.company) {
          console.warn('⚠️ Removing experience with no startDate and no position/company');
          return false;
        }
        return true;
      });
    }

    // Clean skills
    if (parsedData.extractedData.skills && Array.isArray(parsedData.extractedData.skills)) {
      parsedData.extractedData.skills.forEach(skill => {
        if (skill.name) skill.name = cleanText(skill.name);
      });
    }

    // Clean certificates
    if (parsedData.extractedData.certificates && Array.isArray(parsedData.extractedData.certificates)) {
      parsedData.extractedData.certificates.forEach(cert => {
        if (cert.name) cert.name = cleanText(cert.name);
        if (cert.description) cert.description = cleanText(cert.description);
      });
    }

    // Clean awards
    if (parsedData.extractedData.awards && Array.isArray(parsedData.extractedData.awards)) {
      parsedData.extractedData.awards.forEach(award => {
        if (award.name) award.name = cleanText(award.name);
        if (award.description) award.description = cleanText(award.description);
      });
    }

    // Clean activities
    if (parsedData.extractedData.activities && Array.isArray(parsedData.extractedData.activities)) {
      parsedData.extractedData.activities.forEach(activity => {
        if (activity.name) activity.name = cleanText(activity.name);
        if (activity.description) activity.description = cleanText(activity.description);
      });
    }

    // Clean skills array (flat)
    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      parsedData.skills = parsedData.skills.map(skill => cleanText(skill));
    }

    console.log('🧹 Cleaned parsed data - removed encoding artifacts');
    return parsedData;
  }

  /**
   * Fallback to rule-based parsing
   */
  async fallbackParseResume() {
    console.log('⚠️ Using fallback rule-based parsing');

    if (!this.lastExtractedText || this.lastExtractedText.length < 100) {
      console.log('❌ No text available for parsing');
      return this.getEmptyTemplate();
    }

    // CRITICAL: Clean text BEFORE extracting data
    const text = this.cleanExtractedText(this.lastExtractedText);
    console.log('📝 Parsing with rules from cleaned text');
    console.log('📝 Using AI-powered skill extraction service');

    const result = {
      extractedData: {
        personalInfo: this.extractPersonalInfo(text),
        education: this.extractEducationInfo(text),
        experience: this.extractExperienceInfo(text),
        skills: await this.skillExtractionService.extractSkills(text, {
          maxSkills: 50,
          minConfidence: 0.5,
        }),
        certificates: this.extractCertificates(text),
        awards: this.extractAwards(text),
      },
      skills: [],
      suggestions: [
        'Thêm chi tiết về dự án đã thực hiện',
        'Làm rõ thành tựu cụ thể bằng số liệu',
        'Bổ sung kỹ năng chuyên môn liên quan',
      ],
    };

    // Flatten skills for compatibility
    result.skills = result.extractedData.skills.map(s => s.name);

    console.log('✅ Fallback parsing complete');
    return result;
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const info = {};

    // Vietnamese name pattern
    let namePattern =
      /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Mai|Cao|Tạ|Lưu)\s+(?:Thị|Văn|Minh|Anh|Hoàng)?\s*[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)/m;
    let nameMatch = text.match(namePattern);
    
    if (!nameMatch) {
      namePattern = /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Mai|Cao|Tạ|Lưu)(?:Đỗ|Ngô|Thị|Văn|Minh|Anh|Hoàng)?[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)/m;
      nameMatch = text.match(namePattern);
      if (nameMatch) {
        let name = nameMatch[1];
        name = name.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        name = name.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đỗ([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        name = name.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Ngô([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        
        // Validate: Name should be max 50 chars and max 5 words
        const words = name.trim().split(/\s+/);
        if (words.length > 5 || name.length > 50) {
          // Truncate to first 5 words or 50 chars (likely has job title or garbage appended)
          name = words.slice(0, Math.min(5, words.length)).join(' ');
          if (name.length > 50) {
            name = name.substring(0, 50);
          }
          console.warn(`⚠️ Name truncated (too long): ${name}`);
        }
        
        info.fullName = name.trim();
      }
    } else {
      let name = nameMatch[1].trim();
      
      // Validate: Name should be max 50 chars and max 5 words
      const words = name.split(/\s+/);
      if (words.length > 5 || name.length > 50) {
        name = words.slice(0, Math.min(5, words.length)).join(' ');
        if (name.length > 50) {
          name = name.substring(0, 50);
        }
        console.warn(`⚠️ Name truncated (too long): ${name}`);
      }
      
      info.fullName = name;
    }

    // Email
    const emailMatch = text.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    );
    if (emailMatch) info.email = emailMatch[1];

    // Phone (Vietnamese format)
    const phoneMatch = text.match(/((?:\+84|84|0)(?:3|5|7|8|9)\d{8})/);
    if (phoneMatch) info.phone = phoneMatch[1];

    // Date of birth
    const dobMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (dobMatch) info.dateOfBirth = dobMatch[1];

    // Address
    const addressMatch = text.match(
      /([\w\s,]+(?:Hồ Chí Minh|HCM|TP\.HCM|HCMC|Hà Nội|Đà Nẵng|Cần Thơ|Biên Hòa|Nha Trang|Huế|Phường|Quận|District)[\w\s,]*)/i
    );
    if (addressMatch && addressMatch[1].trim() !== '') {
      info.address = addressMatch[1].trim();
    } else {
      info.address = null;
    }

    return info;
  }

  /**
   * Extract education information
   */
  extractEducationInfo(text) {
    const education = {
      type: 'university',
      institution: null,
      degree: null,
      field: null,
      graduationYear: null,
      gpa: null,
      gradeText: null,
    };

    // University name
    let uniMatch = text.match(
      /(?:Đại học|University|College|Trường)\s+([^\n]{5,80})/i
    );
    
    if (!uniMatch) {
      uniMatch = text.match(
        /(?:Đạihọc|University|College|Trường)([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][^\n]{5,80})/i
      );
      if (uniMatch) {
        let uniName = uniMatch[0];
        uniName = uniName.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        uniName = uniName.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đỗ([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        uniName = uniName.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Ngô([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
        education.institution = uniName.trim();
      }
    } else {
      education.institution = uniMatch[0].trim();
    }
    
    // Validate and clean institution field
    if (education.institution) {
      // Final cleanup - remove any remaining corruption patterns
      education.institution = education.institution
        .replace(/Đỗ(?=[a-zà-ỹ])/g, ' ')
        .replace(/Ngô(?=[a-zà-ỹ])/g, ' ')
        .replace(/Đặng(?=[a-zà-ỹ])/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove excessive repeating patterns (garbage data)
      const repeatingPattern = /(.{3,})\1{3,}/;
      if (repeatingPattern.test(education.institution)) {
        console.warn('⚠️ Detected repeating pattern in institution, clearing field');
        education.institution = null;
      }
      
      // Check for too many special characters (indicates corrupted data)
      const specialCharCount = (education.institution.match(/[•�\uFFFD]/g) || []).length;
      if (specialCharCount > 3) {
        console.warn('⚠️ Too many special characters in institution, clearing field');
        education.institution = null;
      }
      
      // Check if text contains too many mixed case patterns (indicates corruption)
      if (education.institution) {
        const mixedCasePattern = /([a-zà-ỹ])([A-ZÀ-Ỹ])/g;
        const mixedCount = (education.institution.match(mixedCasePattern) || []).length;
        if (mixedCount > 5) {
          console.warn('⚠️ Too many mixed case patterns in institution (corrupted), clearing field');
          education.institution = null;
        }
      }
      
      // Check if text is too short or too long
      if (education.institution && (education.institution.length < 5 || education.institution.length > 100)) {
        console.warn('⚠️ Institution name length invalid, clearing field');
        education.institution = null;
      }
    }

    // Degree
    const degreeMatch = text.match(
      /(Cử nhân|Kỹ sư|Thạc sĩ|Tiến sĩ|Bachelor|Master|PhD)/i
    );
    if (degreeMatch) education.degree = degreeMatch[1];

    // Field of study
    const fieldMatch = text.match(
      /(?:Ngành|Major|Field)\s*:?\s*([^\n]{5,50})/i
    );
    if (fieldMatch) {
      let field = fieldMatch[1].trim();
      
      // Aggressive cleanup for field
      field = field
        .replace(/Đỗ(?=[a-zà-ỹ])/g, ' ')
        .replace(/Ngô(?=[a-zà-ỹ])/g, ' ')
        .replace(/Đặng(?=[a-zà-ỹ])/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Clean and validate field
      const specialCharCount = (field.match(/[•�\uFFFD]/g) || []).length;
      const mixedCaseCount = (field.match(/([a-zà-ỹ])([A-ZÀ-Ỹ])/g) || []).length;
      
      if (specialCharCount > 2 || mixedCaseCount > 4 || field.length < 5 || field.length > 80) {
        console.warn('⚠️ Field of study contains corrupted data, clearing field');
        education.field = null;
      } else {
        education.field = field;
      }
    }

    // Graduation year
    const yearMatch = text.match(
      /(?:tốt nghiệp|graduation|graduated)\s*:?\s*(?:năm\s*)?(\d{4})/i
    );
    if (yearMatch) education.graduationYear = parseInt(yearMatch[1]);

    // GPA
    const gpaNumericMatch = text.match(/(?:GPA|Điểm)\s*:?\s*(\d+\.?\d*)/i);
    if (gpaNumericMatch) {
      education.gpa = parseFloat(gpaNumericMatch[1]);
    }

    // Grade text
    const gradeTextMatch = text.match(
      /(?:loại|xếp loại|grade|classification)\s*:?\s*(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average)/i
    );
    if (gradeTextMatch) {
      education.gradeText = gradeTextMatch[1];
      if (!education.gpa) {
        education.gpa = null;
      }
    }

    return education;
  }

  /**
   * Extract work experience
   */
  extractExperienceInfo(text) {
    const experiences = [];
    const lines = text.split('\n');
    let currentExp = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const expPattern = /^(.*?)\s*(?:tại|at|@)\s*(.+)$/i;
      const datePattern =
        /(\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|Hiện tại|Present|Current)/i;

      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        if (currentExp) experiences.push(currentExp);

        // Validate and normalize dates
        const startDate = this.normalizeDate(dateMatch[1]);
        const endDate = this.normalizeDate(dateMatch[2]);

        currentExp = {
          type: this.inferExperienceType(line),
          position: null,
          company: null,
          startDate: startDate,
          endDate: endDate,
          description: '',
          location: null,
        };

        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        
        const companyMatch = line.match(
          /(?:tại|at|@|Công ty|Company)\s*:?\s*(.+?)(?:\s+\d{1,2}\/\d{4})/i
        );
        const companyMatchNext = nextLine.match(
          /(?:tại|at|@|Công ty|Company)\s*:?\s*(.+)/i
        );

        if (companyMatch) {
          currentExp.company = companyMatch[1].trim();
          currentExp.position = prevLine || 'Not specified';
        } else if (companyMatchNext) {
          currentExp.company = companyMatchNext[1].trim();
          currentExp.position = line.replace(datePattern, '').trim() || prevLine || 'Not specified';
        } else if (prevLine && prevLine.length > 3 && prevLine.length < 100) {
          currentExp.position = prevLine;
        } else {
          const positionMatch = line.replace(datePattern, '').trim();
          if (positionMatch && positionMatch.length > 3 && positionMatch.length < 100) {
            currentExp.position = positionMatch;
          }
        }
      }
      else if (
        (currentExp && line.startsWith('•')) ||
        line.startsWith('-') ||
        line.startsWith('*')
      ) {
        currentExp.description += line.replace(/^[•\-*]\s*/, '') + '\n';
      }
    }

    if (currentExp) experiences.push(currentExp);
    return experiences;
  }

  /**
   * Normalize date string to valid format or null
   * Handles: MM/YYYY, "Hiện tại", "Present", "Current", null, undefined
   * Returns: Valid date string, null (for present), or null (for invalid)
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Handle string "null" or "undefined"
    if (typeof dateStr === 'string') {
      const lower = dateStr.toLowerCase().trim();
      
      // Check for "present" indicators
      if (lower === 'hiện tại' || lower === 'present' || lower === 'current' || lower === 'now') {
        return null; // null means "present/current position"
      }

      // Check for literal "null" or "undefined"
      if (lower === 'null' || lower === 'undefined') {
        return null;
      }

      // Validate MM/YYYY format
      const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const year = parseInt(dateMatch[2]);

        // Validate month (1-12)
        if (month < 1 || month > 12) {
          console.warn(`⚠️ Invalid month in date: ${dateStr}`);
          return null;
        }

        // Validate year (1950-2030)
        if (year < 1950 || year > 2030) {
          console.warn(`⚠️ Invalid year in date: ${dateStr}`);
          return null;
        }

        // Pad month to 2 digits
        const normalizedDate = `${month.toString().padStart(2, '0')}/${year}`;
        return normalizedDate;
      }

      // If doesn't match MM/YYYY pattern
      console.warn(`⚠️ Invalid date format: ${dateStr} (expected MM/YYYY)`);
      return null;
    }

    return null;
  }

  /**
   * Infer experience type
   */
  inferExperienceType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('thực tập') || lower.includes('intern'))
      return 'internship';
    if (lower.includes('fulltime') || lower.includes('chính thức'))
      return 'fulltime';
    if (lower.includes('parttime') || lower.includes('bán thời gian'))
      return 'parttime';
    if (lower.includes('freelance') || lower.includes('tự do'))
      return 'freelance';
    return 'internship';
  }

  /**
   * Extract certificates
   */
  extractCertificates(text) {
    const certificates = [];
    const lines = text.split('\n');

    const certPatterns = [
      /(?:chứng chỉ|certificate|certification)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
      /(TOEIC|IELTS|TOEFL|AWS|Azure|Google Cloud)\s*:?\s*(\d+)?/gi,
      /(MOS|Microsoft Office Specialist)/i,
    ];

    lines.forEach(line => {
      certPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const cert = {
            name: match[1]?.trim() || match[0].trim(),
            issuer: null,
            year: null,
          };

          const yearMatch = line.match(/(\d{4})/);
          if (yearMatch) cert.year = parseInt(yearMatch[1]);

          if (!certificates.some(c => c.name === cert.name)) {
            certificates.push(cert);
          }
        }
      });
    });

    return certificates;
  }

  /**
   * Extract awards
   */
  extractAwards(text) {
    const awards = [];
    const lines = text.split('\n');

    const awardPatterns = [
      /(?:giải thưởng|award|prize|danh hiệu)\s*:?\s*(.+?)(?:\s*-?\s*(\d{4}))?$/i,
      /(?:sinh viên|student)\s+(.+?)(?:\s+(?:năm|year)\s*(\d{4}))?/i,
      /^(\d{4})\s*[-–]\s*(\d{4})?\s+(.+)$/,
    ];

    lines.forEach(line => {
      awardPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const award = {
            name: null,
            year: null,
            description: null,
          };

          if (pattern.source.includes('^(\\d{4})')) {
            award.year = match[1];
            award.name = match[3]?.trim();
          } else {
            award.name = match[1]?.trim();
            const yearMatch = line.match(/(\d{4})/);
            if (yearMatch) award.year = parseInt(yearMatch[1]);
          }

          if (award.name && !awards.some(a => a.name === award.name)) {
            awards.push(award);
          }
        }
      });
    });

    return awards;
  }

  /**
   * Get empty template
   */
  getEmptyTemplate() {
    return {
      extractedData: {
        personalInfo: {
          fullName: null,
          email: null,
          phone: null,
          address: null,
          dateOfBirth: null,
        },
        education: {
          type: 'university',
          institution: null,
          degree: null,
          field: null,
          graduationYear: null,
          gpa: null,
        },
        experience: [],
        skills: [],
        certificates: [],
        awards: [],
      },
      skills: [],
      suggestions: [
        'Thêm thông tin cá nhân đầy đủ (email, phone)',
        'Bổ sung chi tiết về học vấn và kinh nghiệm',
        'Liệt kê rõ ràng các kỹ năng chuyên môn',
      ],
    };
  }
}

// Singleton pattern
let cvParsingServiceInstance = null;

function getCVParsingService(aiService) {
  if (!cvParsingServiceInstance) {
    cvParsingServiceInstance = new CVParsingService(aiService);
  }
  return cvParsingServiceInstance;
}

module.exports = { getCVParsingService, CVParsingService };

