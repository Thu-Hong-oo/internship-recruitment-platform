const pdfGenerationService = require('./pdfGenerationService');
const templateRenderer = require('./templateRenderer');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../utils/logger');

/**
 * CV Export Service
 * Handles exporting CVs to different formats (PDF, DOCX, HTML, JSON)
 */
class ExportService {
  constructor() {
    this.exportsDir = path.join(__dirname, '../../public/exports');
    this.isInitialized = false;
  }

  /**
   * Initialize export directory
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
      this.isInitialized = true;
      logger.info('Export service initialized');
    } catch (error) {
      logger.error('Failed to initialize export service:', error);
    }
  }

  /**
   * Export CV to specified format
   * @param {object} cv - CV data
   * @param {object} options - Export options
   * @returns {object} Export result
   */
  async export(cv, options = {}) {
    await this.initialize();

    const format = options.format || 'pdf';
    const fileName = `cv_${cv._id}_${Date.now()}`;

    try {
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.exportToPDF(cv, options, fileName);
        case 'html':
          return await this.exportToHTML(cv, options, fileName);
        case 'json':
          return await this.exportToJSON(cv, options, fileName);
        case 'docx':
          return await this.exportToDOCX(cv, options, fileName);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Export failed:', error);
      throw new Error(`Failed to export CV: ${error.message}`);
    }
  }

  /**
   * Export CV to PDF
   * @param {object} cv - CV data
   * @param {object} options - Export options
   * @param {string} fileName - File name
   * @returns {object} Export result
   */
  async exportToPDF(cv, options, fileName) {
    try {
      // Render CV to HTML
      const renderResult = await templateRenderer.render(cv, options);

      // Generate PDF
      const pdfBuffer = await pdfGenerationService.generatePDFFromHTML(
        renderResult.html,
        {
          format: options.paperSize || 'A4',
          margin: options.margin || '0.5in',
          printBackground: true,
          ...options.pdfOptions
        }
      );

      // Save to file
      const filePath = path.join(this.exportsDir, `${fileName}.pdf`);
      await fs.writeFile(filePath, pdfBuffer);

      // Upload to cloud storage (optional)
      let cloudUrl = null;
      try {
        // You can implement cloud upload here
        // cloudUrl = await this.uploadToCloud(filePath, `${fileName}.pdf`);
      } catch (uploadError) {
        logger.warn('Cloud upload failed, using local file:', uploadError);
      }

      return {
        success: true,
        format: 'pdf',
        fileName: `${fileName}.pdf`,
        localPath: filePath,
        cloudUrl,
        size: pdfBuffer.length,
        generatedAt: new Date().toISOString(),
        metadata: renderResult.stats
      };
    } catch (error) {
      logger.error('PDF export failed:', error);
      throw error;
    }
  }

  /**
   * Export CV to HTML
   * @param {object} cv - CV data
   * @param {object} options - Export options
   * @param {string} fileName - File name
   * @returns {object} Export result
   */
  async exportToHTML(cv, options, fileName) {
    try {
      // Render CV to HTML
      const renderResult = await templateRenderer.render(cv, options);

      // Add download meta tags
      const htmlWithMeta = renderResult.html.replace(
        '<head>',
        `<head>
        <meta name="generator" content="CV Builder API">
        <meta name="created" content="${new Date().toISOString()}">
        <title>${cv.title || 'CV'} - Exported</title>`
      );

      // Save to file
      const filePath = path.join(this.exportsDir, `${fileName}.html`);
      await fs.writeFile(filePath, htmlWithMeta, 'utf8');

      return {
        success: true,
        format: 'html',
        fileName: `${fileName}.html`,
        localPath: filePath,
        url: `/exports/${fileName}.html`,
        size: Buffer.byteLength(htmlWithMeta, 'utf8'),
        generatedAt: new Date().toISOString(),
        metadata: renderResult.stats
      };
    } catch (error) {
      logger.error('HTML export failed:', error);
      throw error;
    }
  }

