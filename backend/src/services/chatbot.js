// AI Chatbot Service with Intent Recognition and Context Awareness
const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');

class AIChatbot {
  constructor() {
    this.intentClassifier = null;
    this.entityExtractor = null;
    this.contextManager = null;
    this.responseGenerator = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize intent classifier
      this.intentClassifier = new natural.BayesClassifier();
      this.trainIntentClassifier();
      
      // Initialize entity extractor
      this.entityExtractor = new natural.RegexpTokenizer({ pattern: /\s+/ });
      
      // Initialize context manager
      this.contextManager = new Map();
      
      // Initialize response generator
      this.responseGenerator = new Map();
      this.initializeResponseTemplates();
      
      this.isInitialized = true;
      console.log('✅ AI Chatbot initialized successfully');
    } catch (error) {
      console.error('❌ AI Chatbot initialization failed:', error);
    }
  }

  trainIntentClassifier() {
    // Training data for different intents
    const trainingData = [
      // Job search intents
      { text: 'Tôi muốn tìm việc intern', intent: 'job_search' },
      { text: 'Có việc intern nào không?', intent: 'job_search' },
      { text: 'Tìm việc thực tập', intent: 'job_search' },
      { text: 'Show me intern jobs', intent: 'job_search' },
      { text: 'Tôi cần tìm việc làm', intent: 'job_search' },
      
      // Job details intents
      { text: 'Chi tiết công việc này', intent: 'job_details' },
      { text: 'Mô tả công việc', intent: 'job_details' },
      { text: 'Yêu cầu công việc', intent: 'job_details' },
      { text: 'Lương bao nhiêu?', intent: 'job_details' },
      { text: 'Địa điểm làm việc', intent: 'job_details' },
      
      // Application intents
      { text: 'Làm sao để ứng tuyển?', intent: 'application_help' },
      { text: 'Cách nộp đơn', intent: 'application_help' },
      { text: 'Trình tự ứng tuyển', intent: 'application_help' },
      { text: 'Cần chuẩn bị gì?', intent: 'application_help' },
      
      // Profile intents
      { text: 'Cập nhật hồ sơ', intent: 'profile_management' },
      { text: 'Sửa thông tin cá nhân', intent: 'profile_management' },
      { text: 'Upload CV', intent: 'profile_management' },
      { text: 'Thay đổi mật khẩu', intent: 'profile_management' },
      
      // General help intents
      { text: 'Giúp đỡ', intent: 'general_help' },
      { text: 'Hướng dẫn sử dụng', intent: 'general_help' },
      { text: 'FAQ', intent: 'general_help' },
      { text: 'Liên hệ hỗ trợ', intent: 'general_help' },
      
      // Greeting intents
      { text: 'Xin chào', intent: 'greeting' },
      { text: 'Hello', intent: 'greeting' },
      { text: 'Hi', intent: 'greeting' },
      { text: 'Chào bạn', intent: 'greeting' },
      
      // Goodbye intents
      { text: 'Tạm biệt', intent: 'goodbye' },
      { text: 'Bye', intent: 'goodbye' },
      { text: 'Cảm ơn', intent: 'goodbye' },
      { text: 'Thank you', intent: 'goodbye' }
    ];

    // Train the classifier
    trainingData.forEach(item => {
      this.intentClassifier.addDocument(item.text, item.intent);
    });
    
    this.intentClassifier.train();
  }

  initializeResponseTemplates() {
    this.responseGenerator.set('greeting', [
      'Xin chào! Tôi là trợ lý AI của InternBridge. Tôi có thể giúp bạn tìm việc intern, hướng dẫn ứng tuyển, hoặc trả lời các câu hỏi khác. Bạn cần gì?',
      'Chào bạn! Tôi ở đây để hỗ trợ bạn tìm việc thực tập phù hợp. Bạn muốn tìm hiểu gì?',
      'Hello! I\'m your AI assistant for finding internship opportunities. How can I help you today?'
    ]);

    this.responseGenerator.set('job_search', [
      'Tôi sẽ giúp bạn tìm việc intern. Bạn có thể cho tôi biết:\n- Ngành nghề bạn quan tâm\n- Địa điểm mong muốn\n- Mức lương mong đợi',
      'Để tìm việc intern phù hợp, hãy cho tôi biết:\n- Kỹ năng của bạn\n- Thành phố bạn muốn làm việc\n- Loại công việc (full-time/part-time)',
      'I can help you find internship opportunities. Please tell me:\n- Your field of interest\n- Preferred location\n- Expected salary range'
    ]);

    this.responseGenerator.set('job_details', [
      'Để xem chi tiết công việc, bạn có thể:\n1. Click vào tiêu đề công việc\n2. Xem mô tả chi tiết\n3. Kiểm tra yêu cầu và lương\n4. Nộp đơn trực tiếp',
      'Chi tiết công việc bao gồm:\n- Mô tả công việc\n- Yêu cầu kỹ năng\n- Mức lương\n- Địa điểm\n- Thời gian làm việc',
      'Job details include:\n- Job description\n- Required skills\n- Salary information\n- Location\n- Working hours'
    ]);

    this.responseGenerator.set('application_help', [
      'Để ứng tuyển, bạn cần:\n1. Tạo tài khoản và hoàn thiện hồ sơ\n2. Upload CV và cover letter\n3. Tìm công việc phù hợp\n4. Click "Ứng tuyển" và điền thông tin',
      'Quy trình ứng tuyển:\n- Chuẩn bị CV chuyên nghiệp\n- Viết cover letter thuyết phục\n- Kiểm tra yêu cầu công việc\n- Nộp đơn và theo dõi trạng thái',
      'To apply for a job:\n1. Create account and complete profile\n2. Upload CV and cover letter\n3. Find suitable job\n4. Click "Apply" and fill information'
    ]);

    this.responseGenerator.set('profile_management', [
      'Để cập nhật hồ sơ:\n1. Vào "Hồ sơ cá nhân"\n2. Chỉnh sửa thông tin\n3. Upload CV mới\n4. Lưu thay đổi',
      'Quản lý hồ sơ bao gồm:\n- Thông tin cá nhân\n- Kinh nghiệm làm việc\n- Học vấn\n- Kỹ năng\n- CV và portfolio',
      'To update your profile:\n1. Go to "Personal Profile"\n2. Edit information\n3. Upload new CV\n4. Save changes'
    ]);

    this.responseGenerator.set('general_help', [
      'Tôi có thể giúp bạn:\n- Tìm việc intern\n- Hướng dẫn ứng tuyển\n- Quản lý hồ sơ\n- Trả lời câu hỏi chung',
      'Các tính năng chính:\n- Tìm kiếm công việc thông minh\n- Gợi ý việc làm phù hợp\n- Hỗ trợ ứng tuyển\n- Theo dõi đơn ứng tuyển',
      'I can help you with:\n- Finding internships\n- Application guidance\n- Profile management\n- General questions'
    ]);

    this.responseGenerator.set('goodbye', [
      'Cảm ơn bạn đã sử dụng InternBridge! Chúc bạn tìm được việc intern phù hợp. Nếu cần hỗ trợ thêm, hãy quay lại nhé!',
      'Tạm biệt! Hy vọng bạn tìm được cơ hội thực tập tốt. Hẹn gặp lại!',
      'Thank you for using InternBridge! Good luck with your internship search. Come back anytime!'
    ]);
  }

  async processMessage(sessionId, userId, message, context = {}) {
    try {
      // Preprocess message
      const cleanedMessage = this.preprocessMessage(message);
      
      // Detect intent
      const intent = this.detectIntent(cleanedMessage);
      
      // Extract entities
      const entities = this.extractEntities(cleanedMessage);
      
      // Update context
      this.updateContext(sessionId, { intent, entities, lastMessage: message });
      
      // Generate response
      const response = await this.generateResponse(sessionId, intent, entities, context);
      
      return {
        message: response,
        intent: intent,
        entities: entities,
        confidence: this.getIntentConfidence(intent),
        suggestions: this.getSuggestions(intent)
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: 'Xin lỗi, tôi gặp lỗi khi xử lý tin nhắn. Bạn có thể thử lại không?',
        intent: 'error',
        entities: [],
        confidence: 0,
        suggestions: ['Tìm việc intern', 'Hướng dẫn ứng tuyển', 'Liên hệ hỗ trợ']
      };
    }
  }

  preprocessMessage(message) {
    return message
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detectIntent(message) {
    if (!this.intentClassifier) {
      return 'general_help';
    }
    
    return this.intentClassifier.classify(message);
  }

  extractEntities(message) {
    const entities = [];
    
    // Extract job-related entities
    const jobKeywords = ['intern', 'thực tập', 'internship', 'trainee', 'fresher'];
    jobKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        entities.push({ type: 'job_type', value: keyword });
      }
    });
    
    // Extract location entities
    const locations = ['hà nội', 'hồ chí minh', 'đà nẵng', 'hanoi', 'ho chi minh', 'danang'];
    locations.forEach(location => {
      if (message.includes(location)) {
        entities.push({ type: 'location', value: location });
      }
    });
    
    // Extract skill entities
    const skills = ['javascript', 'react', 'python', 'java', 'marketing', 'design'];
    skills.forEach(skill => {
      if (message.includes(skill)) {
        entities.push({ type: 'skill', value: skill });
      }
    });
    
    return entities;
  }

  updateContext(sessionId, data) {
    if (!this.contextManager.has(sessionId)) {
      this.contextManager.set(sessionId, {
        conversationHistory: [],
        userPreferences: {},
        currentIntent: null,
        entities: []
      });
    }
    
    const context = this.contextManager.get(sessionId);
    context.conversationHistory.push({
      timestamp: new Date(),
      ...data
    });
    
    // Keep only last 10 messages
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }
    
    context.currentIntent = data.intent;
    context.entities = data.entities;
  }

  async generateResponse(sessionId, intent, entities, context) {
    const templates = this.responseGenerator.get(intent) || this.responseGenerator.get('general_help');
    let response = templates[Math.floor(Math.random() * templates.length)];
    
    // Personalize response based on entities and context
    response = this.personalizeResponse(response, entities, context);
    
    // Add contextual information
    response = this.addContextualInfo(response, sessionId, intent);
    
    return response;
  }

  personalizeResponse(response, entities, context) {
    let personalized = response;
    
    // Add location-specific information
    const locationEntity = entities.find(e => e.type === 'location');
    if (locationEntity) {
      personalized = personalized.replace(
        'Địa điểm mong muốn',
        `Địa điểm: ${locationEntity.value}`
      );
    }
    
    // Add skill-specific information
    const skillEntity = entities.find(e => e.type === 'skill');
    if (skillEntity) {
      personalized = personalized.replace(
        'Ngành nghề bạn quan tâm',
        `Kỹ năng: ${skillEntity.value}`
      );
    }
    
    return personalized;
  }

  addContextualInfo(response, sessionId, intent) {
    const context = this.contextManager.get(sessionId);
    if (!context) return response;
    
    // Add follow-up suggestions based on conversation history
    if (intent === 'job_search' && context.conversationHistory.length > 1) {
      response += '\n\nBạn có muốn tôi gợi ý một số công việc phù hợp không?';
    }
    
    return response;
  }

  getIntentConfidence(intent) {
    // In a real implementation, this would return the actual confidence score
    // from the classifier
    const confidenceScores = {
      'greeting': 0.95,
      'job_search': 0.85,
      'job_details': 0.80,
      'application_help': 0.75,
      'profile_management': 0.70,
      'general_help': 0.65,
      'goodbye': 0.90
    };
    
    return confidenceScores[intent] || 0.5;
  }

  getSuggestions(intent) {
    const suggestions = {
      'greeting': ['Tìm việc intern', 'Hướng dẫn sử dụng', 'Liên hệ hỗ trợ'],
      'job_search': ['Xem việc làm mới nhất', 'Tìm theo kỹ năng', 'Tìm theo địa điểm'],
      'job_details': ['Xem chi tiết', 'Ứng tuyển ngay', 'Lưu công việc'],
      'application_help': ['Tạo hồ sơ', 'Upload CV', 'Xem trạng thái đơn'],
      'profile_management': ['Cập nhật thông tin', 'Upload CV mới', 'Thay đổi mật khẩu'],
      'general_help': ['FAQ', 'Hướng dẫn', 'Liên hệ'],
      'goodbye': ['Tạm biệt', 'Cảm ơn', 'Hẹn gặp lại']
    };
    
    return suggestions[intent] || ['Tìm việc intern', 'Hướng dẫn', 'Liên hệ'];
  }

  // Get conversation history
  getConversationHistory(sessionId) {
    const context = this.contextManager.get(sessionId);
    return context ? context.conversationHistory : [];
  }

  // Clear conversation context
  clearContext(sessionId) {
    this.contextManager.delete(sessionId);
  }

  // Get chatbot statistics
  getStats() {
    return {
      activeSessions: this.contextManager.size,
      isInitialized: this.isInitialized,
      totalIntents: this.intentClassifier ? this.intentClassifier.docs.length : 0
    };
  }
}

// Initialize singleton instance
const chatbot = new AIChatbot();

// Initialize on module load
chatbot.initialize().catch(console.error);

module.exports = {
  processMessage: (sessionId, userId, message, context) => 
    chatbot.processMessage(sessionId, userId, message, context),
  getConversationHistory: (sessionId) => 
    chatbot.getConversationHistory(sessionId),
  clearContext: (sessionId) => 
    chatbot.clearContext(sessionId),
  getStats: () => 
    chatbot.getStats(),
  AIChatbot
};
