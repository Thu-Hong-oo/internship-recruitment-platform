const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'internship-avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
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
  deleteImage
};
