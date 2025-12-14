/**
 * Rule-Based CV Parser
 * 
 * Parse CV từ PDF/DOCX mà KHÔNG cần AI (Ollama hoặc Gemini)
 * Sử dụng regex patterns và rule-based extraction
 * 
 * Ưu điểm:
 * - ✅ Nhanh (instant, không cần chờ AI)
 * - ✅ Miễn phí (không tốn API costs)
 * - ✅ Privacy (không gửi data lên cloud)
 * - ✅ Offline (không cần internet)
 * 
 * Nhược điểm:
 * - ⚠️ Độ chính xác thấp hơn AI (70-80% vs 95%+)
 * - ⚠️ Không hiểu context phức tạp
 * - ⚠️ Cần CV format chuẩn
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const vietnameseSpellChecker = require('./vietnameseSpellChecker');
const { logger } = require('../../utils/logger');

class RuleBasedCVParser {
  constructor() {
    // Common Vietnamese surnames
    this.vietnameseSurnames = [
      'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ',
      'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Mai', 'Cao', 'Tạ', 'Lưu'
    ];
    
    // Comprehensive 300+ skill patterns (English + Vietnamese)
    this.skillKeywords = {
      // Programming Languages (50+)
      programmingLanguages: [
        // JavaScript ecosystem
        'javascript', 'js', 'typescript', 'ts', 'ecmascript', 'es6', 'es7', 'es2015',
        // Python
        'python', 'python3', 'python2', 'py',
        // Java ecosystem
        'java', 'java8', 'java11', 'java17', 'kotlin', 'scala', 'groovy',
        // C family
        'c', 'c++', 'cpp', 'c#', 'csharp',
        // Web
        'php', 'ruby', 'perl', 'go', 'golang', 'rust', 'swift', 'objective-c',
        // Scripting
        'bash', 'shell', 'powershell', 'lua',
        // Other
        'r', 'matlab', 'julia', 'dart', 'elixir', 'haskell', 'clojure'
      ],

      // Frontend Frameworks & Libraries (40+)
      frontend: [
        // React ecosystem
        'react', 'reactjs', 'react.js', 'react native', 'react-native', 'nextjs', 'next.js', 'gatsby',
        'redux', 'redux-saga', 'redux-thunk', 'mobx', 'recoil', 'zustand',
        // Vue ecosystem
        'vue', 'vuejs', 'vue.js', 'vue2', 'vue3', 'vuex', 'nuxt', 'nuxtjs', 'nuxt.js',
        // Angular
        'angular', 'angularjs', 'angular2', 'angular4', 'angular10', 'rxjs', 'ngrx',
        // Other frameworks
        'svelte', 'ember', 'backbone', 'preact', 'solid', 'qwik',
        // UI Libraries
        'jquery', 'bootstrap', 'tailwind', 'tailwindcss', 'material-ui', 'mui',
        'ant design', 'antd', 'chakra ui', 'styled-components', 'sass', 'scss', 'less'
      ],

      // Backend Frameworks (30+)
      backend: [
        // Node.js ecosystem
        'nodejs', 'node.js', 'node', 'express', 'expressjs', 'express.js', 'nestjs', 'nest.js',
        'fastify', 'koa', 'hapi', 'adonis', 'adonisjs', 'sails', 'meteor',
        // Python frameworks
        'django', 'flask', 'fastapi', 'tornado', 'pyramid', 'bottle',
        // Java frameworks
        'spring', 'spring boot', 'springboot', 'hibernate', 'struts', 'play',
        // PHP frameworks
        'laravel', 'symfony', 'codeigniter', 'yii', 'cakephp',
        // Ruby
        'rails', 'ruby on rails', 'sinatra',
        // Go
        'gin', 'echo', 'fiber', 'beego',
        // .NET
        'asp.net', 'aspnet', '.net core', 'dotnet'
      ],

      // Databases (35+)
      databases: [
        // SQL databases
        'mysql', 'postgresql', 'postgres', 'mariadb', 'sqlite', 'oracle', 'mssql',
        'sql server', 'db2', 'sybase',
        // NoSQL databases
        'mongodb', 'mongo', 'cassandra', 'couchdb', 'couchbase', 'dynamodb',
        // In-memory databases
        'redis', 'memcached', 'hazelcast',
        // Graph databases
        'neo4j', 'arangodb', 'orientdb',
        // Time-series
        'influxdb', 'timescaledb', 'prometheus',
        // Search engines
        'elasticsearch', 'opensearch', 'solr', 'algolia',
        // Other
        'firebase', 'supabase', 'planetscale'
      ],

      // DevOps & Cloud (40+)
      devops: [
        // Containers
        'docker', 'kubernetes', 'k8s', 'helm', 'podman', 'containerd',
        // CI/CD
        'jenkins', 'gitlab ci', 'github actions', 'circleci', 'travis ci', 'bamboo',
        'teamcity', 'azure devops', 'codepipeline',
        // Cloud providers
        'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'alibaba cloud',
        'digitalocean', 'heroku', 'vercel', 'netlify', 'cloudflare',
        // AWS services
        'ec2', 's3', 'lambda', 'dynamodb', 'rds', 'eks', 'ecs', 'cloudfront',
        // Infrastructure as Code
        'terraform', 'ansible', 'puppet', 'chef', 'cloudformation', 'vagrant',
        // Monitoring
        'grafana', 'kibana', 'datadog', 'new relic', 'splunk'
      ],

      // Testing & QA (20+)
      testing: [
        'jest', 'mocha', 'chai', 'jasmine', 'karma', 'cypress', 'selenium',
        'puppeteer', 'playwright', 'testcafe', 'junit', 'pytest', 'rspec',
        'cucumber', 'postman', 'insomnia', 'jmeter', 'gatling', 'k6'
      ],

      // Version Control & Tools (15+)
      versionControl: [
        'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
        'git flow', 'gitflow', 'git rebase', 'pull request', 'code review'
      ],

      // AI/ML & Data Science (30+)
      aiml: [
        // ML frameworks
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
        'xgboost', 'lightgbm', 'catboost',
        // Deep learning
        'deep learning', 'neural network', 'cnn', 'rnn', 'lstm', 'transformer',
        'bert', 'gpt', 'llama', 'stable diffusion',
        // NLP
        'nlp', 'natural language processing', 'spacy', 'nltk', 'huggingface',
        'transformers', 'phobert', 'word2vec', 'fasttext',
        // Data science
        'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly', 'jupyter',
        'data science', 'machine learning', 'computer vision'
      ],

      // Mobile Development (15+)
      mobile: [
        'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic',
        'cordova', 'capacitor', 'swift', 'swiftui', 'kotlin', 'jetpack compose'
      ],

      // Other Technical Skills (20+)
      otherTech: [
        'html', 'html5', 'css', 'css3', 'xml', 'json', 'yaml', 'graphql',
        'rest api', 'restful', 'soap', 'grpc', 'websocket', 'microservices',
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'slack', 'notion'
      ],

      // Soft Skills (Vietnamese + English)
      soft: [
        // Vietnamese
        'giao tiếp', 'làm việc nhóm', 'quản lý thời gian', 'lãnh đạo',
        'giải quyết vấn đề', 'sáng tạo', 'thuyết trình', 'đàm phán',
        'phân tích', 'tư duy logic', 'làm việc độc lập', 'chịu áp lực',
        // English
        'communication', 'teamwork', 'leadership', 'problem solving',
        'time management', 'critical thinking', 'presentation', 'negotiation'
      ],

      // Languages (Vietnamese + English)
      language: [
        'tiếng anh', 'tiếng việt', 'english', 'vietnamese',
        'toeic', 'ielts', 'toefl', 'toefl ibt', 'cambridge',
        'tiếng nhật', 'japanese', 'tiếng hàn', 'korean',
        'tiếng trung', 'chinese', 'mandarin', 'tiếng pháp', 'french'
      ],

      // Vietnamese-specific terms
      vietnameseTerms: [
        'backend', 'frontend', 'full stack', 'fullstack', 'lập trình viên',
        'developer', 'kỹ sư', 'engineer', 'thực tập', 'internship',
        'kinh nghiệm', 'experience', 'dự án', 'project', 'công ty', 'company'
      ],

      // Vietnamese company names (tech companies)
      vietnameseCompanies: [
        'fpt', 'fpt software', 'vng', 'tiki', 'shopee', 'grab', 'momo',
        'zalo', 'vnpay', 'viettel', 'vnpt', 'cmg asia', 'nashtech'
      ]
    };

    // Skill normalization map (typo → correct form)
    this.skillNormalization = {
      // JavaScript variations
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'ts': 'TypeScript',

      // React variations
      'reactjs': 'React',
      'react.js': 'React',
      'react': 'React',
      'nextjs': 'Next.js',
      'next.js': 'Next.js',

      // Node.js variations
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'node': 'Node.js',
      'expressjs': 'Express',
      'express.js': 'Express',

      // Vue variations
      'vuejs': 'Vue',
      'vue.js': 'Vue',
      'vue': 'Vue',
      'nuxtjs': 'Nuxt.js',
      'nuxt.js': 'Nuxt.js',

      // Database variations
      'mongo': 'MongoDB',
      'mongodb': 'MongoDB',
      'postgres': 'PostgreSQL',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'redis': 'Redis',

      // Python
      'python': 'Python',
      'python3': 'Python',
      'py': 'Python',

      // Java
      'java': 'Java',
      'kotlin': 'Kotlin',

      // DevOps
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'k8s': 'Kubernetes',
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'Google Cloud',
      'google cloud': 'Google Cloud',

      // AI/ML
      'nlp': 'NLP',
      'phobert': 'PhoBERT',
      'bert': 'BERT',
      'machine learning': 'Machine Learning',
      'deep learning': 'Deep Learning',

      // Other
      'html': 'HTML',
      'html5': 'HTML5',
      'css': 'CSS',
      'css3': 'CSS3',
      'git': 'Git',
      'github': 'GitHub',
      'gitlab': 'GitLab'
    };
  }

  /**
   * Extract text from CV file (PDF, DOCX, TXT)
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else if (mimeType.includes('text')) {
        text = fileBuffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type: ' + mimeType);
      }

      // Clean text (async - spell checker runs here)
      text = await this.cleanText(text);
      return text;
    } catch (error) {
      logger.error('Error extracting text from CV:', error);
      throw error;
    }
  }

  /**
   * Clean extracted text and fix spacing issues from PDF
   */
  async cleanText(text) {
    // Fix Vietnamese encoding issues
    text = text.replace(/\s+/g, ' '); // Multiple spaces to single
    text = text.replace(/\n\s*\n/g, '\n'); // Multiple newlines to single
    
    // ⚠️ CRITICAL FIX: Remove corrupted PDF encoding artifacts
    // Some PDFs (especially from TopCV templates) have font encoding issues
    // that insert random surnames like "Đỗ", "Ngô", "Đặng" between words
    
    // Pattern 1: Remove "Đỗ" when it appears incorrectly between lowercase and uppercase
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đỗ(?=[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1');
    text = text.replace(/(?<=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đỗ(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/g, '');
    
    // Pattern 2: Remove "Ngô" when incorrectly inserted
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Ngô(?=[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1');
    text = text.replace(/(?<=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Ngô(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/g, '');
    
    // Pattern 3: Remove "Đặng" when incorrectly inserted
    text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đặng(?=[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1');
    text = text.replace(/(?<=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])Đặng(?=[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/g, '');
    
    // Pattern 4: Fix space issues with surnames
    text = text.replace(/\s+Đỗ\s+/g, ' ');
    text = text.replace(/\s+Ngô\s+/g, ' ');
    text = text.replace(/\s+Đặng\s+/g, ' ');
    
    // Fix text dính liền (add space before uppercase)
    const stuckWords = text.match(/[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ][A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/g);
    if (stuckWords && stuckWords.length > 5) {
      text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g, '$1 $2');
    }
    
    // Clean up spaces
    text = text.replace(/\s+/g, ' ').trim();
    
    // 🤖 AI-POWERED CORRECTION: Use Vietnamese spell checker
    try {
      text = await vietnameseSpellChecker.correct(text);
    } catch (error) {
      logger.warn('⚠️  Spell checker failed, using original text:', { error: error.message });
    }
    
    logger.debug(`🧹 Text cleaned (length: ${text.length})`);
    return text;
  }

  /**
   * Parse CV using rule-based extraction
   */
  async parseCV(fileBuffer, mimeType) {
    try {
      logger.debug('📝 Starting rule-based CV parsing (no AI required)');
      
      // Step 1: Extract text from file
      const text = await this.extractTextFromCV(fileBuffer, mimeType);
      
      if (!text || text.length < 50) {
        logger.error('❌ Insufficient text extracted from CV', { textLength: text?.length || 0 });
        throw new Error('Insufficient text extracted from CV');
      }

      logger.debug(`✅ Text extracted: ${text.length} characters`);
      logger.debug(`📄 Text preview (first 500 chars): ${text.substring(0, 500)}`);

      // Step 2: Extract information using rules
      const personalInfo = this.extractPersonalInfo(text);
      const education = this.extractEducationInfo(text);
      const experience = this.extractExperienceInfo(text);
      const skills = this.extractSkills(text);
      const certificates = this.extractCertificates(text);
      const awards = this.extractAwards(text);
      
      // Log extracted info for debugging
      logger.debug('📊 Extracted information:', {
        name: personalInfo.fullName || 'Not found',
        email: personalInfo.email || 'Not found',
        phone: personalInfo.phone || 'Not found',
        education: education.institution || 'Not found',
        experienceCount: experience.length,
        skillsCount: skills.length,
      });
      
      const result = {
        extractedData: {
          personalInfo,
          education,
          experience,
          skills,
          certificates,
          awards,
          activities: []
        },
        skills: [],
        suggestions: [
          'Để có kết quả chính xác hơn, hãy sử dụng AI parsing (Gemini hoặc Ollama)',
          'Đảm bảo CV có format rõ ràng và đầy đủ thông tin',
          'Kiểm tra lại thông tin đã được trích xuất'
        ]
      };

      // Flatten skills for compatibility
      result.skills = result.extractedData.skills.map(s => s.name || s);

      logger.info('✅ Rule-based parsing complete');
      return result;
    } catch (error) {
      logger.error('Rule-based CV parsing error:', error);
      throw error;
    }
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const info = {};

    // Name - Multiple patterns to try
    // Pattern 1: Vietnamese name with spaces
    let namePattern = new RegExp(
      `(?:^|\\n)\\s*((${this.vietnameseSurnames.join('|')})\\s+(?:Thị|Văn|Minh|Anh|Hoàng)?\\s*[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)*)`,
      'm'
    );
    let nameMatch = text.match(namePattern);
    
    // Pattern 2: Name without surname (first line of CV)
    if (!nameMatch) {
      const firstLine = text.split('\n')[0].trim();
      if (firstLine.length > 5 && firstLine.length < 50 && !firstLine.includes('@')) {
        nameMatch = [null, firstLine];
      }
    }
    
    // Pattern 3: Any capitalized Vietnamese name pattern
    if (!nameMatch) {
      namePattern = /(?:^|\n)\s*([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+(?:\s+[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+){1,4})/m;
      nameMatch = text.match(namePattern);
    }
    
    if (nameMatch && nameMatch[1]) {
      info.fullName = nameMatch[1].trim();
    }

    // Email - Multiple patterns
    let emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (!emailMatch) {
      // Try with case insensitive
      emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    }
    if (emailMatch) info.email = emailMatch[1];

    // Phone - Multiple formats
    let phoneMatch = text.match(/((?:\+84|84|0)(?:3|5|7|8|9)\d{8})/);
    if (!phoneMatch) {
      // Try without country code
      phoneMatch = text.match(/(0(?:3|5|7|8|9)\d{8})/);
    }
    if (!phoneMatch) {
      // Try with spaces/dashes
      phoneMatch = text.match(/(0(?:3|5|7|8|9)[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/);
    }
    if (phoneMatch) info.phone = phoneMatch[1].replace(/[\s\-]/g, '');

    // Date of birth - Multiple formats
    let dobMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (!dobMatch) {
      dobMatch = text.match(/(\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})/i);
    }
    if (dobMatch) info.dateOfBirth = dobMatch[1];

    // Address - Expanded patterns
    let addressMatch = text.match(
      /([\w\s,]+(?:Hồ Chí Minh|HCM|TP\.HCM|HCMC|Hà Nội|Đà Nẵng|Cần Thơ|Biên Hòa|Nha Trang|Huế|Phường|Quận|District|Thành phố|TP)[\w\s,]*)/i
    );
    if (!addressMatch) {
      // Try simpler pattern
      addressMatch = text.match(/(?:Địa chỉ|Address|Địa điểm)[\s:]+([^\n]{10,100})/i);
    }
    if (addressMatch && addressMatch[1] && addressMatch[1].trim() !== '') {
      info.address = addressMatch[1].trim();
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
      gradeText: null
    };

    // University name - Multiple patterns
    let uniMatch = text.match(/(?:Đại học|University|College|Trường|Trường Đại học)\s+([^\n]{5,80})/i);
    if (!uniMatch) {
      // Try without "Đại học" prefix
      uniMatch = text.match(/(?:Đại học|University)\s+([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ][^\n]{5,80})/i);
    }
    if (uniMatch && uniMatch[1]) {
      education.institution = uniMatch[1].trim();
    }

    // Degree - Expanded patterns
    let degreeMatch = text.match(/(Cử nhân|Kỹ sư|Thạc sĩ|Tiến sĩ|Bachelor|Master|PhD|B\.S\.|M\.S\.)/i);
    if (!degreeMatch) {
      degreeMatch = text.match(/(?:Bằng|Degree)[\s:]+([^\n]{5,30})/i);
    }
    if (degreeMatch) education.degree = degreeMatch[1];

    // Field of study - Multiple patterns
    let fieldMatch = text.match(/(?:Ngành|Major|Field|Chuyên ngành)[\s:]+([^\n]{5,50})/i);
    if (!fieldMatch) {
      fieldMatch = text.match(/(?:Học|Theo học)[\s]+(?:ngành|chuyên ngành)[\s:]+([^\n]{5,50})/i);
    }
    if (fieldMatch && fieldMatch[1]) {
      education.field = fieldMatch[1].trim();
    }

    // Graduation year - Multiple patterns
    let yearMatch = text.match(/(?:tốt nghiệp|graduation|graduated|năm tốt nghiệp)[\s:]+(?:năm\s*)?(\d{4})/i);
    if (!yearMatch) {
      yearMatch = text.match(/(\d{4})\s*(?:tốt nghiệp|graduation)/i);
    }
    if (!yearMatch) {
      // Try to find year near education section
      const educationSection = text.match(/(?:Học vấn|Education|Học tập)[\s\S]{0,500}/i);
      if (educationSection) {
        yearMatch = educationSection[0].match(/(\d{4})/);
      }
    }
    if (yearMatch) education.graduationYear = parseInt(yearMatch[1]);

    // GPA - Multiple patterns
    let gpaMatch = text.match(/(?:GPA|Điểm|Điểm trung bình|Grade Point Average)[\s:]+(\d+\.?\d*)/i);
    if (!gpaMatch) {
      gpaMatch = text.match(/(?:GPA|Điểm)[\s:]+(\d+[,\.]\d+)/i);
    }
    if (gpaMatch) {
      education.gpa = parseFloat(gpaMatch[1].replace(',', '.'));
    }

    // Grade text - Expanded patterns
    let gradeMatch = text.match(
      /(?:loại|xếp loại|grade|classification)[\s:]+(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average|Fair)/i
    );
    if (!gradeMatch) {
      gradeMatch = text.match(/(Xuất sắc|Giỏi|Khá|Trung bình|Yếu|Excellent|Very Good|Good|Average)/i);
    }
    if (gradeMatch) education.gradeText = gradeMatch[1];

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

      // Detect experience header (position + company + dates)
      const datePattern = /(\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|Hiện tại|Present|Current)/i;
      const dateMatch = line.match(datePattern);

      if (dateMatch) {
        if (currentExp) experiences.push(currentExp);

        // Extract position and company
        const expMatch = line.match(/^(.*?)\s*(?:tại|at|@)\s*(.+?)\s*[-–]/i);
        currentExp = {
          type: 'internship',
          company: expMatch ? expMatch[2].trim() : null,
          position: expMatch ? expMatch[1].trim() : null,
          startDate: dateMatch[1],
          endDate: dateMatch[2],
          description: ''
        };
      } else if (currentExp && line.length > 10) {
        // Add description lines
        currentExp.description += (currentExp.description ? ' ' : '') + line;
      }
    }

    if (currentExp) experiences.push(currentExp);
    return experiences;
  }

  /**
   * Extract skills using comprehensive 300+ patterns
   */
  extractSkills(text) {
    const skills = [];
    const textLower = text.toLowerCase();
    const foundSkills = new Set(); // Avoid duplicates (normalized form)

    // Helper function to normalize and add skill
    const addSkill = (rawSkill, type, confidence = 0.6) => {
      const skillLower = rawSkill.toLowerCase();
      const normalized = this.skillNormalization[skillLower] ||
                         rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1);

      // Check if already added (use normalized form as key)
      const normalizedLower = normalized.toLowerCase();
      if (foundSkills.has(normalizedLower)) {
        return;
      }

      skills.push({
        name: normalized,
        type: type,
        level: 'intermediate',
        confidence: confidence
      });
      foundSkills.add(normalizedLower);
    };

    // Search all skill categories
    const categories = [
      { name: 'programmingLanguages', type: 'programming_language' },
      { name: 'frontend', type: 'frontend' },
      { name: 'backend', type: 'backend' },
      { name: 'databases', type: 'database' },
      { name: 'devops', type: 'devops' },
      { name: 'testing', type: 'testing' },
      { name: 'versionControl', type: 'tool' },
      { name: 'aiml', type: 'ai_ml' },
      { name: 'mobile', type: 'mobile' },
      { name: 'otherTech', type: 'technical' },
      { name: 'vietnameseTerms', type: 'technical' }
    ];

    // Search with priority: Skills section first, then full text
    const skillsSection = text.match(/(?:Kỹ năng|Skills|Kỹ năng chuyên môn|Technical Skills|Công nghệ)[\s\S]{0,1500}/i);
    const primaryText = skillsSection ? skillsSection[0] : '';
    const primaryTextLower = primaryText.toLowerCase();

    // Search in skills section first (higher confidence)
    categories.forEach(({ name, type }) => {
      const skillList = this.skillKeywords[name] || [];
      skillList.forEach(skill => {
        const skillLower = skill.toLowerCase();

        // Skip single-character skills unless they have clear context
        // Single chars like "c" and "r" are too ambiguous and often false positives
        if (skillLower.length === 1) {
          // Only match single chars if they appear with programming context
          const contextPatterns = [
            new RegExp(`\\b${skillLower}\\s+(?:programming|language|lang|code|development|dev)`, 'i'),
            new RegExp(`(?:programming|language|lang|code|development|dev)\\s+${skillLower}\\b`, 'i'),
            new RegExp(`\\b${skillLower}\\s*[+#]`, 'i'), // C++, C#
            new RegExp(`\\b${skillLower}\\s*/\s*[a-z]`, 'i'), // C/O (but this is usually Certificate of Origin, not C language)
          ];
          
          // Check if any context pattern matches
          const hasContext = contextPatterns.some(pattern => pattern.test(textLower));
          if (!hasContext) {
            return; // Skip single-char skills without clear programming context
          }
        }

        // Create regex pattern for word boundary matching
        // Handle special chars in skill name (e.g., "node.js", "c++")
        const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escapedSkill}\\b`, 'i');

        // Check in skills section first (confidence: 0.9)
        if (primaryText && pattern.test(primaryTextLower)) {
          addSkill(skill, type, 0.9);
        }
        // Then check in full text (confidence: 0.6)
        else if (pattern.test(textLower)) {
          addSkill(skill, type, 0.6);
        }
      });
    });

    // Soft skills
    this.skillKeywords.soft.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const pattern = new RegExp(`\\b${skillLower}\\b`, 'i');
      if (pattern.test(textLower)) {
        addSkill(skill, 'soft', 0.7);
      }
    });

    // Languages
    this.skillKeywords.language.forEach(lang => {
      const langLower = lang.toLowerCase();
      const pattern = new RegExp(`\\b${langLower}\\b`, 'i');
      if (pattern.test(textLower)) {
        addSkill(lang, 'language', 0.8);
      }
    });

    // Vietnamese companies (as experience context, not skills)
    // We still detect them but mark as 'company' type for context
    this.skillKeywords.vietnameseCompanies.forEach(company => {
      const companyLower = company.toLowerCase();
      const pattern = new RegExp(`\\b${companyLower}\\b`, 'i');
      if (pattern.test(textLower)) {
        addSkill(company, 'company', 0.5);
      }
    });

    // Extract from bullet points and lists (bonus detection)
    const bulletPoints = text.match(/(?:[-•*○●]|\d+[\.):])\s*([^\n]{5,100})/g);
    if (bulletPoints) {
      bulletPoints.forEach(point => {
        const pointLower = point.toLowerCase();

        // Check all categories in bullet points
        categories.forEach(({ name, type }) => {
          const skillList = this.skillKeywords[name] || [];
          skillList.forEach(skill => {
            const skillLower = skill.toLowerCase();

            // Skip single-character skills unless they have clear context
            if (skillLower.length === 1) {
              const contextPatterns = [
                new RegExp(`\\b${skillLower}\\s+(?:programming|language|lang|code|development|dev)`, 'i'),
                new RegExp(`(?:programming|language|lang|code|development|dev)\\s+${skillLower}\\b`, 'i'),
                new RegExp(`\\b${skillLower}\\s*[+#]`, 'i'), // C++, C#
                new RegExp(`\\b${skillLower}\\s*/\s*[a-z]`, 'i'), // C/O (but this is usually Certificate of Origin, not C language)
              ];
              
              const hasContext = contextPatterns.some(pattern => pattern.test(pointLower));
              if (!hasContext) {
                return; // Skip single-char skills without clear programming context
              }
            }

            const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`\\b${escapedSkill}\\b`, 'i');

            if (pattern.test(pointLower)) {
              addSkill(skill, type, 0.8);
            }
          });
        });
      });
    }

    // Sort by confidence (highest first)
    skills.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    return skills;
  }

  /**
   * Extract certificates
   */
  extractCertificates(text) {
    const certificates = [];
    const certPattern = /(?:Chứng chỉ|Certificate|Certification)\s*:?\s*([^\n]{5,100})/gi;
    let match;

    while ((match = certPattern.exec(text)) !== null) {
      certificates.push({
        name: match[1].trim(),
        issuer: null,
        year: null
      });
    }

    return certificates;
  }

  /**
   * Extract awards
   */
  extractAwards(text) {
    const awards = [];
    const awardPattern = /(?:Giải thưởng|Award|Danh hiệu)\s*:?\s*([^\n]{5,100})/gi;
    let match;

    while ((match = awardPattern.exec(text)) !== null) {
      awards.push({
        name: match[1].trim(),
        year: null,
        description: null
      });
    }

    return awards;
  }
}

module.exports = new RuleBasedCVParser();

