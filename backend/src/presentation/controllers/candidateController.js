const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const CandidateProfileResponseDTO = require('../dtos/CandidateProfileResponseDTO');

// Import use cases from DI container
const {
  createCandidateProfileUseCase,
  getCandidateProfileUseCase,
  updateCandidateProfileUseCase,
} = require('../../infrastructure/config/diContainer');

// @desc    Create candidate profile
// @route   POST /api/candidates/profile
// @access  Private (Candidate)
const createProfile = asyncHandler(async (req, res) => {
  try {
    const result = await createCandidateProfileUseCase.execute({
      userId: req.user.id,
      profileData: req.body,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
    });
  } catch (error) {
    if (error.message === 'PROFILE_ALREADY_EXISTS') {
      return res.status(400).json({
        success: false,
        error: 'Hồ sơ ứng viên đã tồn tại',
      });
    }

    logger.error('Create candidate profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get candidate profile
// @route   GET /api/candidates/profile
// @access  Private (Candidate)
const getProfile = asyncHandler(async (req, res) => {
  try {
    const result = await getCandidateProfileUseCase.execute({
      candidateId: req.user.candidateId,
    });

    res.status(200).json({
      success: true,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
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
    const result = await updateCandidateProfileUseCase.execute({
      candidateId: req.user.candidateId,
      profileData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn file CV để upload',
      });
    }

    const result = await CandidateService.uploadCV(
      req.user.candidateId,
      req.file
    );

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
    const result = await CandidateService.getCVs(req.user.candidateId);

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

// @desc    Set default CV
// @route   PUT /api/candidates/cv/:cvId/default
// @access  Private (Candidate)
const setDefaultCV = asyncHandler(async (req, res) => {
  try {
    const result = await CandidateService.setDefaultCV(
      req.user.candidateId,
      req.params.cvId
    );

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

// @desc    Delete CV
// @route   DELETE /api/candidates/cv/:cvId
// @access  Private (Candidate)
const deleteCV = asyncHandler(async (req, res) => {
  try {
    const result = await CandidateService.deleteCV(
      req.user.candidateId,
      req.params.cvId
    );

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
    const result = await CandidateService.analyzeCV(req.params.cvId);

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

// @desc    Add education
// @route   POST /api/candidates/education
// @access  Private (Candidate)
const addEducation = asyncHandler(async (req, res) => {
  try {
    const result = await CandidateService.addEducation(
      req.user.candidateId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
    });
  } catch (error) {
    logger.error('Add education error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Add experience
// @route   POST /api/candidates/experience
// @access  Private (Candidate)
const addExperience = asyncHandler(async (req, res) => {
  try {
    const result = await CandidateService.addExperience(
      req.user.candidateId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
    });
  } catch (error) {
    logger.error('Add experience error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update skills
// @route   PUT /api/candidates/skills
// @access  Private (Candidate)
const updateSkills = asyncHandler(async (req, res) => {
  try {
    const result = await CandidateService.updateSkills(
      req.user.candidateId,
      req.body.skills
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: CandidateProfileResponseDTO.fromCandidateProfile(result.candidate),
    });
  } catch (error) {
    logger.error('Update skills error:', error);
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
    const result = await CandidateService.getProfileCompleteness(
      req.user.candidateId
    );

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
    const result = await CandidateService.getCandidateStats(
      req.user.candidateId
    );

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
    const result = await CandidateService.searchCandidates(req.query);

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

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  uploadCV,
  getCVs,
  setDefaultCV,
  deleteCV,
  analyzeCV,
  addEducation,
  addExperience,
  updateSkills,
  getProfileCompleteness,
  getCandidateStats,
  searchCandidates,
};
