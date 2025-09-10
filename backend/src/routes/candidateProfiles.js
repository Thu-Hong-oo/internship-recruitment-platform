const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/candidateProfileController');

const router = express.Router();

// All routes are protected for candidates only
router.get('/', protect, authorize('candidate'), getCandidateProfile);
router.get('/completion', protect, authorize('candidate'), getProfileCompletion);
router.post('/', protect, authorize('candidate'), createCandidateProfile);
router.put('/', protect, authorize('candidate'), updateCandidateProfile);
router.delete('/', protect, authorize('candidate'), deleteCandidateProfile);

// Skill management
router.post('/skills', protect, authorize('candidate'), addSkillToProfile);
router.delete('/skills/:skillId', protect, authorize('candidate'), removeSkillFromProfile);

// Education management
router.post('/education', protect, authorize('candidate'), addEducationToProfile);

// Experience management
router.post('/experience', protect, authorize('candidate'), addExperienceToProfile);

// Resume management
router.post('/resume', protect, authorize('candidate'), uploadResume);

module.exports = router;
