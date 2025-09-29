
const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const { uploadImage } = require('../services/imageUploadService');
const { uploadFile } = require('../services/fileUploadService');
const UnifiedProfileService = require('../services/unifiedProfileService');
// Thêm các helper/validation nếu có

// Helper: check user đã có candidate profile chưa, nếu chưa thì tạo profile mặc định với các placeholders
const ensureCandidateProfile = async userId => {
  let profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    profile = await CandidateProfile.create({
      userId,
      fullName: 'Chưa cập nhật',
      phone: 'Chưa cập nhật',
      address: 'Chưa cập nhật',
      dob: null,
      gender: 'unknown',
      avatar: '',
      summary: '',
      skills: { technical: [], soft: [], languages: [] },
      education: { university: '', certifications: [] },
      experience: { internships: [], projects: [] },
      preferences: {},
      socialLinks: {},
      resume: { current: {}, history: [] },
      analytics: { viewCount: 0 },
      progress: {},
    });
    await User.findByIdAndUpdate(userId, { candidateProfile: profile._id });
  }
  profile = await CandidateProfile.findOne({ userId });
  return profile;
};
// @desc    Get candidate profile by userId
// @route   GET /api/candidate-profiles/:userId
// @access  Private (Candidate)
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await ensureCandidateProfile(userId);
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile });
});

// @desc    Update candidate profile
// @route   PUT /api/candidates/:userId
// @access  Private (Candidate)
exports.updateProfile = asyncHandler(async (req, res) => {
  try {
    const result = await UnifiedProfileService.updateProfile(
      req.params.userId || req.user.id,
      req.body,
      {
        role: 'candidate',
        restrictFields: [
          'fullName',
          'phone',
          'address',
          'dob',
          'gender',
          'avatar',
          'summary',
          'skills',
          'education',
          'experience',
          'preferences',
          'socialLinks',
        ],
        updateUser: false,
      }
    );
    UnifiedProfileService.successResponse(
      res,
      'Cập nhật hồ sơ ứng viên thành công',
      {
        profile: result.profile,
        updatedFields: result.updatedFields.profile,
      }
    );
  } catch (error) {
    UnifiedProfileService.handleError(error, res, 'Cập nhật hồ sơ ứng viên');
  }
});

// @desc    Upload CV
// @route   POST /api/candidates/:userId/cv
// @access  Private (Candidate)
exports.uploadCV = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  if (!req.file || !req.file.buffer) {
    return res
      .status(400)
      .json({ success: false, message: 'Vui lòng upload file CV' });
  }
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Upload file CV lên Cloudinary
  // Tạo public_id giữ nguyên đuôi file gốc
  let publicId = undefined;
  if (req.file.originalname) {
    const name = req.file.originalname.replace(/\s+/g, '_');
    publicId = name + '_' + Date.now();
  }
  const uploadResult = await uploadFile('document', req.file.buffer, {
    folder: 'internbridge/cv',
    resource_type: 'auto',
    flags: 'attachment:false',
    allowed_formats: ['pdf', 'doc', 'docx'],
    public_id: publicId,
    format: 'pdf',
  });

  // Lưu CV mới vào history
  profile.resume.history.push({
    url: uploadResult.url,
    uploadedAt: new Date(),
    filename: req.file.originalname || '',
    format: uploadResult.format || '',
  });
  // Tạo link xem trước (preview) và link tải về (download)
  const previewUrl = uploadResult.url;
  let downloadUrl = uploadResult.url;
  if (req.file.originalname) {
    const encodedName = encodeURIComponent(req.file.originalname);
    downloadUrl = uploadResult.url + '?attachment=' + encodedName;
  }
  // Cập nhật CV hiện tại
  profile.resume.current = {
    previewUrl,
    downloadUrl,
    updatedAt: new Date(),
    filename: req.file.originalname || '',
    format: uploadResult.format || '',
    aiAnalysis: {}, // Chờ phân tích AI
  };
  await profile.save();
  res.status(200).json({
    success: true,
    data: {
      previewUrl,
      downloadUrl,
      filename: req.file.originalname || '',
      format: uploadResult.format || '',
      updatedAt: profile.resume.current.updatedAt,
      aiAnalysis: profile.resume.current.aiAnalysis,
    },
  });
});

// @desc    Get CV analysis
// @route   GET /api/candidate-profiles/:userId/cv/analysis
// @access  Private (Candidate)
exports.getCVAnalysis = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (
    !profile ||
    !profile.resume.current ||
    !profile.resume.current.aiAnalysis
  ) {
    return res
      .status(404)
      .json({ success: false, message: 'Chưa có kết quả phân tích CV' });
  }
  res
    .status(200)
    .json({ success: true, data: profile.resume.current.aiAnalysis });
});

