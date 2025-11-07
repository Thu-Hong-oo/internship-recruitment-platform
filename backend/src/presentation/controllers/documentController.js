const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  InternalServerError,
} = require('../../shared/utils/errors');
const { logger } = require('../../shared/utils/logger');
const { uploadToCloudinary } = require('../../shared/utils/cloudinary');
const EmployerDocument = require('../../infrastructure/models/EmployerDocument');

/**
 * @desc    Upload company verification document
 * @route   POST /api/employers/documents
 * @access  Private (Employer)
 */
const uploadDocument = asyncHandler(async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.files || !req.files.document) {
      throw new BadRequestError('Vui lòng chọn file để upload');
    }

    const file = req.files.document;

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

    return res.status(200).json({
      success: true,
      message: 'Upload tài liệu thành công',
      data: {
        fileUrl: result.secure_url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
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

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(400).json({
      success: false,
      error: 'Lấy danh sách tài liệu thất bại',
    });
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

    res.status(200).json({
      success: true,
      message: 'Xóa tài liệu thành công',
    });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(400).json({
      success: false,
      error: 'Xóa tài liệu thất bại',
    });
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

    res.status(200).json({
      success: true,
      data: {
        id: document._id,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
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
    if (!req.files || !req.files.document) {
      throw new BadRequestError('Vui lòng chọn file để cập nhật');
    }

    const file = req.files.document;

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

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài liệu thành công',
      data: {
        id: document._id,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
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

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin tài liệu thành công',
      data: {
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
      },
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

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái xác thực thành công',
      data: {
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
      },
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
