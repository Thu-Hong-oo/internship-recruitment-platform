// employerServices.js
// Unified employer-related services

const EmployerProfile = require('../../models/EmployerProfile');
const User = require('../../models/User');
const UnifiedProfileService = require('../unifiedProfileService');
const documentUploadService = require('../documentUploadService');
const EmployerProfileHelpers = require('../../helpers/EmployerProfileHelpers');

// --- Get or create employer profile ---
async function getProfile(userId) {
  let profile = await EmployerProfile.findOne({ owner: userId });
  if (!profile) {
    profile = await EmployerProfile.create({
      owner: userId,
      company: {
        name: 'Chưa cập nhật',
        industry: 'unknown',
        size: 'small',
        email: 'temp@example.com',
        officeAddress: {
          street: 'Chưa cập nhật',
          ward: 'Chưa cập nhật',
          district: 'Chưa cập nhật',
          city: 'Chưa cập nhật',
          country: 'Vietnam',
        },
      },
      position: {
        title: 'Chưa cập nhật',
        level: 'junior',
        department: 'Chưa cập nhật',
      },
      contact: {
        name: 'Chưa cập nhật',
        phone: 'Chưa cập nhật',
        email: 'temp@example.com',
      },
      legalRepresentative: {
        fullName: 'Chưa cập nhật',
        position: 'Chưa cập nhật',
        phone: 'Chưa cập nhật',
        email: 'temp@example.com',
      },
      businessInfo: {
        registrationNumber: 'temp',
        taxId: `temp_${userId}_${Date.now()}`,
        issueDate: new Date(),
        issuePlace: 'Chưa cập nhật',
        address: {
          street: 'Chưa cập nhật',
          ward: 'Chưa cập nhật',
          district: 'Chưa cập nhật',
          city: 'Chưa cập nhật',
          country: 'Vietnam',
        },
      },
    });
    await User.findByIdAndUpdate(userId, { employerProfile: profile._id });
  }
  return profile;
}

// --- Update employer profile (position, contact) ---
async function updateProfile(userId, body) {
  return UnifiedProfileService.updateProfile(
    userId,
    body,
    {
      role: 'employer',
      restrictFields: ['position', 'contact'],
      updateUser: false,
    }
  );
}

// --- Update company info (company, businessInfo, legalRepresentative, documents) ---
async function updateCompanyInfo(userId, body) {
  return UnifiedProfileService.updateProfile(
    userId,
    body,
    {
      role: 'employer',
      restrictFields: ['company', 'businessInfo', 'legalRepresentative', 'documents'],
      updateUser: true,
    }
  );
}

// --- Document upload ---
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

// --- Remove document ---
async function removeDocument(profile, documentId) {
  await EmployerProfileHelpers.removeDocument(profile, documentId);
}

module.exports = {
  getProfile,
  updateProfile,
  updateCompanyInfo,
  uploadDocument,
  removeDocument,
};
