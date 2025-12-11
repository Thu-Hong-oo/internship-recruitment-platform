const { logger } = require('../../utils/logger');

/**
 * Content Moderation Service
 * Quét từ nhạy cảm và nội dung nhạy cảm cho job postings
 *
 * Strategy: Rule-based (chính) + AI (khi cần)
 */

class ContentModerationService {
  constructor() {
    // Blacklist từ nhạy cảm (có thể load từ DB sau)
    this.sensitiveWords = {
      // Từ cấm rõ ràng (auto reject)
      banned: [
        // Spam/Scam
        'đa cấp',
        'mlm',
        'bán hàng đa cấp',
        'tuyển dụng ảo',
        'làm tại nhà không cần vốn',
        'thu nhập khủng',
        'kiếm tiền online dễ dàng',
        'nhận lương trước',

        // Nội dung không phù hợp
        'massage',
        'karaoke',
        'bar',
        'club',
        'nightclub',
        'tiếp khách',
        'phục vụ đặc biệt',

        // Lừa đảo
        'đầu tư',
        'cho vay',
        'vay tiền nhanh',
        'tín dụng đen',
        'cầm đồ',
        'thế chấp',

        // Từ nhạy cảm khác
        'sex',
        'xxx',
        'adult',
        '18+',
      ],

      // Từ cảnh báo (cần review)
      warning: [
        'part-time tại nhà',
        'làm thêm',
        'thu nhập thụ động',
        'bán hàng',
        'tư vấn',
        'chăm sóc khách hàng',
        'marketing',
        'quảng cáo',
      ],

      // Pattern đáng nghi
      suspiciousPatterns: [
        /(?:lương|thu nhập|kiếm).*(?:khủng|cao|nhanh|dễ)/i,
        /(?:không cần|không yêu cầu).*(?:kinh nghiệm|bằng cấp)/i,
        /(?:làm tại nhà|work from home).*(?:kiếm|thu nhập)/i,
        /(?:đầu tư|vay|cho vay).*(?:lãi|lợi nhuận)/i,
        /(?:tuyển|tìm).*(?:nữ|nam).*(?:trẻ|đẹp)/i,
      ],
    };

    // AI moderation (optional - chỉ dùng khi cần)
    this.useAI = process.env.USE_AI_MODERATION === 'true';
    this.aiService = null;

    if (this.useAI) {
      try {
        // Có thể dùng Gemini hoặc self-sufficient AI
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
        if (geminiApiKey && geminiApiKey.startsWith('AIzaSy')) {
          const genAI = new GoogleGenerativeAI(geminiApiKey);
          this.aiService = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
          });
          logger.info('✅ AI Moderation enabled (Gemini)');
        }
      } catch (error) {
        logger.warn(
          '⚠️ AI Moderation initialization failed, using rule-based only:',
          error.message
        );
        this.useAI = false;
      }
    }
  }

  /**
   * Main moderation function
   * @param {Object} jobData - Job data to moderate
   * @returns {Object} Moderation result
   */
  async moderateContent(jobData) {
    const textToCheck = this._extractText(jobData);

    // Step 1: Rule-based check (nhanh, ưu tiên)
    const ruleResult = this._ruleBasedCheck(textToCheck);

    if (ruleResult.action === 'REJECT') {
      // Banned words → REJECT ngay, không cần AI
      return {
        action: 'REJECT',
        confidence: 1.0,
        reasons: ruleResult.reasons,
        flags: ruleResult.flags,
        method: 'rule-based',
      };
    }

    // Nếu rule-based approve và không có warnings → APPROVE ngay
    if (
      ruleResult.action === 'APPROVE' &&
      ruleResult.warnings.length === 0 &&
      ruleResult.confidence >= 0.9
    ) {
      // Rule-based đủ chắc chắn, không có warnings, không cần AI
      return {
        action: 'APPROVE',
        confidence: ruleResult.confidence,
        reasons: [],
        flags: [],
        method: 'rule-based',
      };
    }

    // Step 2: AI check (nếu có warnings hoặc không chắc chắn)
    // Chỉ chuyển sang MANUAL_REVIEW nếu cả rule-based và AI đều không approve
    if (this.useAI && this.aiService) {
      try {
        const aiResult = await this._aiModerationCheck(textToCheck, ruleResult);

        // AI REJECT → REJECT ngay (cả rule-based và AI đều không ưng)
        if (aiResult.action === 'REJECT') {
          return {
            action: 'REJECT',
            confidence: Math.max(ruleResult.confidence, aiResult.confidence),
            reasons: [...ruleResult.reasons, ...aiResult.reasons],
            flags: [...ruleResult.flags, ...aiResult.flags],
            method: 'hybrid',
          };
        }

        // AI APPROVE → APPROVE (ngay cả khi rule-based có warnings)
        // AI đã phân tích ngữ cảnh và xác nhận an toàn
        // Nếu AI approve, chỉ cần confidence >= 0.7 (giảm threshold)
        if (aiResult.action === 'APPROVE') {
          if (aiResult.confidence >= 0.7) {
            // AI approve với confidence đủ cao → APPROVE
            return {
              action: 'APPROVE',
              confidence: aiResult.confidence,
              reasons: [],
              flags: [],
              method: 'hybrid',
            };
          } else {
            // AI approve nhưng confidence thấp (< 0.7) → vẫn approve nhưng log warning
            logger.warn('AI approved but with low confidence', {
              confidence: aiResult.confidence,
              flags: aiResult.flags,
            });
            return {
              action: 'APPROVE',
              confidence: aiResult.confidence,
              reasons: [],
              flags: aiResult.flags || [],
              method: 'hybrid',
            };
          }
        }

        // AI không approve hoặc không chắc chắn
        // Cả rule-based và AI đều không approve → MANUAL_REVIEW
        const allReasons = [...ruleResult.warnings, ...aiResult.reasons].filter(
          (r, i, arr) => arr.indexOf(r) === i
        ); // Remove duplicates

        logger.info('Both rule-based and AI did not approve', {
          ruleBasedWarnings: ruleResult.warnings.length,
          aiReasons: aiResult.reasons.length,
          aiConfidence: aiResult.confidence,
        });

        return {
          action: 'MANUAL_REVIEW',
          confidence: Math.min(
            ruleResult.confidence,
            aiResult.confidence || 0.7
          ),
          reasons: allReasons,
          flags: [...ruleResult.flags, ...aiResult.flags],
          method: 'hybrid',
        };
      } catch (aiError) {
        logger.error(
          'AI moderation failed, falling back to rule-based:',
          aiError.message
        );
        // Fallback to rule-based result
        // Nếu có warnings → MANUAL_REVIEW (vì AI fail, không thể verify)
        const finalReasons =
          ruleResult.reasons.length > 0
            ? ruleResult.reasons
            : ruleResult.warnings.length > 0
            ? ruleResult.warnings
            : [];

        const finalAction =
          ruleResult.warnings.length > 0
            ? 'MANUAL_REVIEW' // Có warnings nhưng AI fail → cần admin review
            : ruleResult.action === 'APPROVE'
            ? 'APPROVE'
            : 'MANUAL_REVIEW';

        return {
          action: finalAction,
          confidence: ruleResult.confidence,
          reasons: finalReasons,
          flags: ruleResult.flags,
          method: 'rule-based (AI failed)',
        };
      }
    }

    // No AI or AI disabled - return rule-based result
    // Nếu có warnings → MANUAL_REVIEW (vì không có AI để verify)
    // Nếu không có warnings → APPROVE
    const finalReasons =
      ruleResult.reasons.length > 0
        ? ruleResult.reasons
        : ruleResult.warnings.length > 0
        ? ruleResult.warnings
        : [];

    const finalAction =
      ruleResult.warnings.length > 0
        ? 'MANUAL_REVIEW' // Có warnings nhưng không có AI → cần admin review
        : ruleResult.action === 'APPROVE'
        ? 'APPROVE'
        : 'MANUAL_REVIEW';

    return {
      action: finalAction,
      confidence: ruleResult.confidence,
      reasons: finalReasons,
      flags: ruleResult.flags,
      method: 'rule-based',
    };
  }

  /**
   * Rule-based content check (nhanh, chính xác)
   */
  _ruleBasedCheck(text) {
    // Check trên text gốc (có dấu) cho từ khóa
    const originalText = text.toLowerCase();
    // Check trên text normalized cho patterns
    const normalizedText = this._normalizeText(text);

    const flags = [];
    const reasons = [];
    const warnings = [];

    // Debug logging (có thể tắt sau)
    logger.debug('Content moderation check', {
      textLength: text.length,
      originalTextSample: originalText.substring(0, 100),
      normalizedTextSample: normalizedText.substring(0, 100),
    });

    // Check banned words (auto reject) - check trên text gốc
    for (const word of this.sensitiveWords.banned) {
      const pattern = new RegExp(`\\b${this._escapeRegex(word)}\\b`, 'i');
      if (pattern.test(originalText)) {
        flags.push('banned_word');
        reasons.push(`Chứa từ nhạy cảm: "${word}"`);
        return {
          action: 'REJECT',
          confidence: 1.0,
          flags,
          reasons,
          warnings: [],
        };
      }
    }

    // Check suspicious patterns - check trên text gốc (có dấu) vì patterns có dấu
    for (const pattern of this.sensitiveWords.suspiciousPatterns) {
      if (pattern.test(originalText)) {
        flags.push('suspicious_pattern');
        warnings.push(`Phát hiện pattern đáng nghi: ${pattern.source}`);
      }
    }

    // Check warning words (cần review) - check trên text gốc
    for (const word of this.sensitiveWords.warning) {
      const pattern = new RegExp(`\\b${this._escapeRegex(word)}\\b`, 'i');
      if (pattern.test(originalText)) {
        flags.push('warning_word');
        warnings.push(`Chứa từ cảnh báo: "${word}"`);
      }
    }

    // Calculate confidence
    let confidence = 1.0;
    if (warnings.length > 0) {
      confidence = Math.max(0.6, 1.0 - warnings.length * 0.1);
    }

    // Nếu có warnings, cần manual review
    const result = {
      action: warnings.length > 0 ? 'MANUAL_REVIEW' : 'APPROVE',
      confidence,
      flags,
      reasons: [],
      warnings,
    };

    // Debug logging
    logger.debug('Rule-based check result', {
      warningsCount: warnings.length,
      flagsCount: flags.length,
      confidence,
      action: result.action,
      warnings: warnings.slice(0, 3), // Log first 3 warnings
    });

    return result;
  }

  /**
   * AI moderation check (chỉ khi cần)
   */
  async _aiModerationCheck(text, ruleResult) {
    if (!this.aiService) {
      return {
        action: 'APPROVE',
        confidence: 0.5,
        reasons: [],
        flags: [],
      };
    }

    try {
      const warningsText =
        ruleResult.warnings.length > 0
          ? `\n\nCẢNH BÁO TỪ HỆ THỐNG (rule-based đã phát hiện):\n${ruleResult.warnings
              .map((w, i) => `${i + 1}. ${w}`)
              .join('\n')}`
          : '';

      const prompt = `Bạn là chuyên gia phân tích nội dung tuyển dụng. Phân tích KỸ LƯỠNG nội dung sau:

NỘI DUNG:
${text.substring(0, 2000)}${warningsText}

NHIỆM VỤ:
Phân tích NGỮ CẢNH và đánh giá xem nội dung có an toàn, hợp pháp, và phù hợp không.

PHÂN TÍCH CẦN THIẾT:
1. NGỮ CẢNH: Từ khóa được dùng trong ngữ cảnh gì? Có hợp pháp không?
   - Ví dụ: "bán hàng" có thể là job sales hợp pháp hoặc MLM đáng nghi
   - Phân tích ngữ cảnh cụ thể, không chỉ dựa vào từ khóa

2. TÍNH THỰC TẾ: Lương, yêu cầu, điều kiện có thực tế không?
   - Thu nhập có hợp lý với yêu cầu không?
   - Có hứa hẹn quá mức, không thực tế không?

3. DẤU HIỆU LỪA ĐẢO: Có dấu hiệu scam, MLM, lừa đảo không?
   - Yêu cầu đầu tư/vốn ban đầu?
   - Thu nhập thụ động không rõ ràng?
   - Mô hình đa cấp ẩn?

4. CHẤT LƯỢNG: Nội dung có chuyên nghiệp, rõ ràng không?

QUAN TRỌNG:
- Phân tích NGỮ CẢNH, không chỉ từ khóa
- Nếu warnings từ rule-based là false positive (ví dụ: job bán hàng hợp pháp), hãy APPROVE
- Nếu warnings là đúng (ví dụ: MLM, lừa đảo), hãy REJECT
- Confidence phải chính xác dựa trên phân tích

Trả về JSON:
{
  "safe": true/false,
  "confidence": 0.0-1.0,
  "flags": ["spam", "scam", "inappropriate", "low_quality"],
  "reasons": ["lý do cụ thể, chi tiết"],
  "sensitiveContent": true/false
}

Chú ý:
- "safe": true nếu nội dung an toàn và hợp pháp (ngay cả khi có warnings từ rule-based)
- "safe": false nếu có vấn đề thực sự (spam, scam, không phù hợp)
- "confidence": độ tin cậy (1.0 = rất chắc chắn)
- "flags": các cờ cảnh báo
- "reasons": lý do cụ thể, chi tiết (nếu không an toàn)`;

      const result = await this.aiService.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().trim();

      // Parse JSON response
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch =
          textResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
          textResponse.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch
          ? jsonMatch[1] || jsonMatch[0]
          : textResponse;
        const analysis = JSON.parse(jsonText);

        // Log AI response để debug
        logger.info('AI moderation response', {
          safe: analysis.safe,
          confidence: analysis.confidence,
          flags: analysis.flags,
          reasons: analysis.reasons,
        });

        if (!analysis.safe) {
          return {
            action: 'REJECT',
            confidence: analysis.confidence || 0.8,
            reasons: analysis.reasons || ['Nội dung không phù hợp'],
            flags: analysis.flags || [],
          };
        }

        // AI approve - trả về với confidence từ AI
        return {
          action: 'APPROVE',
          confidence: analysis.confidence || 0.9, // Default 0.9 nếu AI không cho confidence
          reasons: [],
          flags: analysis.flags || [],
        };
      } catch (parseError) {
        logger.warn('Failed to parse AI moderation response', {
          error: parseError.message,
          aiResponse: textResponse.substring(0, 500), // Log first 500 chars
        });
        // Fallback: nếu không parse được, dùng rule-based result
        // Nếu có warnings → MANUAL_REVIEW (vì AI fail, không thể verify)
        const finalReasons =
          ruleResult.reasons.length > 0
            ? ruleResult.reasons
            : ruleResult.warnings.length > 0
            ? ruleResult.warnings
            : [];

        return {
          action:
            ruleResult.warnings.length > 0
              ? 'MANUAL_REVIEW'
              : ruleResult.action,
          confidence: ruleResult.confidence * 0.8, // Giảm confidence vì AI fail
          reasons: finalReasons,
          flags: ruleResult.flags,
        };
      }
    } catch (error) {
      logger.error('AI moderation check failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract text from job data
   */
  _extractText(jobData) {
    try {
      const parts = [
        jobData.title || '',
        jobData.description || '',
        // requirements có thể là string hoặc object
        typeof jobData.requirements === 'string'
          ? jobData.requirements
          : jobData.requirements?.description || '',
        // benefits có thể là string hoặc array
        Array.isArray(jobData.benefits)
          ? jobData.benefits.join(' ')
          : typeof jobData.benefits === 'string'
          ? jobData.benefits
          : '',
      ];
      return parts.join(' ').trim();
    } catch (error) {
      logger.error('Error extracting text from job data:', error.message);
      // Fallback: chỉ dùng title và description
      return `${jobData.title || ''} ${jobData.description || ''}`.trim();
    }
  }

  /**
   * Normalize text for checking
   */
  _normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/g, ' '); // Replace special chars with space
  }

  /**
   * Escape regex special characters
   */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Load sensitive words from database (optional - for dynamic updates)
   */
  async loadSensitiveWordsFromDB() {
    // TODO: Load from database if needed
    // const SensitiveWord = require('../../models/SensitiveWord');
    // const words = await SensitiveWord.find({ active: true });
    // this.sensitiveWords.banned = words.filter(w => w.level === 'banned').map(w => w.word);
    // this.sensitiveWords.warning = words.filter(w => w.level === 'warning').map(w => w.word);
  }
}

// Singleton instance
let moderationServiceInstance = null;

function getContentModerationService() {
  if (!moderationServiceInstance) {
    moderationServiceInstance = new ContentModerationService();
  }
  return moderationServiceInstance;
}

module.exports = {
  ContentModerationService,
  getContentModerationService,
};
