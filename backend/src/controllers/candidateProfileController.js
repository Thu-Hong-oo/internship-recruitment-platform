const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { logger } = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// @desc    Get candidate profile
// @route   GET /api/candidate-profile
// @access  Private (Candidate)
const getCandidateProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id })
      .populate('skills.skillId', 'name category level')
      .populate('education.degree')
      .populate('experience.companyId', 'name logo industry');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy hồ sơ ứng viên'
    });
  }
});

// @desc    Create candidate profile
// @route   POST /api/candidate-profile
// @access  Private (Candidate)
const createCandidateProfile = asyncHandler(async (req, res) => {
  try {
    // Check if profile already exists
    const existingProfile = await CandidateProfile.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Hồ sơ ứng viên đã tồn tại'
      });
    }

    const profileData = {
      ...req.body,
      userId: req.user.id
    };

    const profile = await CandidateProfile.create(profileData);

    await profile.populate('skills.skillId', 'name category level');

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error creating candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hồ sơ ứng viên'
    });
  }
});

// @desc    Update candidate profile
// @route   PUT /api/candidate-profile
// @access  Private (Candidate)
const updateCandidateProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    const updatedProfile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('skills.skillId', 'name category level');

    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Error updating candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hồ sơ ứng viên'
    });
  }
});

// @desc    Add skill to profile
// @route   POST /api/candidate-profile/skills
// @access  Private (Candidate)
const addSkillToProfile = asyncHandler(async (req, res) => {
  try {
    const { skillId, level, experience } = req.body;

    // Check if skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kỹ năng'
      });
    }

    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    // Check if skill already exists
    const existingSkill = profile.skills.find(
      s => s.skillId.toString() === skillId
    );

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Kỹ năng đã tồn tại trong hồ sơ'
      });
    }

    profile.skills.push({ skillId, level, experience });
    await profile.save();

    await profile.populate('skills.skillId', 'name category level');

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error adding skill to profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm kỹ năng vào hồ sơ'
    });
  }
});

// @desc    Remove skill from profile
// @route   DELETE /api/candidate-profile/skills/:skillId
// @access  Private (Candidate)
const removeSkillFromProfile = asyncHandler(async (req, res) => {
  try {
    const { skillId } = req.params;

    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    profile.skills = profile.skills.filter(
      s => s.skillId.toString() !== skillId
    );
    await profile.save();

    await profile.populate('skills.skillId', 'name category level');

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error removing skill from profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa kỹ năng khỏi hồ sơ'
    });
  }
});

// @desc    Add education to profile
// @route   POST /api/candidate-profile/education
// @access  Private (Candidate)
const addEducationToProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    profile.education.push(req.body);
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error adding education to profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm học vấn vào hồ sơ'
    });
  }
});

// @desc    Add experience to profile
// @route   POST /api/candidate-profile/experience
// @access  Private (Candidate)
const addExperienceToProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    profile.experience.push(req.body);
    await profile.save();

    await profile.populate('experience.companyId', 'name logo industry');

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error adding experience to profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm kinh nghiệm vào hồ sơ'
    });
  }
});

// @desc    Get profile completion status
// @route   GET /api/candidate-profile/completion
// @access  Private (Candidate)
const getProfileCompletion = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          completionPercentage: 0,
          completedFields: [],
          missingFields: [
            'personalInfo',
            'skills',
            'education',
            'experience',
            'resume'
          ]
        }
      });
    }

    const completedFields = [];
    const missingFields = [];

    // Check each field
    if (profile.personalInfo?.bio) completedFields.push('personalInfo');
    else missingFields.push('personalInfo');

    if (profile.skills?.length > 0) completedFields.push('skills');
    else missingFields.push('skills');

    if (profile.education?.length > 0) completedFields.push('education');
    else missingFields.push('education');

    if (profile.experience?.length > 0) completedFields.push('experience');
    else missingFields.push('experience');

    if (profile.resume) completedFields.push('resume');
    else missingFields.push('resume');

    const completionPercentage = Math.round(
      (completedFields.length / 5) * 100
    );

    res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        completedFields,
        missingFields
      }
    });
  } catch (error) {
    logger.error('Error getting profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái hoàn thành hồ sơ'
    });
  }
});

// @desc    Upload resume
// @route   POST /api/candidate-profile/resume
// @access  Private (Candidate)
const uploadResume = asyncHandler(async (req, res) => {
  try {
    const { resumeUrl } = req.body;

    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    profile.resume = resumeUrl;
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error uploading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên CV'
    });
  }
});

// @desc    Delete candidate profile
// @route   DELETE /api/candidate-profile
// @access  Private (Candidate)
const deleteCandidateProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ ứng viên'
      });
    }

    await profile.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa hồ sơ ứng viên thành công'
    });
  } catch (error) {
    logger.error('Error deleting candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hồ sơ ứng viên'
    });
  }
});

module.exports = {
  getCandidateProfile,
  createCandidateProfile,
  updateCandidateProfile,
  addSkillToProfile,
  removeSkillFromProfile,
  addEducationToProfile,
  addExperienceToProfile,
  getProfileCompletion,
  uploadResume,
  deleteCandidateProfile
};