// @desc    Update skills verification
// @route   PUT /api/candidate-profiles/:userId/skills/verify
// @access  Private (Candidate)
// Optional: Only allow admin/employer to verify if config enabled
const { ENABLE_SKILL_VERIFICATION } = require('../config/featureFlags');
exports.verifySkill = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const { skillName } = req.body;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  if (ENABLE_SKILL_VERIFICATION) {
    // Only admin or employer can verify skills
    if (req.user.role !== 'admin' && req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác thực kỹ năng này',
      });
    }
  }
  const skill = profile.skills.technical.find(s => s.name === skillName);
  if (!skill) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy kỹ năng' });
  }
  skill.verified = true;
  await profile.updateSkillVerification();
  await profile.save();
  res.status(200).json({ success: true, data: skill });
});

// @desc    Increment profile views
// @route   POST /api/candidate-profiles/:userId/view
// @access  Public
exports.incrementViews = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  await profile.incrementViews();
  res
    .status(200)
    .json({ success: true, viewCount: profile.analytics.viewCount });
});

// @desc    Get analytics
// @route   GET /api/candidate-profiles/:userId/analytics
// @access  Private (Candidate)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile.analytics });
});

// @desc    Add or update experience
// @route   PUT /api/candidate-profiles/:userId/experience
// @access  Private (Candidate)
exports.updateExperience = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const { internships, projects } = req.body;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Validate: không ghi đè nếu array rỗng hoặc không phải array
  if (Array.isArray(internships) && internships.length > 0)
    profile.experience.internships = internships;
  if (Array.isArray(projects) && projects.length > 0)
    profile.experience.projects = projects;
  await profile.save();
  res.status(200).json({ success: true, data: profile.experience });
});

// @desc    Add or update education
// @route   PUT /api/candidate-profiles/:userId/education
// @access  Private (Candidate)
exports.updateEducation = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const { university, certifications } = req.body;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  if (typeof university === 'string' && university.trim())
    profile.education.university = university;
  if (Array.isArray(certifications) && certifications.length > 0)
    profile.education.certifications = certifications;
  await profile.save();
  res.status(200).json({ success: true, data: profile.education });
});

// @desc    Add or update preferences
// @route   PUT /api/candidate-profiles/:userId/preferences
// @access  Private (Candidate)
exports.updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const preferences = req.body;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Validate: chỉ ghi đè nếu preferences là object và có ít nhất 1 key
  if (
    preferences &&
    typeof preferences === 'object' &&
    Object.keys(preferences).length > 0
  ) {
    profile.preferences = preferences;
    await profile.save();
    return res.status(200).json({ success: true, data: profile.preferences });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu preferences không hợp lệ hoặc thiếu thông tin',
    });
  }
});

// @desc    Get profile completion progress
// @route   GET /api/candidate-profiles/:userId/progress
// @access  Private (Candidate)
exports.getProgress = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile.progress });
});
// @desc    Delete CV from history
// @route   DELETE /api/candidates/:userId/cv/:cvIndex
// @access  Private (Candidate)
exports.deleteCV = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const cvIndex = parseInt(req.params.cvIndex, 10);
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile || !Array.isArray(profile.resume.history) || cvIndex < 0 || cvIndex >= profile.resume.history.length) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy CV cần xóa' });
  }
  const cvToDelete = profile.resume.history[cvIndex];
  // Xóa file trên Cloudinary nếu có url
  if (cvToDelete.url) {
    try {
      // Lấy publicId từ url Cloudinary
      const matches = cvToDelete.url.match(/\/([^\/]+)\.[^\/]+$/);
      const publicId = matches ? matches[1] : undefined;
      if (publicId) {
        const { deleteFile } = require('../services/fileUploadService');
        await deleteFile(publicId, 'raw');
      }
    } catch (err) {
      // Không cần throw, chỉ log
      logger && logger.error && logger.error('Xóa file Cloudinary thất bại:', err);
    }
  }
  // Xóa khỏi history
  profile.resume.history.splice(cvIndex, 1);
  // Nếu CV hiện tại bị xóa thì cập nhật lại current
  if (profile.resume.current && profile.resume.current.url === cvToDelete.url) {
    profile.resume.current = profile.resume.history.length > 0
      ? { ...profile.resume.history[profile.resume.history.length - 1], aiAnalysis: {} }
      : {};
  }
  await profile.save();
  res.status(200).json({ success: true, message: 'Đã xóa CV khỏi lịch sử', history: profile.resume.history, current: profile.resume.current });
});