// employerServices.js
// Unified employer-related services

const EmployerProfile = require('../../models/EmployerProfile');
const User = require('../../models/User');
const UnifiedProfileService = require('../unifiedProfileService');
const documentUploadService = require('../documentUploadService');
const EmployerProfileHelpers = require('../../helpers/EmployerProfileHelpers');
const { uploadImage, deleteImage } = require('../imageUploadService');

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

// --- Upload company logo ---
async function uploadLogo(userId, file) {
  // Get or create employer profile
  const profile = await getProfile(userId);
  
  // Delete old logo if exists
  if (profile.company?.logo?.filename) {
    try {
      await deleteImage(profile.company.logo.filename);
    } catch (error) {
      console.warn('Failed to delete old logo:', error.message);
    }
  }
  
  // Upload new logo to Cloudinary
  const uploadResult = await uploadImage('logo', file.buffer, {
    public_id: `company-logo-${userId}-${Date.now()}`,
  });
  
  console.log('Logo upload result:', uploadResult);

  // Update profile with new logo info
  profile.company.logo = {
    url: uploadResult.url,
    filename: uploadResult.publicId,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
  };
  
  console.log('Logo data before save:', profile.company.logo);

  await profile.save();
  
  console.log('Logo data after save:', profile.company.logo);

  return {
    logo: profile.company.logo,
    publicId: uploadResult.publicId,
    employerProfileId: profile._id,
  };
}

// --- Remove company logo ---
async function removeLogo(userId) {
  const profile = await getProfile(userId);
  
  if (!profile.company?.logo?.filename) {
    throw new Error('Không có logo để xóa');
  }
  
  // Delete from Cloudinary
  await deleteImage(profile.company.logo.filename);
  
  // Remove from profile
  profile.company.logo = undefined;
  await profile.save();
  
  return { message: 'Logo đã được xóa thành công' };
}

// Upload cover image
async function uploadCoverImage(userId, file) {
  try {
    console.log('uploadCoverImage called with userId:', userId, 'file:', file.originalname);
    
    const profile = await getProfile(userId);
    console.log('Profile found, current cover image:', profile.company?.coverImage?.filename);
    
    // Delete old cover image if exists
    if (profile.company?.coverImage?.filename) {
      try {
        console.log('Deleting old cover image:', profile.company.coverImage.filename);
        await deleteImage(profile.company.coverImage.filename);
        console.log('Old cover image deleted successfully');
      } catch (error) {
        console.warn('Failed to delete old cover image:', error.message);
      }
    }
    
    // Upload new cover image
    console.log('Uploading new cover image...');
    const uploadResult = await uploadImage('cover', file.buffer);
    console.log('Upload result:', uploadResult.publicId, uploadResult.url);
    
    // Update profile
    profile.company.coverImage = {
      url: uploadResult.url,
      filename: uploadResult.publicId,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };
    
    console.log('Saving profile...');
    await profile.save();
    console.log('Profile saved successfully');
    
    return {
      coverImage: profile.company.coverImage,
      publicId: uploadResult.publicId,
      employerProfileId: profile._id,
    };
  } catch (error) {
    console.error('Error in uploadCoverImage:', error);
    throw error;
  }
}

// Remove cover image
async function removeCoverImage(userId) {
  const profile = await getProfile(userId);
  
  if (!profile.company?.coverImage?.filename) {
    throw new Error('Không có ảnh bìa để xóa');
  }
  
  // Delete from Cloudinary
  await deleteImage(profile.company.coverImage.filename);
  
  // Remove from profile
  profile.company.coverImage = undefined;
  await profile.save();
  
  return { 
    message: 'Ảnh bìa đã được xóa thành công',
    employerProfileId: profile._id 
  };
}

module.exports = {
  getProfile,
  updateProfile,
  updateCompanyInfo,
  uploadDocument,
  removeDocument,
  uploadLogo,
  removeLogo,
  uploadCoverImage,
  removeCoverImage,
};
