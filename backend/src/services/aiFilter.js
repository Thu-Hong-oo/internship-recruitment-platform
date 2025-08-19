// Advanced AI Filter v2: NLP + ML + Vietnamese Language Support
const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@huggingface/transformers');

class AdvancedJobFilter {
  constructor() {
    this.tokenizer = null;
    this.model = null;
    this.classifier = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Load Vietnamese BERT model
      this.tokenizer = await pipeline('tokenizer', 'vinai/phobert-base');
      this.model = await pipeline('text-classification', 'vinai/phobert-base');
      
      // Initialize custom classifier
      this.classifier = new natural.BayesClassifier();
      this.trainClassifier();
      
      this.isInitialized = true;
      console.log('✅ AI Filter initialized successfully');
    } catch (error) {
      console.error('❌ AI Filter initialization failed:', error);
      // Fallback to basic classifier
      this.initializeBasicClassifier();
    }
  }

  trainClassifier() {
    // Training data for intern job classification
    const trainingData = [
      // Intern jobs (positive examples)
      { text: 'Tuyển thực tập sinh lập trình web', label: 'intern' },
      { text: 'Internship program for software development', label: 'intern' },
      { text: 'Thực tập sinh marketing', label: 'intern' },
      { text: 'Trainee position in data analysis', label: 'intern' },
      { text: 'Intern - Frontend Developer', label: 'intern' },
      { text: 'Thực tập sinh UI/UX Design', label: 'intern' },
      { text: 'Summer internship 2024', label: 'intern' },
      { text: 'Graduate internship program', label: 'intern' },
      
      // Non-intern jobs (negative examples)
      { text: 'Senior Software Engineer', label: 'non-intern' },
      { text: 'Team Lead Developer', label: 'non-intern' },
      { text: 'Principal Architect', label: 'non-intern' },
      { text: 'Manager - IT Department', label: 'non-intern' },
      { text: 'Staff Engineer', label: 'non-intern' },
      { text: 'Senior Product Manager', label: 'non-intern' },
      { text: 'Technical Lead', label: 'non-intern' },
      { text: 'Senior Data Scientist', label: 'non-intern' }
    ];

    // Train the classifier
    trainingData.forEach(item => {
      this.classifier.addDocument(item.text, item.label);
    });
    
    this.classifier.train();
  }

  initializeBasicClassifier() {
    // Enhanced keyword-based approach as fallback
    this.INTERN_PATTERNS = [
      // Direct intern keywords
      /\b(intern|thực\s*tập|internship|trainee)\b/i,
      /\b(thực\s*tập\s*sinh|sinh\s*viên\s*thực\s*tập)\b/i,
      
      // Position patterns
      /\b(intern|thực\s*tập)\s*[-:|]\s*\w+/i,
      /\b(tuyển|tìm|cần)\s+(thực\s*tập\s*sinh|intern)/i,
      
      // Education level indicators
      /\b(sinh\s*viên|student|graduate|fresh\s*graduate)\b/i,
      /\b(đang\s*học|studying|final\s*year)\b/i,
      
      // Duration patterns
      /\b(3\s*-\s*6\s*tháng|6\s*tháng|part\s*time)\b/i,
      /\b(summer|winter|spring)\s*(internship|program)\b/i
    ];

    this.NEGATIVE_PATTERNS = [
      // Senior/experienced positions
      /\b(senior|lead|manager|architect|principal|staff)\b/i,
      /\b(5\+|3\+|2\+)\s*(năm|years?)\s*(kinh\s*nghiệm|experience)\b/i,
      
      // Management keywords
      /\b(quản\s*lý|manage|supervise|mentor)\b/i,
      /\b(team\s*lead|project\s*manager|director)\b/i
    ];

    this.EXPERIENCE_LEVELS = {
      'entry': ['entry', 'junior', 'fresher', 'mới tốt nghiệp', 'sinh viên'],
      'mid': ['mid', 'intermediate', '2-3 năm', '3-5 năm'],
      'senior': ['senior', 'lead', 'manager', '5+ năm', 'principal']
    };
  }

  async analyzeJobWithNLP(jobText) {
    if (!this.isInitialized) {
      return this.analyzeJobBasic(jobText);
    }

    try {
      // Text preprocessing
      const cleanedText = this.preprocessText(jobText);
      
      // BERT-based classification
      const bertResult = await this.model(cleanedText);
      
      // Custom classifier
      const customResult = this.classifier.classify(cleanedText);
      
      // Feature extraction
      const features = this.extractFeatures(cleanedText);
      
      // Ensemble decision
      const finalScore = this.combinePredictions(bertResult, customResult, features);
      
      return {
        isIntern: finalScore > 0.7,
        confidence: finalScore,
        method: 'nlp',
        features: features,
        bertScore: bertResult[0]?.score || 0,
        customScore: customResult === 'intern' ? 0.8 : 0.2
      };
    } catch (error) {
      console.error('NLP analysis failed, falling back to basic:', error);
      return this.analyzeJobBasic(jobText);
    }
  }

  analyzeJobBasic(jobText) {
    const text = jobText.toLowerCase();
    let score = 0;
    const matchedPatterns = [];
    const negativeMatches = [];

    // Check positive patterns
    this.INTERN_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(text)) {
        score += 0.3;
        matchedPatterns.push(`pattern_${index}`);
      }
    });

    // Check negative patterns
    this.NEGATIVE_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(text)) {
        score -= 0.4;
        negativeMatches.push(`negative_${index}`);
      }
    });

    // Experience level analysis
    const experienceLevel = this.analyzeExperienceLevel(text);
    if (experienceLevel === 'senior') {
      score -= 0.5;
    } else if (experienceLevel === 'entry') {
      score += 0.3;
    }

    // Title analysis
    const titleScore = this.analyzeTitle(jobText.split('\n')[0] || '');
    score += titleScore;

    return {
      isIntern: score >= 0.5,
      confidence: Math.max(0, Math.min(1, score)),
      method: 'basic',
      matchedPatterns,
      negativeMatches,
      experienceLevel
    };
  }

  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ') // Remove special chars, keep Vietnamese
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  extractFeatures(text) {
    const features = {
      hasInternKeyword: /\b(intern|thực\s*tập)\b/i.test(text),
      hasStudentKeyword: /\b(sinh\s*viên|student)\b/i.test(text),
      hasExperienceRequirement: /\b(kinh\s*nghiệm|experience)\b/i.test(text),
      hasEducationRequirement: /\b(bằng\s*cấp|degree|education)\b/i.test(text),
      hasDurationMention: /\b(tháng|month|tuần|week)\b/i.test(text),
      hasSalaryMention: /\b(lương|salary|stipend)\b/i.test(text),
      textLength: text.length,
      wordCount: text.split(/\s+/).length
    };

    return features;
  }

  combinePredictions(bertResult, customResult, features) {
    let score = 0;
    
    // BERT score (40% weight)
    if (bertResult && bertResult[0]) {
      score += bertResult[0].score * 0.4;
    }
    
    // Custom classifier score (30% weight)
    score += (customResult === 'intern' ? 0.8 : 0.2) * 0.3;
    
    // Feature-based score (30% weight)
    const featureScore = this.calculateFeatureScore(features);
    score += featureScore * 0.3;
    
    return score;
  }

  calculateFeatureScore(features) {
    let score = 0;
    
    if (features.hasInternKeyword) score += 0.3;
    if (features.hasStudentKeyword) score += 0.2;
    if (!features.hasExperienceRequirement) score += 0.1;
    if (features.hasDurationMention) score += 0.1;
    if (features.hasSalaryMention) score += 0.05;
    
    // Normalize by text length
    if (features.textLength > 100 && features.textLength < 2000) {
      score += 0.05;
    }
    
    return Math.min(1, score);
  }

  analyzeExperienceLevel(text) {
    const lowerText = text.toLowerCase();
    
    for (const [level, keywords] of Object.entries(this.EXPERIENCE_LEVELS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return level;
      }
    }
    
    return 'unknown';
  }

  analyzeTitle(title) {
    const lowerTitle = title.toLowerCase();
    let score = 0;
    
    // Strong intern indicators in title
    if (/\b(intern|thực\s*tập)\b/i.test(lowerTitle)) {
      score += 0.4;
    }
    
    // Weak intern indicators
    if (/\b(junior|entry|fresher)\b/i.test(lowerTitle)) {
      score += 0.2;
    }
    
    // Negative indicators
    if (/\b(senior|lead|manager)\b/i.test(lowerTitle)) {
      score -= 0.3;
    }
    
    return score;
  }

  async filterJobIsIntern(job) {
    const jobText = [
      job.title,
      job.description,
      (job.requirements || ''),
      (job.tags || []).join(' '),
      (job.skills || []).join(' ')
    ].filter(Boolean).join('\n');

    if (this.isInitialized) {
      return await this.analyzeJobWithNLP(jobText);
    } else {
      return this.analyzeJobBasic(jobText);
    }
  }

  // Batch processing for multiple jobs
  async filterJobsBatch(jobs) {
    const results = [];
    
    for (const job of jobs) {
      const result = await this.filterJobIsIntern(job);
      results.push({
        jobId: job._id || job.id,
        ...result
      });
    }
    
    return results;
  }

  // Get model performance metrics
  getModelStats() {
    return {
      isInitialized: this.isInitialized,
      method: this.isInitialized ? 'nlp' : 'basic',
      trainingDataSize: this.classifier ? this.classifier.docs.length : 0
    };
  }
}

// Initialize singleton instance
const jobFilter = new AdvancedJobFilter();

// Initialize on module load
jobFilter.initialize().catch(console.error);

module.exports = { 
  filterJobIsIntern: (job) => jobFilter.filterJobIsIntern(job),
  filterJobsBatch: (jobs) => jobFilter.filterJobsBatch(jobs),
  getModelStats: () => jobFilter.getModelStats(),
  AdvancedJobFilter
};



