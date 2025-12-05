/**
 * Vietnamese Spell Checker Service
 * Uses AI-based Vietnamese text correction to fix PDF extraction errors
 * 
 * This replaces manual regex patterns with intelligent correction
 */

const axios = require('axios');

class VietnameseSpellChecker {
  constructor() {
    // Option 1: Use local Vietnamese dictionary + edit distance
    this.dictionary = this.loadVietnameseDictionary();
    
    // Option 2: Use external API (if available)
    this.apiEndpoint = process.env.VIETNAMESE_CORRECTION_API || null;
  }

  /**
   * Load Vietnamese common words dictionary
   * This includes common business terms, technical terms, etc.
   */
  loadVietnameseDictionary() {
    return new Set([
      // Common business terms
      'chứng từ', 'xuất nhập khẩu', 'giao nhận', 'vận tải', 'khai báo', 'hải quan',
      'công ty', 'doanh nghiệp', 'kinh doanh', 'quản lý', 'nhân viên', 'chăm sóc',
      'khách hàng', 'hợp đồng', 'báo cáo', 'tài chính', 'kế toán', 'công nợ',
      'hàng hóa', 'tài sản', 'sổ sách', 'hóa đơn', 'phần mềm', 'ngân hàng',
      
      // Skills & Education
      'kỹ năng', 'kinh nghiệm', 'học vấn', 'chứng chỉ', 'bằng cấp', 'văn phòng',
      'tin học', 'ngoại ngữ', 'tiếng anh', 'giao tiếp', 'làm việc nhóm', 'quản lý thời gian',
      'lãnh đạo', 'sáng tạo', 'logic', 'phân tích', 'giải quyết vấn đề',
      'thực tập', 'thực tập sinh', 'mục tiêu', 'nghề nghiệp', 'phát triển',
      
      // Job titles & Roles
      'kế toán', 'kế toán viên', 'nhân viên', 'quản lý', 'trưởng phòng', 'giám đốc',
      'thực tập sinh', 'chuyên viên', 'kỹ sư', 'lập trình viên', 'thiết kế',
      'marketing', 'kinh doanh', 'bán hàng', 'tư vấn', 'hỗ trợ',
      
      // Common actions
      'học hỏi', 'tiếp thu', 'áp dụng', 'thực hiện', 'phát triển', 'cải thiện',
      'sẵn sàng', 'cụ thể', 'chủ động', 'nghiên cứu', 'hệ thống hóa', 'hình thành',
      'tìm hiểu', 'quan sát', 'phối hợp', 'chuẩn bị', 'tổ chức', 'hỗ trợ',
      'kiểm tra', 'lưu trữ', 'quản lý', 'theo dõi', 'báo cáo', 'xử lý',
      
      // Common descriptors
      'tốt', 'giỏi', 'khá', 'xuất sắc', 'trung bình', 'cao', 'thấp', 'mạnh',
      'tốt nghiệp', 'chính xác', 'đầy đủ', 'kịp thời', 'hiệu quả', 'chuyên môn',
      'cơ động', 'linh hoạt', 'nhanh nhẹn', 'tỉ mỉ', 'cẩn thận', 'chu đáo',
      
      // Organizations
      'đại học', 'trường', 'học viện', 'viện', 'khoa', 'bộ môn', 'ban', 'phòng',
      'chi nhánh', 'văn phòng', 'trung tâm', 'tổ chức', 'hiệp hội', 'câu lạc bộ',
      
      // Locations
      'thành phố', 'tỉnh', 'quận', 'huyện', 'phường', 'xã', 'đường', 'số nhà',
      'hà nội', 'hồ chí minh', 'đà nẵng', 'cần thơ', 'hải phòng',
      
      // Add more as needed...
    ]);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for finding closest matching word
   */
  levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Find closest matching word from dictionary
   */
  findClosestMatch(word, maxDistance = 2) {
    const wordLower = word.toLowerCase().trim();
    let closestMatch = null;
    let minDistance = Infinity;

    // Try exact match first
    if (this.dictionary.has(wordLower)) {
      return wordLower;
    }

    // Try fuzzy matching
    for (const dictWord of this.dictionary) {
      const distance = this.levenshteinDistance(wordLower, dictWord);
      
      if (distance <= maxDistance && distance < minDistance) {
        minDistance = distance;
        closestMatch = dictWord;
      }
    }

    return closestMatch;
  }

  /**
   * Correct Vietnamese text using dictionary + edit distance
   */
  correctText(text) {
    console.log('🔤 Running Vietnamese spell checker...');
    
    // Split into words (preserve spaces and punctuation)
    const words = text.split(/(\s+|[.,;:!?()•\-–—])/);
    const correctedWords = [];

    for (let word of words) {
      // Skip whitespace, punctuation, numbers, and single characters
      if (!word.trim() || /^[\s.,;:!?()•\-–—\d]$/.test(word) || word.length < 2) {
        correctedWords.push(word);
        continue;
      }

      // Try to find correction
      const correction = this.findClosestMatch(word);
      
      if (correction) {
        console.log(`   ✏️  "${word}" → "${correction}"`);
        correctedWords.push(correction);
      } else {
        correctedWords.push(word);
      }
    }

    const correctedText = correctedWords.join('');
    console.log(`✅ Spell check complete (${correctedWords.length} tokens processed)`);
    
    return correctedText;
  }

  /**
   * Correct multi-word phrases (compound words)
   * This is more accurate than single-word correction
   */
  correctPhrases(text) {
    console.log('🔤 Correcting Vietnamese phrases...');
    
    // Define common 2-word and 3-word phrases with their corrections
    // Each entry: [wrong_pattern, correct_text]
    // Patterns support flexible spacing: \s* matches 0+ spaces
    const phraseCorrections = new Map([
      // 2-word phrases with spacing variations
      ['chứ\\s*từ', 'chứng từ'],
      ['chú\\s*từ', 'chứng từ'],
      ['chữ\\s*từ', 'chứng từ'],
      ['chức\\s*từ', 'chứng từ'],  // NEW: "chức từ" typo
      
      // Common compound words (with/without spacing)
      ['xuất\\s*nhập', 'xuất nhập'],
      ['giao\\s*nhận', 'giao nhận'],
      ['khai\\s*báo', 'khai báo'],
      ['học\\s*hỏi', 'học hỏi'],
      ['áp\\s*dụ', 'áp dụng'],
      ['sẵn\\s*sà', 'sẵn sàng'],
      ['cụ\\s*thể', 'cụ thể'],
      ['tài\\s*nă', 'tài năng'],
      ['cơ\\s*độ', 'cơ động'],
      ['tin\\s*học', 'tin học'],
      ['tinh\\s*học', 'tin học'],
      ['bán\\s*hàng', 'bán hàng'],
      ['bánh\\s*hàng', 'bán hàng'],  // "bánh hàng" typo
      ['quản\\s*lý', 'quản lý'],
      ['kinh\\s*doanh', 'kinh doanh'],
      ['lô\\s*hà', 'lô hàng'],
      ['hệ\\s*thố', 'hệ thống'],
      ['chăm\\s*sóc', 'chăm sóc'],
      ['khách\\s*hàng', 'khách hàng'],
      ['công\\s*ty', 'công ty'],
      ['dịch\\s*vụ', 'dịch vụ'],
      ['vận\\s*tải', 'vận tải'],
      ['hải\\s*quan', 'hải quan'],
      ['hồ\\s*sơ', 'hồ sơ'],
      ['văn\\s*phòng', 'văn phòng'],
      ['chứng\\s*chỉ', 'chứng chỉ'],
      ['thực\\s*tập', 'thực tập'],
      ['sinh\\s*viên', 'sinh viên'],
      ['kỹ\\s*năng', 'kỹ năng'],
      ['kinh\\s*nghiệm', 'kinh nghiệm'],
      ['mục\\s*tiêu', 'mục tiêu'],
      ['khám\\s*sức', 'khám sức'],
      ['sức\\s*khỏe', 'sức khỏe'],
      ['bắn\\s*súng', 'bắn súng'],
      ['hội\\s*thao', 'hội thao'],
      ['quốc\\s*phòng', 'quốc phòng'],
      ['quân\\s*sự', 'quân sự'],
      ['ban\\s*chỉ', 'ban chỉ'],
      ['đồ\\s*dù', 'đồ dùng'],  // "đồ dù" -> "đồ dùng"
      
      // 3-word phrases
      ['kỹ\\s*năng\\s*giao\\s*tiếp', 'kỹ năng giao tiếp'],
      ['làm\\s*việc\\s*nhóm', 'làm việc nhóm'],
      ['quản\\s*lý\\s*thời\\s*gian', 'quản lý thời gian'],
      ['chăm\\s*sóc\\s*khách\\s*hàng', 'chăm sóc khách hàng'],
    ]);

    let correctedText = text;
    
    // Apply phrase corrections (patterns already have \\s* for flexible spacing)
    for (const [wrongPattern, correct] of phraseCorrections) {
      const regex = new RegExp(wrongPattern, 'gi');
      
      const beforeCorrection = correctedText;
      correctedText = correctedText.replace(regex, correct);
      
      if (correctedText !== beforeCorrection) {
        console.log(`   ✏️  Fixed: "${wrongPattern.replace(/\\\\s\*/g, ' ')}" → "${correct}"`);
      }
    }

    console.log('✅ Phrase correction complete');
    return correctedText;
  }

  /**
   * Main correction pipeline
   */
  async correct(text) {
    try {
      console.log('🔤 Starting Vietnamese spell correction...');
      
      // Step 1: Phrase-based correction (more accurate with context)
      let corrected = this.correctPhrases(text);
      
      // Step 2: Word-based correction (fallback for unknown phrases)
      // corrected = this.correctText(corrected); // Optional - can be slow
      
      console.log('✅ Spell correction completed');
      return corrected;
    } catch (error) {
      console.error('❌ Spell check failed:', error.message);
      return text; // Return original if correction fails
    }
  }
}

// Export singleton instance
module.exports = new VietnameseSpellChecker();
