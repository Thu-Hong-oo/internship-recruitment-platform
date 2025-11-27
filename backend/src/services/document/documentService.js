// documentService.js
const documentUploadService = require('../upload/documentUploadService');
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
  const uploadResult = await documentUploadService.uploadDocument(file, userId, documentType);
  await EmployerProfileHelpers.addDocument(
    profile,
    uploadResult.url,
    uploadResult.publicId,
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
