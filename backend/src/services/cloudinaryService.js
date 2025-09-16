const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
const testConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Delete image function
const deleteImage = async publicId => {
  try {
    if (publicId && !publicId.includes('http')) {
      // Extract public ID from URL if needed
      const urlParts = publicId.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicIdWithoutExt = filename.split('.')[0];
      const folder = 'internship-avatars';
      const fullPublicId = `${folder}/${publicIdWithoutExt}`;

      await cloudinary.uploader.destroy(fullPublicId);
      console.log(`Deleted image: ${fullPublicId}`);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

module.exports = {
  cloudinary,
  storage,
  deleteImage,
  testConnection,
};
