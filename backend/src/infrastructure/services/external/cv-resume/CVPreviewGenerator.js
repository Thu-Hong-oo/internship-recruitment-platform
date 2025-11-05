const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../../../../shared/utils/logger');

/**
 * CV Preview Generator Service
 * Generates preview images for CV templates using Puppeteer
 */
class CVPreviewGenerator {
  constructor() {
    this.browser = null;
    this.previewDir = path.join(__dirname, '../../public/templates/previews');
    this.isInitialized = false;
  }

  /**
   * Initialize browser and create preview directory
   */
  async initialize() {
    try {
      // Create preview directory if it doesn't exist
      await fs.mkdir(this.previewDir, { recursive: true });

      // Initialize browser with optimized settings
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.isInitialized = true;
      logger.info('CV Preview Generator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CV Preview Generator:', error);
      throw error;
    }
  }

  /**
   * Generate preview image for a specific template
   * @param {string} templateId - Template identifier
   * @param {object} cvData - Sample CV data
   * @returns {object} Preview and thumbnail URLs
   */
  async generatePreview(templateId, cvData = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const page = await this.browser.newPage();

      // Set A4 viewport for preview
      await page.setViewport({
        width: 794, // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
        deviceScaleFactor: 2, // High quality
      });

      // Generate and load CV HTML
      const cvHTML = this.generateCVHTML(templateId, cvData);
      await page.setContent(cvHTML, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate full preview (A4 size)
      const previewPath = path.join(
        this.previewDir,
        `${templateId}-preview.jpg`
      );
      await page.screenshot({
        path: previewPath,
        type: 'jpeg',
        quality: 85,
        fullPage: false,
      });

      // Generate thumbnail (smaller version for UI)
      await page.setViewport({
        width: 300,
        height: 425,
        deviceScaleFactor: 1,
      });

      const thumbnailPath = path.join(
        this.previewDir,
        `${templateId}-thumb.jpg`
      );
      await page.screenshot({
        path: thumbnailPath,
        type: 'jpeg',
        quality: 80,
        fullPage: false,
      });

      await page.close();

      const result = {
        preview: `/templates/previews/${templateId}-preview.jpg`,
        thumbnail: `/templates/previews/${templateId}-thumb.jpg`,
        templateId,
        generatedAt: new Date().toISOString(),
      };

      logger.info(`Generated preview for template: ${templateId}`);
      return result;
    } catch (error) {
      logger.error(`Error generating preview for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML content for CV templates
   * @param {string} templateId - Template identifier
   * @param {object} cvData - CV data to populate
   * @returns {string} Complete HTML document
   */
  generateCVHTML(templateId, cvData) {
    const baseHTML = `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CV Preview - ${templateId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0;
              padding: 0;
              background: white;
            }
            .cv-container {
              width: 794px;
              min-height: 1123px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .progress-bar {
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            }
            .progress-fill {
              height: 8px;
              border-radius: 4px;
              transition: width 0.3s ease;
            }
          </style>
        </head>
        <body>
          <div class="cv-container">
            ${this.getTemplateHTML(templateId, cvData)}
          </div>
        </body>
      </html>
    `;
    return baseHTML;
  }

  /**
   * Get template-specific HTML content
   * @param {string} templateId - Template identifier
   * @param {object} data - CV data
   * @returns {string} Template HTML
   */
  getTemplateHTML(templateId, data) {
    // Default sample data for Vietnamese context
    const sampleData = {
      name: data.name || 'Nguyễn Văn An',
      title: data.title || 'Thực tập sinh Phát triển Phần mềm',
      email: data.email || 'nguyenvanan@email.com',
      phone: data.phone || '0123 456 789',
      address: data.address || 'TP. Hồ Chí Minh',
      objective:
        data.objective ||
        'Sinh viên năm cuối ngành Công nghệ Thông tin mong muốn tìm kiếm cơ hội thực tập để áp dụng kiến thức đã học và phát triển kỹ năng lập trình trong môi trường thực tế.',
      ...data,
    };

    const templates = {
      modern: d => `
        <div class="w-full h-full p-8 bg-white">
          <!-- Header với accent border -->
          <div class="border-l-4 border-blue-600 pl-6 mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${d.name}</h1>
            <p class="text-xl text-blue-600 font-medium">${d.title}</p>
            <div class="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <span>📧 ${d.email}</span>
              <span>📱 ${d.phone}</span>
              <span>📍 ${d.address}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="col-span-2 space-y-6">
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-100 pb-1">MỤC TIÊU NGHỀ NGHIỆP</h2>
                <p class="text-sm text-gray-700 leading-relaxed">${d.objective}</p>
              </section>
              
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-100 pb-1">KINH NGHIỆM LÀM VIỆC</h2>
                <div class="space-y-4">
                  <div>
                    <h3 class="font-semibold text-gray-900">Thực tập sinh Phát triển Web</h3>
                    <p class="text-sm text-blue-600 font-medium">Công ty TNHH Công nghệ ABC</p>
                    <p class="text-xs text-gray-500 mb-2">06/2024 - 09/2024</p>
                    <ul class="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Phát triển tính năng frontend với React.js</li>
                      <li>Tham gia xây dựng API với Node.js và Express</li>
                      <li>Thực hiện testing và debug code</li>
                      <li>Làm việc nhóm với Git và Agile methodology</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-100 pb-1">DỰ ÁN CÁ NHÂN</h2>
                <div class="space-y-3">
                  <div>
                    <h3 class="font-semibold text-gray-900">Website Thương mại Điện tử</h3>
                    <p class="text-xs text-gray-500 mb-1">React.js, Node.js, MongoDB, Stripe API</p>
                    <p class="text-sm text-gray-700">Xây dựng website bán hàng trực tuyến với đầy đủ tính năng giỏ hàng, thanh toán, quản lý đơn hàng.</p>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Ứng dụng Quản lý Công việc</h3>
                    <p class="text-xs text-gray-500 mb-1">Vue.js, Firebase, PWA</p>
                    <p class="text-sm text-gray-700">Progressive Web App để quản lý task cá nhân với tính năng offline và push notifications.</p>
                  </div>
                </div>
              </section>
            </div>
            
            <!-- Sidebar -->
            <div class="col-span-1 space-y-6">
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3">KỸ NĂNG</h2>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm font-medium text-gray-900">JavaScript</span>
                      <span class="text-xs text-gray-500">85%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill bg-blue-600" style="width: 85%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm font-medium text-gray-900">React.js</span>
                      <span class="text-xs text-gray-500">80%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill bg-blue-600" style="width: 80%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm font-medium text-gray-900">Node.js</span>
                      <span class="text-xs text-gray-500">75%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill bg-blue-600" style="width: 75%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm font-medium text-gray-900">MySQL</span>
                      <span class="text-xs text-gray-500">70%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill bg-blue-600" style="width: 70%"></div>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3">HỌC VẤN</h2>
                <div>
                  <h3 class="font-semibold text-gray-900">Cử nhân Công nghệ Thông tin</h3>
                  <p class="text-sm text-blue-600 font-medium">Đại học Bách Khoa TP.HCM</p>
                  <p class="text-xs text-gray-500 mb-2">2021 - 2025</p>
                  <p class="text-sm text-gray-700">GPA: 3.5/4.0</p>
                  <p class="text-xs text-gray-600 mt-1">Chuyên ngành: Kỹ thuật Phần mềm</p>
                </div>
              </section>
              
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3">CHỨNG CHỈ</h2>
                <div class="space-y-2">
                  <div>
                    <p class="text-sm font-medium text-gray-900">TOEIC 750</p>
                    <p class="text-xs text-gray-500">ETS - 2024</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">AWS Cloud Practitioner</p>
                    <p class="text-xs text-gray-500">Amazon - 2024</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-3">NGÔN NGỮ</h2>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-900">Tiếng Việt</span>
                    <span class="text-xs text-gray-500">Bản ngữ</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-900">Tiếng Anh</span>
                    <span class="text-xs text-gray-500">TOEIC 750</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      `,

      'student-tech': d => `
        <div class="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50">
          <!-- Header với gradient -->
          <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-8">
            <h1 class="text-4xl font-bold mb-2">${d.name}</h1>
            <p class="text-xl mb-4">${d.title}</p>
            <div class="flex gap-6 text-sm">
              <span>📧 ${d.email}</span>
              <span>📱 ${d.phone}</span>
              <span>📍 ${d.address}</span>
            </div>
          </div>
          
          <div class="p-8 space-y-8">
            <section>
              <h2 class="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-4">🎯 MỤC TIÊU</h2>
              <p class="text-gray-700 leading-relaxed">${d.objective}</p>
            </section>
            
            <div class="grid grid-cols-2 gap-8">
              <section>
                <h2 class="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-4">💻 DỰ ÁN CÔNG NGHỆ</h2>
                <div class="space-y-4">
                  <div class="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
                    <h3 class="font-bold text-gray-900 mb-2">🛒 E-Commerce Platform</h3>
                    <p class="text-sm text-blue-600 mb-2">React, Node.js, MongoDB, Stripe</p>
                    <p class="text-sm text-gray-700">Website thương mại điện tử với quản lý sản phẩm, giỏ hàng, thanh toán trực tuyến và dashboard admin.</p>
                    <div class="mt-2 flex gap-2">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Frontend</span>
                      <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Backend</span>
                      <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Full-stack</span>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg p-4 shadow-md border-l-4 border-green-500">
                    <h3 class="font-bold text-gray-900 mb-2">📱 Task Manager Mobile App</h3>
                    <p class="text-sm text-green-600 mb-2">React Native, Firebase, Redux</p>
                    <p class="text-sm text-gray-700">Ứng dụng di động quản lý công việc với sync realtime, push notifications và offline mode.</p>
                    <div class="mt-2 flex gap-2">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Mobile</span>
                      <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Real-time</span>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-500">
                    <h3 class="font-bold text-gray-900 mb-2">🤖 AI Chatbot Support</h3>
                    <p class="text-sm text-purple-600 mb-2">Python, TensorFlow, FastAPI</p>
                    <p class="text-sm text-gray-700">Chatbot AI hỗ trợ khách hàng với NLP, tích hợp vào website và xử lý multi-language.</p>
                    <div class="mt-2 flex gap-2">
                      <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">AI/ML</span>
                      <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">NLP</span>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-4">🚀 KỸ NĂNG CÔNG NGHỆ</h2>
                
                <div class="space-y-4">
                  <div class="bg-white rounded-lg p-4 shadow-md">
                    <h3 class="font-bold text-gray-900 mb-3">Frontend Development</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">React.js</span>
                      <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Vue.js</span>
                      <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">JavaScript</span>
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">TypeScript</span>
                      <span class="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">Tailwind CSS</span>
                      <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Bootstrap</span>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg p-4 shadow-md">
                    <h3 class="font-bold text-gray-900 mb-3">Backend Development</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Node.js</span>
                      <span class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Express.js</span>
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Python</span>
                      <span class="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">Django</span>
                      <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">FastAPI</span>
                      <span class="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">REST API</span>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg p-4 shadow-md">
                    <h3 class="font-bold text-gray-900 mb-3">Database & Tools</h3>
                    <div class="grid grid-cols-2 gap-2">
                      <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">MongoDB</span>
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">MySQL</span>
                      <span class="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">Firebase</span>
                      <span class="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Git</span>
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Docker</span>
                      <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">AWS</span>
                    </div>
                  </div>
                </div>
                
                <div class="mt-6 bg-white rounded-lg p-4 shadow-md">
                  <h3 class="font-bold text-gray-900 mb-3">📚 HỌC VẤN</h3>
                  <div>
                    <h4 class="font-semibold text-blue-600">Cử nhân Công nghệ Thông tin</h4>
                    <p class="text-gray-700">Đại học Bách Khoa TP.HCM</p>
                    <p class="text-sm text-gray-500">2021 - 2025 • GPA: 3.5/4.0</p>
                    <p class="text-sm text-gray-600 mt-1">Chuyên ngành: Kỹ thuật Phần mềm</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      `,

      minimal: d => `
        <div class="w-full h-full p-12 bg-white">
          <!-- Header minimal -->
          <div class="text-center mb-8 border-b-2 border-black pb-6">
            <h1 class="text-4xl font-bold text-black mb-2 tracking-wide">${d.name.toUpperCase()}</h1>
            <p class="text-lg text-gray-700 mb-3">${d.title}</p>
            <p class="text-sm text-gray-600">${d.email} • ${d.phone} • ${
        d.address
      }</p>
          </div>
          
          <div class="space-y-8">
            <section>
              <h2 class="text-xl font-bold text-black mb-4 uppercase tracking-wider">Objective</h2>
              <p class="text-sm text-gray-800 leading-relaxed">${
                d.objective
              }</p>
            </section>
            
            <section>
              <h2 class="text-xl font-bold text-black mb-4 uppercase tracking-wider">Education</h2>
              <div>
                <h3 class="font-semibold text-black">Cử nhân Công nghệ Thông tin</h3>
                <p class="text-sm text-gray-700">Đại học Bách Khoa TP.HCM • 2021 - 2025</p>
                <p class="text-sm text-gray-600">GPA: 3.5/4.0 • Chuyên ngành: Kỹ thuật Phần mềm</p>
              </div>
            </section>
            
            <section>
              <h2 class="text-xl font-bold text-black mb-4 uppercase tracking-wider">Experience</h2>
              <div>
                <h3 class="font-semibold text-black">Thực tập sinh Phát triển Web</h3>
                <p class="text-sm text-gray-700">Công ty TNHH Công nghệ ABC • 06/2024 - 09/2024</p>
                <ul class="text-sm text-gray-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Phát triển frontend với React.js và backend với Node.js</li>
                  <li>Tham gia code review và testing</li>
                  <li>Làm việc với Git và methodology Agile</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 class="text-xl font-bold text-black mb-4 uppercase tracking-wider">Skills</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h4 class="font-semibold text-black mb-2">Programming Languages</h4>
                  <p class="text-sm text-gray-800">JavaScript, TypeScript, Python, Java</p>
                </div>
                <div>
                  <h4 class="font-semibold text-black mb-2">Frameworks & Tools</h4>
                  <p class="text-sm text-gray-800">React, Node.js, Express, MongoDB, Git</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 class="text-xl font-bold text-black mb-4 uppercase tracking-wider">Projects</h2>
              <div class="space-y-3">
                <div>
                  <h3 class="font-semibold text-black">E-commerce Website</h3>
                  <p class="text-sm text-gray-800">React.js, Node.js, MongoDB • Website bán hàng trực tuyến với đầy đủ tính năng</p>
                </div>
                <div>
                  <h3 class="font-semibold text-black">Task Management App</h3>
                  <p class="text-sm text-gray-800">Vue.js, Firebase • Ứng dụng quản lý công việc với real-time sync</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      `,

      'business-professional': d => `
        <div class="w-full h-full p-8 bg-white">
          <div class="border-b-2 border-gray-900 pb-6 mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${d.name}</h1>
            <p class="text-lg text-gray-600 mb-3">${d.title}</p>
            <div class="text-sm text-gray-600 space-y-1">
              <p>📧 ${d.email} | 📱 ${d.phone} | 📍 ${d.address}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-8">
            <div class="col-span-2 space-y-6">
              <section>
                <h2 class="text-lg font-bold text-gray-900 mb-3 uppercase">Professional Summary</h2>
                <p class="text-sm text-gray-700 leading-relaxed">${d.objective}</p>
              </section>
              
              <section>
                <h2 class="text-lg font-bold text-gray-900 mb-3 uppercase">Professional Experience</h2>
                <div>
                  <h3 class="font-semibold text-gray-900">Thực tập sinh Phát triển Phần mềm</h3>
                  <p class="text-sm text-gray-600">Công ty TNHH Công nghệ ABC | 06/2024 - 09/2024</p>
                  <ul class="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Developed web applications using modern JavaScript frameworks</li>
                    <li>Collaborated with cross-functional teams in Agile environment</li>
                    <li>Participated in code reviews and quality assurance processes</li>
                  </ul>
                </div>
              </section>
            </div>
            
            <div class="space-y-6">
              <section>
                <h2 class="text-lg font-bold text-gray-900 mb-3 uppercase">Core Skills</h2>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-900">JavaScript</span>
                    <span class="text-xs text-gray-500">Advanced</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-900">React.js</span>
                    <span class="text-xs text-gray-500">Intermediate</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-900">Node.js</span>
                    <span class="text-xs text-gray-500">Intermediate</span>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-lg font-bold text-gray-900 mb-3 uppercase">Education</h2>
                <div>
                  <h3 class="font-semibold text-gray-900">Bachelor of Information Technology</h3>
                  <p class="text-sm text-gray-600">HCMC University of Technology</p>
                  <p class="text-xs text-gray-500">2021 - 2025 | GPA: 3.5/4.0</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      `,

      creative: d => `
        <div class="w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          <div class="p-8">
            <div class="bg-white rounded-2xl shadow-xl p-8">
              <div class="text-center mb-8">
                <div class="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span class="text-2xl font-bold text-white">${d.name.charAt(
                    0
                  )}</span>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">${
                  d.name
                }</h1>
                <p class="text-lg text-gray-600">${d.title}</p>
              </div>
              
              <div class="grid grid-cols-2 gap-8">
                <div class="space-y-6">
                  <section>
                    <h2 class="text-xl font-bold text-purple-600 mb-4 flex items-center">
                      <span class="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      Creative Vision
                    </h2>
                    <p class="text-sm text-gray-700 leading-relaxed">${
                      d.objective
                    }</p>
                  </section>
                  
                  <section>
                    <h2 class="text-xl font-bold text-purple-600 mb-4 flex items-center">
                      <span class="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      Project Showcase
                    </h2>
                    <div class="space-y-3">
                      <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                        <h3 class="font-bold text-gray-900">🎨 Design Portfolio Website</h3>
                        <p class="text-sm text-gray-700">Interactive portfolio với animations và 3D effects</p>
                      </div>
                      <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                        <h3 class="font-bold text-gray-900">📱 Mobile App UI/UX</h3>
                        <p class="text-sm text-gray-700">Design system cho ứng dụng mobile banking</p>
                      </div>
                    </div>
                  </section>
                </div>
                
                <div class="space-y-6">
                  <section>
                    <h2 class="text-xl font-bold text-purple-600 mb-4 flex items-center">
                      <span class="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      Skills & Tools
                    </h2>
                    <div class="space-y-3">
                      <div>
                        <p class="font-semibold text-gray-900 mb-2">Design</p>
                        <div class="flex flex-wrap gap-2">
                          <span class="px-3 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Figma</span>
                          <span class="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Adobe XD</span>
                          <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Photoshop</span>
                        </div>
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 mb-2">Development</p>
                        <div class="flex flex-wrap gap-2">
                          <span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">HTML/CSS</span>
                          <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">JavaScript</span>
                          <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">React</span>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-xl font-bold text-purple-600 mb-4 flex items-center">
                      <span class="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      Contact
                    </h2>
                    <div class="space-y-2 text-sm text-gray-700">
                      <p>📧 ${d.email}</p>
                      <p>📱 ${d.phone}</p>
                      <p>📍 ${d.address}</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    };

