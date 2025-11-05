const puppeteer = require('puppeteer');
const { logger } = require('../../../shared/utils/logger');
const cloudinary = require('cloudinary').v2;

class PDFGenerationService {
  constructor() {
    this.defaultOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    };
  }

  /**
   * Generate PDF from HTML content
   * @param {string} htmlContent - HTML content to convert
   * @param {Object} options - PDF generation options
   * @returns {Buffer} PDF buffer
   */
  async generatePDFFromHTML(htmlContent, options = {}) {
    let browser;
    try {
      logger.info('Starting PDF generation from HTML');

      // Merge options with defaults
      const pdfOptions = { ...this.defaultOptions, ...options };

      // Launch browser
      browser = await puppeteer.launch({
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

      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info(
        `PDF generated successfully, size: ${pdfBuffer.length} bytes`
      );
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF from URL
   * @param {string} url - URL to convert to PDF
   * @param {Object} options - PDF generation options
   * @returns {Buffer} PDF buffer
   */
  async generatePDFFromURL(url, options = {}) {
    let browser;
    try {
      logger.info(`Starting PDF generation from URL: ${url}`);

      const pdfOptions = { ...this.defaultOptions, ...options };

      browser = await puppeteer.launch({
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

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info(
        `PDF generated successfully from URL, size: ${pdfBuffer.length} bytes`
      );
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation from URL failed:', error);
      throw new Error(`PDF generation from URL failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Upload PDF to Cloudinary
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} filename - Filename for the PDF
   * @param {Object} options - Upload options
   * @returns {Object} Cloudinary upload result
   */
  async uploadPDFToCloudinary(pdfBuffer, filename, options = {}) {
    try {
      logger.info(`Uploading PDF to Cloudinary: ${filename}`);

      const uploadOptions = {
        resource_type: 'raw',
        folder: 'internbridge/documents',
        public_id: filename.replace('.pdf', ''),
        format: 'pdf',
        ...options,
      };

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          })
          .end(pdfBuffer);
      });

      logger.info(`PDF uploaded successfully: ${result.secure_url}`);
      return result;
    } catch (error) {
      logger.error('PDF upload to Cloudinary failed:', error);
      throw new Error(`PDF upload failed: ${error.message}`);
    }
  }

  /**
   * Generate and upload PDF to Cloudinary
   * @param {string} htmlContent - HTML content
   * @param {string} filename - Filename for the PDF
   * @param {Object} pdfOptions - PDF generation options
   * @param {Object} uploadOptions - Upload options
   * @returns {Object} Upload result with PDF info
   */
  async generateAndUploadPDF(
    htmlContent,
    filename,
    pdfOptions = {},
    uploadOptions = {}
  ) {
    try {
      // Generate PDF
      const pdfBuffer = await this.generatePDFFromHTML(htmlContent, pdfOptions);

      // Upload to Cloudinary
      const uploadResult = await this.uploadPDFToCloudinary(
        pdfBuffer,
        filename,
        uploadOptions
      );

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: 'pdf',
        size: pdfBuffer.length,
        filename: filename,
        uploadedAt: new Date(),
      };
    } catch (error) {
      logger.error('Generate and upload PDF failed:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from CV URL and upload
   * @param {string} cvUrl - CV HTML URL
   * @param {string} filename - Filename for the PDF
   * @param {Object} pdfOptions - PDF generation options
   * @param {Object} uploadOptions - Upload options
   * @returns {Object} Upload result with PDF info
   */
  async generatePDFFromCVURL(
    cvUrl,
    filename,
    pdfOptions = {},
    uploadOptions = {}
  ) {
    try {
      // Generate PDF from URL
      const pdfBuffer = await this.generatePDFFromURL(cvUrl, pdfOptions);

      // Upload to Cloudinary
      const uploadResult = await this.uploadPDFToCloudinary(
        pdfBuffer,
        filename,
        uploadOptions
      );

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: 'pdf',
        size: pdfBuffer.length,
        filename: filename,
        uploadedAt: new Date(),
      };
    } catch (error) {
      logger.error('Generate PDF from CV URL failed:', error);
      throw error;
    }
  }

  /**
   * Get PDF generation options for different CV templates
   * @param {string} template - Template name
   * @returns {Object} PDF options
   */
  getPDFOptionsForTemplate(template) {
    const templateOptions = {
      modern: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      },
      classic: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      },
      minimal: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      },
      executive: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '25mm',
          right: '25mm',
          bottom: '25mm',
          left: '25mm',
        },
      },
    };

    return templateOptions[template] || templateOptions['modern'];
  }

  /**
   * Generate filename for PDF
   * @param {string} candidateName - Candidate name
   * @param {string} targetJob - Target job
   * @param {string} template - Template name
   * @returns {string} Generated filename
   */
  generatePDFFilename(candidateName, targetJob, template) {
    const timestamp = Date.now();
    const cleanName = candidateName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
    const cleanJob = targetJob
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 15);

    return `CV_${cleanName}_${cleanJob}_${template}_${timestamp}.pdf`;
  }
}

module.exports = new PDFGenerationService();
