const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  InternalServerError,
} = require('../../shared/utils/errors');
const { logger } = require('../../shared/utils/logger');
const { uploadToCloudinary } = require('../../shared/utils/cloudinary');
const {
  successResponse,
  errorResponse,
  dataResponse,
} = require('../../shared/utils/response');
const EmployerDocument = require('../../infrastructure/models/EmployerDocument');

/**
 * @desc    Upload company verification document
 * @route   POST /api/employers/documents
 * @access  Private (Employer)
 */
const uploadDocument = asyncHandler(async (req, res) => {
  try {
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    // Check if file is uploaded
    if (!req.file) {
      throw new BadRequestError('Vui lòng chọn file để upload');
    }

    const file = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestError(
        'Định dạng file không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc PDF'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestError('File quá lớn. Kích thước tối đa là 10MB');
    }

    // Upload to cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `internbridge/documents/${req.user.id}`,
      resource_type: 'auto',
    });

    // Validate documentType
    const documentType = req.body.documentType;
    if (!documentType || typeof documentType !== 'string') {
      throw new BadRequestError('Loại tài liệu không hợp lệ');
    }

    // Validate documentType enum
    const validTypes = [
      'business-license',
      'tax-certificate',
      'legal-representative-id',
      'business-plan',
      'financial-statement',
      'other',
    ];
    if (!validTypes.includes(documentType)) {
      throw new BadRequestError(
        `Loại tài liệu không hợp lệ. Các loại hợp lệ: ${validTypes.join(', ')}`
      );
    }

    // Save document info to database
    const document = new EmployerDocument({
      employerId: req.user.id,
      documentType: documentType,
      fileUrl: result.secure_url,
      fileName: file.originalname || file.name,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: 'pending', // Default status
    });

    await document.save();

    return successResponse(res, 'Upload tài liệu thành công', {
      id: document._id,
      fileUrl: result.secure_url,
      fileName: file.originalname || file.name,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: document.documentType,
      status: document.status,
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    throw new InternalServerError('Upload tài liệu thất bại');
  }
});

/**
 * @desc    Get company documents
 * @route   GET /api/employers/documents
 * @access  Private (Employer)
 */
const getDocuments = asyncHandler(async (req, res) => {
  try {
    const getCompanyDocumentsUseCase = req.container.resolve(
      'getCompanyDocumentsUseCase'
    );
    const result = await getCompanyDocumentsUseCase.execute({
      userId: req.user.id,
    });

    return dataResponse(res, result.data);
  } catch (error) {
    logger.error('Get documents error:', error);
    return errorResponse(res, 'Lấy danh sách tài liệu thất bại', 400);
  }
});

/**
 * @desc    Delete document
 * @route   DELETE /api/employers/documents/:documentType
 * @access  Private (Employer)
 */
const deleteDocument = asyncHandler(async (req, res) => {
  try {
    const deleteCompanyDocumentUseCase = req.container.resolve(
      'deleteCompanyDocumentUseCase'
    );
    await deleteCompanyDocumentUseCase.execute({
      userId: req.user.id,
      documentType: req.params.documentType,
    });

    return successResponse(res, 'Xóa tài liệu thành công');
  } catch (error) {
    logger.error('Delete document error:', error);
    return errorResponse(res, 'Xóa tài liệu thất bại', 400);
  }
});

/**
 * @desc    Get document by ID
 * @route   GET /api/employers/documents/:documentId
 * @access  Private (Employer)
 */
