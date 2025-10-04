const multer = require('multer');

// Configure memory storage for multer
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow all file types, validation will be done by UnifiedUploadService
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5, // Maximum 5 files
    fieldSize: 100 * 1024, // 100KB max field size
  },
});

module.exports = {
  single: fieldName => upload.single(fieldName),
  multiple: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  fields: fields => upload.fields(fields),
  any: () => upload.any(),
  none: () => upload.none(),
};
