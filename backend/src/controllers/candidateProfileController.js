const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');

// @desc    Get candidate profile by userId
// @route   GET /api/candidate-profiles/:userId
// @access  Private (Candidate)
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId })
    .populate('userId', 'fullName email avatar');
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile });
});

// @desc    Update candidate profile
// @route   PUT /api/candidate-profiles/:userId
// @access  Private (Candidate)
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  // Whitelist fields allowed to update
  const allowedFields = ['fullName', 'phone', 'address', 'dob', 'gender', 'avatar', 'summary', 'skills', 'education', 'experience', 'preferences', 'socialLinks'];
  const updateData = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }
  const profile = await CandidateProfile.findOneAndUpdate(
    { userId },
    updateData,
    { new: true, runValidators: true }
  );
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  await profile.updateProfileCompletion();
  res.status(200).json({ success: true, data: profile });
});

// @desc    Upload CV
// @route   POST /api/candidate-profiles/:userId/cv
// @access  Private (Candidate)
exports.uploadCV = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  if (!req.file || !req.file.path) {
    return res.status(400).json({ success: false, message: 'Vui lòng upload file CV' });
  }
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Lưu CV mới vào history
  profile.resume.history.push({ url: req.file.path, uploadedAt: new Date() });
  // Cập nhật CV hiện tại
  profile.resume.current = {
    url: req.file.path,
    updatedAt: new Date(),
    aiAnalysis: {}, // Chờ phân tích AI
  };
  await profile.save();
  res.status(200).json({ success: true, data: profile.resume.current });
});

// @desc    Get CV analysis
// @route   GET /api/candidate-profiles/:userId/cv/analysis
// @access  Private (Candidate)
exports.getCVAnalysis = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile || !profile.resume.current || !profile.resume.current.aiAnalysis) {
    return res.status(404).json({ success: false, message: 'Chưa có kết quả phân tích CV' });
  }
  res.status(200).json({ success: true, data: profile.resume.current.aiAnalysis });
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
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  if (ENABLE_SKILL_VERIFICATION) {
    // Only admin or employer can verify skills
    if (req.user.role !== 'admin' && req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xác thực kỹ năng này' });
    }
  }
  const skill = profile.skills.technical.find(s => s.name === skillName);
  if (!skill) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng' });
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
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  await profile.incrementViews();
  res.status(200).json({ success: true, viewCount: profile.analytics.viewCount });
});

// @desc    Get analytics
// @route   GET /api/candidate-profiles/:userId/analytics
// @access  Private (Candidate)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
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
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Validate: không ghi đè nếu array rỗng hoặc không phải array
  if (Array.isArray(internships) && internships.length > 0) profile.experience.internships = internships;
  if (Array.isArray(projects) && projects.length > 0) profile.experience.projects = projects;
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
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  if (typeof university === 'string' && university.trim()) profile.education.university = university;
  if (Array.isArray(certifications) && certifications.length > 0) profile.education.certifications = certifications;
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
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  // Validate: chỉ ghi đè nếu preferences là object và có ít nhất 1 key
  if (preferences && typeof preferences === 'object' && Object.keys(preferences).length > 0) {
    profile.preferences = preferences;
    await profile.save();
    return res.status(200).json({ success: true, data: profile.preferences });
  } else {
    return res.status(400).json({ success: false, message: 'Dữ liệu preferences không hợp lệ hoặc thiếu thông tin' });
  }
});

// @desc    Get profile completion progress
// @route   GET /api/candidate-profiles/:userId/progress
// @access  Private (Candidate)
exports.getProgress = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });
  }
  res.status(200).json({ success: true, data: profile.progress });
});
