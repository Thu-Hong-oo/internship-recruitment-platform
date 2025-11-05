const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const CandidateProfileResponseDTO = require('../dtos/CandidateProfileResponseDTO');

// Import services (only for infrastructure operations)
const UnifiedUploadService = require('../../infrastructure/services/external/core/UnifiedUploadService');
const User = require('../../infrastructure/models/User');

// ========================================================================
// NOTE: CREATE PROFILE ENDPOINT REMOVED
// Profile is now automatically created after email verification
// See: authController.js -> verifyEmail() for auto-creation logic
// ========================================================================

// @desc    Get candidate profile
// @route   GET /api/candidates/profile
// @access  Private (Candidate)
const getProfile = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );

    // Use candidateId if available, otherwise use userId to find by user reference
    const queryParam = req.user.candidateId
      ? { candidateId: req.user.candidateId }
      : { userId: req.user.id };

    const result = await getCandidateProfileUseCase.execute(queryParam);

    res.status(200).json({
      success: true,
      data: new CandidateProfileResponseDTO(result.candidate).toJSON(),
    });
  } catch (error) {
    if (error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ ứng viên',
      });
    }

    logger.error('Get candidate profile error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update candidate profile
// @route   PUT /api/candidates/profile
// @access  Private (Candidate)
const updateProfile = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const updateCandidateProfileUseCase = req.container.resolve(
      'updateCandidateProfileUseCase'
    );

    // Use candidateId if available, otherwise use userId to find by user reference
    const queryParam = req.user.candidateId
      ? { candidateId: req.user.candidateId }
      : { userId: req.user.id };

    const result = await updateCandidateProfileUseCase.execute({
      ...queryParam,
      profileData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: new CandidateProfileResponseDTO(result.candidate).toJSON(),
    });
  } catch (error) {
    if (error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ ứng viên',
      });
    }

    logger.error('Update candidate profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload CV
// @route   POST /api/candidates/cv
// @access  Private (Candidate)
const uploadCV = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const uploadCVUseCase = req.container.resolve('uploadCVUseCase');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn file CV để upload',
      });
    }

    const result = await uploadCVUseCase.execute({
      candidateId: req.user.candidateId,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.cv,
    });
  } catch (error) {
    logger.error('Upload CV error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all CVs
// @route   GET /api/candidates/cv
// @access  Private (Candidate)
const getCVs = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getCandidateCVsUseCase = req.container.resolve(
      'getCandidateCVsUseCase'
    );

    const result = await getCandidateCVsUseCase.execute({
      candidateId: req.user.candidateId,
    });

    res.status(200).json({
      success: true,
      data: result.cvs,
    });
  } catch (error) {
    logger.error('Get CVs error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    View/Download CV - Stream file through backend
// @route   GET /api/candidates/cv/:cvId/file?mode=view|download
// @access  Private (Candidate)
const proxyCVFile = asyncHandler(async (req, res) => {
  try {
    const viewCVUseCase = req.container.resolve('viewCVUseCase');
    const mode = req.query.mode || 'view';

    // Fetch CV file from Cloudinary
    const result = await viewCVUseCase.proxyFile({
      cvId: req.params.cvId,
      candidateId: req.user.candidateId,
      mode,
    });

    // Set headers for PDF viewing/downloading
    res.setHeader('Content-Type', result.mimeType);

    if (mode === 'download') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.fileName)}"`
      );
    } else {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(result.fileName)}"`
      );
    }

    // Send file buffer
    res.send(result.buffer);

    logger.info('CV file streamed successfully', {
      cvId: req.params.cvId,
      mode,
      fileName: result.fileName,
    });
  } catch (error) {
    logger.error('Proxy CV file error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Set default CV
// @route   PUT /api/candidates/cv/:cvId/default
// @access  Private (Candidate)
const setDefaultCV = asyncHandler(async (req, res) => {
  try {
    const setDefaultCVUseCase = req.container.resolve('setDefaultCVUseCase');
    const result = await setDefaultCVUseCase.execute({
      candidateId: req.user.candidateId,
      cvId: req.params.cvId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.cv,
    });
  } catch (error) {
    logger.error('Set default CV error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update CV name
// @route   PATCH /api/candidates/cv/:cvId
// @access  Private (Candidate)
const updateCV = asyncHandler(async (req, res) => {
  try {
    const cvRepository = req.container.resolve('cvRepository');
    const { fileName } = req.body; // Đổi từ originalName sang fileName để thống nhất

    if (!fileName || !fileName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tên file không được để trống',
      });
    }

    // Get CV
    const cv = await cvRepository.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV không tồn tại',
      });
    }

    // Check ownership
    if (cv.candidateId.toString() !== req.user.candidateId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền cập nhật CV này',
      });
    }

    // Get file extension from mimeType or current name
    let extension = '';
    if (cv.originalName && cv.originalName.includes('.')) {
      const parts = cv.originalName.split('.');
      extension = `.${parts[parts.length - 1]}`;
    } else if (cv.mimeType) {
      if (cv.mimeType.includes('pdf')) extension = '.pdf';
      else if (cv.mimeType.includes('word')) extension = '.docx';
    }

    // Add extension if not present
    let newFileName = fileName.trim();
    if (
      extension &&
      !newFileName.toLowerCase().endsWith(extension.toLowerCase())
    ) {
      newFileName = `${newFileName}${extension}`;
    }

    // Update CV name
    const updatedCV = await cvRepository.update(req.params.cvId, {
      originalName: newFileName,
    });

    logger.info('CV name updated', {
      cvId: req.params.cvId,
      oldName: cv.originalName,
      newName: newFileName,
    });

    res.status(200).json({
      success: true,
      message: 'Đổi tên CV thành công',
      data: updatedCV.toClientJSON(),
    });
  } catch (error) {
    logger.error('Update CV error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete CV
// @route   DELETE /api/candidates/cv/:cvId
// @access  Private (Candidate)
const deleteCV = asyncHandler(async (req, res) => {
  try {
    const deleteCVUseCase = req.container.resolve('deleteCVUseCase');
    const result = await deleteCVUseCase.execute({
      candidateId: req.user.candidateId,
      cvId: req.params.cvId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete CV error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Analyze CV
// @route   POST /api/candidates/cv/:cvId/analyze
// @access  Private (Candidate)
const analyzeCV = asyncHandler(async (req, res) => {
  try {
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );
    const result = await getCandidateProfileUseCase.execute({
      cvId: req.params.cvId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.analysis,
    });
  } catch (error) {
    logger.error('Analyze CV error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get profile completeness
// @route   GET /api/candidates/completeness
// @access  Private (Candidate)
const getProfileCompleteness = asyncHandler(async (req, res) => {
  try {
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );
    const result = await getCandidateProfileUseCase.execute({
      candidateId: req.user.candidateId,
    });

    res.status(200).json({
      success: true,
      data: {
        completeness: result.completeness,
        isComplete: result.isComplete,
      },
    });
  } catch (error) {
    logger.error('Get profile completeness error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get candidate stats
// @route   GET /api/candidates/stats
// @access  Private (Candidate)
const getCandidateStats = asyncHandler(async (req, res) => {
  try {
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );
    const result = await getCandidateProfileUseCase.execute({
      candidateId: req.user.candidateId,
    });

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get candidate stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Search candidates (for employers)
// @route   GET /api/candidates/search
// @access  Private (Employer)
const searchCandidates = asyncHandler(async (req, res) => {
  try {
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );
    const result = await getCandidateProfileUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: CandidateProfileResponseDTO.fromCandidateProfiles(
        result.candidates
      ),
      total: result.total,
    });
  } catch (error) {
    logger.error('Search candidates error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Upload candidate avatar
// @route   POST /api/candidates/avatar
// @access  Private (Candidate)
const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn file ảnh để upload',
      });
    }

    // Get user ID
    const userId = req.user.userId || req.user.id;

    // UnifiedUploadService expects an object with file, type, and userId
    const uploadResult = await UnifiedUploadService.uploadFile({
      file: req.file,
      type: 'avatar',
      userId: userId,
    });

    // Update User.avatarUrl
    await User.findByIdAndUpdate(userId, {
      avatarUrl: uploadResult.url,
    });

    // Get updated candidate profile using use case from container
    const getCandidateProfileUseCase = req.container.resolve(
      'getCandidateProfileUseCase'
    );
    const result = await getCandidateProfileUseCase.execute({
      userId: userId,
    });

    logger.info(`Candidate avatar uploaded successfully: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công',
      data: new CandidateProfileResponseDTO(result.candidate).toJSON(),
    });
  } catch (error) {
    if (error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ ứng viên',
      });
    }

    logger.error('Upload candidate avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi upload avatar',
    });
  }
});

module.exports = {
  // createProfile removed - profile auto-created on email verification
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCV,
  getCVs,
  proxyCVFile,
  updateCV,
  setDefaultCV,
  deleteCV,
  analyzeCV,
  getProfileCompleteness,
  getCandidateStats,
  searchCandidates,
};