  /**
   * Export CV to JSON
   * @param {object} cv - CV data
   * @param {object} options - Export options
   * @param {string} fileName - File name
   * @returns {object} Export result
   */
  async exportToJSON(cv, options, fileName) {
    try {
      // Prepare JSON data
      const jsonData = {
        cv: {
          id: cv._id,
          title: cv.title,
          templateId: cv.templateId,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
          customization: cv.customization,
          content: cv.content
        },
        exportedAt: new Date().toISOString(),
        version: '1.0',
        generator: 'CV Builder API'
      };

      const jsonString = JSON.stringify(jsonData, null, 2);

      // Save to file
      const filePath = path.join(this.exportsDir, `${fileName}.json`);
      await fs.writeFile(filePath, jsonString, 'utf8');

      return {
        success: true,
        format: 'json',
        fileName: `${fileName}.json`,
        localPath: filePath,
        url: `/exports/${fileName}.json`,
        size: Buffer.byteLength(jsonString, 'utf8'),
        generatedAt: new Date().toISOString(),
        metadata: {
          sectionsCount: cv.content?.sections?.length || 0,
          hasPersonalInfo: !!cv.content?.personalInfo,
          templateUsed: cv.templateId
        }
      };
    } catch (error) {
      logger.error('JSON export failed:', error);
      throw error;
    }
  }

  /**
   * Export CV to DOCX (simplified - returns HTML that can be converted)
   * @param {object} cv - CV data
   * @param {object} options - Export options
   * @param {string} fileName - File name
   * @returns {object} Export result
   */
  async exportToDOCX(cv, options, fileName) {
    try {
      // For now, export as HTML that can be opened in Word
      // In production, you might want to use a library like docx or mammoth

      const renderResult = await templateRenderer.render(cv, options);

      // Add Word-compatible styling
      const wordCompatibleHTML = `
        <!DOCTYPE html>
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${cv.title || 'CV'}</title>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
          <style>
            body { font-family: Arial, sans-serif; }
            .cv-container { max-width: none; margin: 0; padding: 20px; }
            .personal-info { text-align: center; margin-bottom: 30px; }
            .name { font-size: 24pt; font-weight: bold; margin-bottom: 10pt; }
            .section-title { font-size: 16pt; font-weight: bold; margin: 20pt 0 10pt 0; }
            .job-title, .degree, .project-name { font-size: 14pt; font-weight: bold; }
            .company, .school { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="cv-container">
            ${renderResult.html.replace(/<style>[\s\S]*?<\/style>/g, '')}
          </div>
        </body>
        </html>
      `;

      // Save as .doc file (HTML that Word can open)
      const filePath = path.join(this.exportsDir, `${fileName}.doc`);
      await fs.writeFile(filePath, wordCompatibleHTML, 'utf8');

      return {
        success: true,
        format: 'docx',
        fileName: `${fileName}.doc`,
        localPath: filePath,
        url: `/exports/${fileName}.doc`,
        size: Buffer.byteLength(wordCompatibleHTML, 'utf8'),
        generatedAt: new Date().toISOString(),
        metadata: {
          ...renderResult.stats,
          note: 'Open this file with Microsoft Word'
        }
      };
    } catch (error) {
      logger.error('DOCX export failed:', error);
      throw error;
    }
  }

  /**
   * Get export history for a CV
   * @param {string} cvId - CV ID
   * @returns {Array} Export history
   */
  async getExportHistory(cvId) {
    try {
      // In a real implementation, you might store export history in database
      // For now, return mock data
      return [
        {
          id: 'export_1',
          format: 'pdf',
          createdAt: new Date().toISOString(),
          size: 245000,
          downloads: 5
        }
      ];
    } catch (error) {
      logger.error('Failed to get export history:', error);
      return [];
    }
  }

  /**
   * Clean up old export files
   * @param {number} maxAge - Maximum age in days
   */
  async cleanupOldExports(maxAge = 7) {
    try {
      const files = await fs.readdir(this.exportsDir);
      const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAgeMs) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old export file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old exports:', error);
    }
  }

  /**
   * Upload file to cloud storage
   * @param {string} filePath - Local file path
   * @param {string} fileName - File name
   * @returns {string} Cloud URL
   */
  async uploadToCloud(filePath, fileName) {
    // Implement cloud upload logic here
    // For example, using AWS S3, Cloudinary, etc.
    // Return the cloud URL

    // Placeholder implementation
    return `https://cdn.cvbuilder.com/exports/${fileName}`;
  }
}

module.exports = new ExportService();