const getDocumentById = asyncHandler(async (req, res) => {
  try {
    const document = await EmployerDocument.findOne({
      _id: req.params.documentId,
      employerId: req.user.id,
    });

    if (!document) {
      throw new NotFoundError('Không tìm thấy tài liệu');
    }

    return successResponse(res, 'Lấy thông tin tài liệu thành công', {
      id: document._id,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    logger.error('Get document by id error:', error);
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new InternalServerError('Lấy thông tin tài liệu thất bại');
  }
});

/**
 * @desc    Update document
 * @route   PUT /api/employers/documents/:documentId
 * @access  Private (Employer)
 */
const updateDocument = asyncHandler(async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      throw new BadRequestError('Vui lòng chọn file để cập nhật');
    }

    const file = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestError(
        'Định dạng file không hợp lệ. Chỉ chấp nhận JPEG, PNG hoặc PDF'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestError('File quá lớn. Kích thước tối đa là 10MB');
    }

    // Check if document exists
    const document = await EmployerDocument.findOne({
      _id: req.params.documentId,
      employerId: req.user.id,
    });

    if (!document) {
      throw new NotFoundError('Không tìm thấy tài liệu');
    }

    // Upload new file to cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `internbridge/documents/${req.user.id}`,
      resource_type: 'auto',
    });

    // Update document
    document.fileUrl = result.secure_url;
    document.fileName = file.name;
    document.fileSize = file.size;
    document.mimeType = file.mimetype;
    await document.save();

    return successResponse(res, 'Cập nhật tài liệu thành công', {
      id: document._id,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    logger.error('Update document error:', error);
    if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
      throw error;
    }
    throw new InternalServerError('Cập nhật tài liệu thất bại');
  }
});

/**
 * @desc    Update document metadata
 * @route   PUT /api/employers/documents/:documentId/metadata
 * @access  Private (Employer)
 */
const updateDocumentMetadata = asyncHandler(async (req, res) => {
  try {
    const document = await EmployerDocument.findOne({
      _id: req.params.documentId,
      employerId: req.user.id,
    });

    if (!document) {
      throw new NotFoundError('Không tìm thấy tài liệu');
    }

    // Update metadata fields if provided
    if (req.body.title) {
      document.title = req.body.title;
    }
    if (req.body.description) {
      document.description = req.body.description;
    }
    if (req.body.documentType) {
      document.documentType = req.body.documentType;
    }
    if (req.body.tags) {
      document.tags = req.body.tags;
    }

    await document.save();

    return successResponse(res, 'Cập nhật thông tin tài liệu thành công', {
      id: document._id,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      title: document.title,
      description: document.description,
      documentType: document.documentType,
      tags: document.tags,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    logger.error('Update document metadata error:', error);
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new InternalServerError('Cập nhật thông tin tài liệu thất bại');
  }
});

/**
 * @desc    Verify document status
 * @route   PUT /api/employers/documents/:documentId/verify
 * @access  Private (Employer)
 */
const verifyDocument = asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { verificationStatus, verificationNotes } = req.body;
    if (!verificationStatus) {
      throw new BadRequestError('Trạng thái xác thực là bắt buộc');
    }

    // Check if status is valid
    const validStatuses = ['pending', 'verified', 'rejected'];
    if (!validStatuses.includes(verificationStatus)) {
      throw new BadRequestError('Trạng thái xác thực không hợp lệ');
    }

    // Find document
    const document = await EmployerDocument.findOne({
      _id: req.params.documentId,
      employerId: req.user.id,
    });

    if (!document) {
      throw new NotFoundError('Không tìm thấy tài liệu');
    }

    // Update verification status
    document.verificationStatus = verificationStatus;
    if (verificationNotes) {
      document.verificationNotes = verificationNotes;
    }
    document.verifiedAt = verificationStatus === 'verified' ? Date.now() : null;
    document.verifiedBy =
      verificationStatus === 'verified' ? req.user.id : null;

    await document.save();

    return successResponse(res, 'Cập nhật trạng thái xác thực thành công', {
      id: document._id,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      verificationStatus: document.verificationStatus,
      verificationNotes: document.verificationNotes,
      verifiedAt: document.verifiedAt,
      verifiedBy: document.verifiedBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    logger.error('Verify document error:', error);
    if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
      throw error;
    }
    throw new InternalServerError('Cập nhật trạng thái xác thực thất bại');
  }
});

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  updateDocumentMetadata,
  verifyDocument,
};
