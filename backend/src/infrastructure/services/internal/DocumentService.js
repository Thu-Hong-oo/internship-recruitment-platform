// documentService.js
const UnifiedUploadService = require('../external/UnifiedUploadService');
const EmployerProfileHelpers = require('../helpers/EmployerProfileHelpers');

/**
 * Upload document for employer profile
 * @param {Object} file
 * @param {string} userId
 * @param {string} documentType
 * @param {Object} metadata
 * @param {Object} profile
 * @returns {Promise<Object>} upload result
 */
async function uploadDocument(file, userId, documentType, metadata, profile) {
  // UnifiedUploadService is singleton, and expects object parameter
  const uploadResult = await UnifiedUploadService.uploadFile({
    file: file,
    type: 'document',
    userId: userId,
    metadata: { documentType, ...metadata },
  });
  await EmployerProfileHelpers.addDocument(
    profile,
    uploadResult.url,
    uploadResult.public_id,
    documentType,
    {
      ...metadata,
      originalName: uploadResult.originalName,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
    }
  );
  return uploadResult;
}

/**
 * Remove document from employer profile
 * @param {Object} profile
 * @param {string} documentId
 * @returns {Promise<void>}
 */
async function removeDocument(profile, documentId) {
  await EmployerProfileHelpers.removeDocument(profile, documentId);
}

module.exports = { uploadDocument, removeDocument };
