const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../../../../config/logger');

/**
 * CVParserService - Handles CV file parsing and text extraction
 * Infrastructure Layer Service following Clean Architecture
 */
class CVParserService {
  constructor() {
    this.supportedFormats = ['.pdf', '.docx', '.txt'];
  }

  /**
   * Parse CV file and extract text content
   * @param {string} filePath - Path to the CV file
   * @returns {Promise<Object>} Parsed CV data
   */
  async parseCV(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();

      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(
          `Unsupported file format: ${fileExtension}. Supported formats: ${this.supportedFormats.join(
            ', '
          )}`
        );
      }

      let text = '';
      let metadata = {};

      switch (fileExtension) {
        case '.pdf':
          const pdfResult = await this._parsePDF(filePath);
          text = pdfResult.text;
          metadata = pdfResult.metadata;
          break;

        case '.docx':
          const docxResult = await this._parseDOCX(filePath);
          text = docxResult.text;
          metadata = docxResult.metadata;
          break;

        case '.txt':
          text = await this._parseTXT(filePath);
          metadata = { format: 'txt', size: text.length };
          break;
      }

      return {
        text: text.trim(),
        metadata: {
          ...metadata,
          filePath,
          fileExtension,
          parsedAt: new Date().toISOString(),
        },
        success: true,
      };
    } catch (error) {
      logger.error('CV parsing error:', error);
      return {
        text: '',
        metadata: { error: error.message },
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse PDF file
   * @private
   */
  async _parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        text: data.text,
        metadata: {
          format: 'pdf',
          pages: data.numpages,
          size: dataBuffer.length,
          info: data.info,
        },
      };
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file
   * @private
   */
  async _parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });

      return {
        text: result.value,
        metadata: {
          format: 'docx',
          messages: result.messages,
          size: (await fs.stat(filePath)).size,
        },
      };
    } catch (error) {
      logger.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Parse TXT file
   * @private
   */
  async _parseTXT(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf8');
      return text;
    } catch (error) {
      logger.error('TXT parsing error:', error);
      throw new Error(`Failed to parse TXT: ${error.message}`);
    }
  }

  /**
   * Validate file before parsing
   * @param {string} filePath - Path to validate
   * @returns {Promise<boolean>} Validation result
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (stats.size > maxSize) {
        throw new Error('File size exceeds maximum limit of 10MB');
      }

      // Check file format
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      return true;
    } catch (error) {
      logger.error('File validation error:', error);
      return false;
    }
  }

  /**
   * Get supported file formats
   * @returns {string[]} Array of supported formats
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
}

module.exports = new CVParserService();
