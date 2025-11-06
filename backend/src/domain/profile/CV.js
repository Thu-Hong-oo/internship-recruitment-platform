const ANALYSIS_STATUS = require('../ai-matching/enums/AnalysisStatus');

/**
 * CV Domain Entity
 *
 * Represents a candidate's CV/resume document in the recruitment system.
 * Contains file metadata, upload information, and analysis status.
 *
 * Following Clean Architecture principles:
 * - No dependencies on infrastructure layer
 * - Business logic encapsulated within entity
 * - Constructor accepts only required fields
 * - Optional fields set to null (not undefined)
 * - No default values in constructor
 */
class CV {
  constructor(
    cvId,
    candidateId,
    originalName,
    cloudinaryPublicId = null,
    cloudinaryUrl = null,
    fileSize = null,
    mimeType = null,
    isActive = true,
    isDefault = false,
    analysisStatus = ANALYSIS_STATUS.PENDING,
    uploadedAt = null,
    createdAt = null,
    updatedAt = null
  ) {
    // Required fields
    this.cvId = cvId;
    this.candidateId = candidateId;
    this.originalName = originalName;

    // File storage info
    this.cloudinaryPublicId = cloudinaryPublicId;
    this.cloudinaryUrl = cloudinaryUrl;
    this.fileSize = fileSize;
    this.mimeType = mimeType;

    // Status flags
    this.isActive = isActive;
    this.isDefault = isDefault;
    this.analysisStatus = analysisStatus;

    // Timestamps
    this.uploadedAt = uploadedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.validate();
  }

  /**
   * Validates the CV entity
   * @throws {Error} if validation fails
   */
  validate() {
    if (!this.candidateId) {
      throw new Error('Candidate ID is required for CV');
    }

    if (!this.originalName) {
      throw new Error('Original filename is required');
    }

    const validStatuses = Object.values(ANALYSIS_STATUS);
    if (!validStatuses.includes(this.analysisStatus)) {
      throw new Error(`Invalid analysis status: ${this.analysisStatus}`);
    }
  }

  /**
   * Gets file URL (alias for cloudinaryUrl for consistency)
   * @returns {string|null} File URL
   */
  get fileUrl() {
    return this.cloudinaryUrl;
  }

  /**
   * Gets download URL for the CV
   * @returns {string|null} Download URL or null
   */
  getDownloadUrl() {
    if (!this.cloudinaryPublicId) return this.cloudinaryUrl;

    const extension = this._getFileExtension();
    const baseUrl = 'https://res.cloudinary.com/du10thaqs/raw/upload';
    return `${baseUrl}/fl_attachment/${this.cloudinaryPublicId}${extension}`;
  }

  /**
   * Gets preview URL for the CV
   * @returns {string|null} Preview URL or null
   */
  getPreviewUrl() {
    if (!this.cloudinaryPublicId) return this.cloudinaryUrl;

    const extension = this._getFileExtension();
    const baseUrl = 'https://res.cloudinary.com/du10thaqs/raw/upload';
    return `${baseUrl}/${this.cloudinaryPublicId}${extension}`;
  }

  /**
   * Gets file extension from filename or MIME type
   * @private
   * @returns {string} File extension with dot
   */
  _getFileExtension() {
    let extension = '';

    if (this.originalName) {
      const parts = this.originalName.split('.');
      extension = parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }

    if (!extension && this.mimeType) {
      if (this.mimeType.includes('pdf')) extension = '.pdf';
      else if (this.mimeType.includes('word')) extension = '.docx';
    }

    return extension;
  }

  /**
   * Checks if CV can be analyzed
   * @returns {boolean} True if CV is pending analysis
   */
  canBeAnalyzed() {
    return this.analysisStatus === ANALYSIS_STATUS.PENDING;
  }

  /**
   * Marks CV as analyzing
   */
  startAnalysis() {
    if (!this.canBeAnalyzed()) {
      throw new Error('CV is not in pending status');
    }
    this.analysisStatus = ANALYSIS_STATUS.ANALYZING;
    this.updatedAt = new Date();
  }

  /**
   * Marks CV analysis as completed
   */
  completeAnalysis() {
    if (this.analysisStatus !== ANALYSIS_STATUS.ANALYZING) {
      throw new Error('CV is not currently being analyzed');
    }
    this.analysisStatus = ANALYSIS_STATUS.COMPLETED;
    this.updatedAt = new Date();
  }

  /**
   * Marks CV analysis as failed
   * @param {string} reason - Failure reason
   */
  failAnalysis(reason = null) {
    this.analysisStatus = ANALYSIS_STATUS.FAILED;
    this.analysisFailureReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Sets this CV as default
   * Note: Repository should handle removing default flag from other CVs
   */
  setAsDefault() {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  /**
   * Removes default flag from this CV
   */
  removeDefault() {
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  /**
   * Activates the CV
   */
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivates the CV (soft delete)
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Checks if CV is active
   * @returns {boolean} True if CV is active
   */
  isActiveCV() {
    return this.isActive === true;
  }

  /**
   * Checks if this is the default CV
   * @returns {boolean} True if this is default CV
   */
  isDefaultCV() {
    return this.isDefault === true;
  }

  /**
   * Checks if analysis is completed
   * @returns {boolean} True if analysis is completed
   */
  isAnalysisCompleted() {
    return this.analysisStatus === ANALYSIS_STATUS.COMPLETED;
  }

  /**
   * Checks if analysis failed
   * @returns {boolean} True if analysis failed
   */
  isAnalysisFailed() {
    return this.analysisStatus === ANALYSIS_STATUS.FAILED;
  }

  /**
   * Gets file size in MB
   * @returns {number} File size in megabytes
   */
  getFileSizeInMB() {
    if (!this.fileSize) return 0;
    return (this.fileSize / (1024 * 1024)).toFixed(2);
  }

  /**
   * Gets file type from MIME type
   * @returns {string} File type (PDF, DOCX, etc.)
   */
  getFileType() {
    if (!this.mimeType) return 'Unknown';

    if (this.mimeType.includes('pdf')) return 'PDF';
    if (this.mimeType.includes('word')) return 'DOCX';
    if (this.mimeType.includes('doc')) return 'DOC';
    if (this.mimeType.includes('text')) return 'TXT';

    return this.mimeType.split('/')[1]?.toUpperCase() || 'Unknown';
  }

  /**
   * Formats CV for API response
   * @returns {Object} Client-friendly JSON representation
   */
  toClientJSON() {
    return {
      id: this.cvId,
      fileName: this.originalName,
      fileUrl: this.cloudinaryUrl,
      downloadUrl: this.getDownloadUrl(),
      previewUrl: this.getPreviewUrl(),
      fileSize: this.fileSize,
      fileSizeMB: this.getFileSizeInMB(),
      fileType: this.getFileType(),
      mimeType: this.mimeType,
      isDefault: this.isDefault,
      isActive: this.isActive,
      analysisStatus: this.analysisStatus,
      uploadedAt: this.uploadedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = CV;