    return templates[templateId]
      ? templates[templateId](sampleData)
      : templates.modern(sampleData);
  }

  /**
   * Generate previews for all available templates
   * @returns {object} Results for all templates
   */
  async generateAllPreviews() {
    const sampleData = {
      name: 'Nguyễn Văn An',
      title: 'Thực tập sinh Phát triển Phần mềm',
      email: 'nguyenvanan@email.com',
      phone: '0123 456 789',
      address: 'TP. Hồ Chí Minh',
      objective:
        'Sinh viên năm cuối ngành Công nghệ Thông tin mong muốn tìm kiếm cơ hội thực tập để áp dụng kiến thức đã học và phát triển kỹ năng lập trình trong môi trường thực tế.',
    };

    // All available templates
    const templates = [
      'modern',
      'student-tech',
      'business-professional',
      'minimal',
      'creative',
      'executive',
      'classic',
      'healthcare',
      'education',
      'marketing',
      'finance',
      'accounting',
      'logistics',
      'data-analyst',
      'hr',
      'hospitality',
      'legal',
      'minimal-clean',
    ];

    const results = {};
    let successCount = 0;
    let errorCount = 0;

    logger.info(
      `Starting preview generation for ${templates.length} templates`
    );

    for (const templateId of templates) {
      try {
        logger.info(`Generating preview for template: ${templateId}`);
        results[templateId] = await this.generatePreview(
          templateId,
          sampleData
        );
        successCount++;
      } catch (error) {
        logger.error(`Failed to generate preview for ${templateId}:`, error);
        results[templateId] = {
          error: error.message,
          templateId,
          generatedAt: new Date().toISOString(),
        };
        errorCount++;
      }
    }

    logger.info(
      `Preview generation completed. Success: ${successCount}, Errors: ${errorCount}`
    );

    return {
      summary: {
        total: templates.length,
        success: successCount,
        errors: errorCount,
        generatedAt: new Date().toISOString(),
      },
      results,
    };
  }

  /**
   * Check if preview files exist for a template
   * @param {string} templateId - Template identifier
   * @returns {object} File existence status
   */
  async checkPreviewExists(templateId) {
    try {
      const previewPath = path.join(
        this.previewDir,
        `${templateId}-preview.jpg`
      );
      const thumbnailPath = path.join(
        this.previewDir,
        `${templateId}-thumb.jpg`
      );

      const [previewExists, thumbnailExists] = await Promise.all([
        fs
          .access(previewPath)
          .then(() => true)
          .catch(() => false),
        fs
          .access(thumbnailPath)
          .then(() => true)
          .catch(() => false),
      ]);

      return {
        templateId,
        preview: {
          exists: previewExists,
          url: previewExists
            ? `/templates/previews/${templateId}-preview.jpg`
            : null,
        },
        thumbnail: {
          exists: thumbnailExists,
          url: thumbnailExists
            ? `/templates/previews/${templateId}-thumb.jpg`
            : null,
        },
      };
    } catch (error) {
      logger.error(
        `Error checking preview existence for ${templateId}:`,
        error
      );
      return {
        templateId,
        error: error.message,
      };
    }
  }

  /**
   * Clean up browser instance
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
        logger.info('CV Preview Generator closed successfully');
      }
    } catch (error) {
      logger.error('Error closing CV Preview Generator:', error);
    }
  }
}

module.exports = CVPreviewGenerator;
