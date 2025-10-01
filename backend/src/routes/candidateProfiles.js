// Xóa CV khỏi lịch sử
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const candidateProfileController = require('../controllers/candidateProfileController');

const router = express.Router();

// =============== ROUTES CHO CANDIDATE TỰ QUẢN LÝ (ME) ===============
// Lấy hồ sơ của chính mình
router.get(
  '/me',
  protect,
  authorize('candidate'),
  candidateProfileController.getProfile
);

// Cập nhật hồ sơ của chính mình
router.put(
  '/me',
  protect,
  authorize('candidate'),
  candidateProfileController.updateProfile
);

// Upload CV cho chính mình
router.post(
  '/me/cv',
  protect,
  authorize('candidate'),
  upload.single('cv'),
  candidateProfileController.uploadCV
);

// Lấy kết quả phân tích CV của chính mình
router.get(
  '/me/cv/analysis',
  protect,
  authorize('candidate'),
  candidateProfileController.getCVAnalysis
);

// Xem CV của chính mình trực tiếp (inline)
router.get(
  '/me/cv/view',
  protect,
  authorize('candidate'),
  candidateProfileController.viewCurrentCV
);

// Xem history CV của chính mình trực tiếp (inline) theo index
router.get(
  '/me/cv/view/:cvIndex',
  protect,
  authorize('candidate'),
  candidateProfileController.viewHistoryCV
);

// Đặt CV trong lịch sử làm CV hiện tại
router.put(
  '/me/cv/current/:cvIndex',
  protect,
  authorize('candidate'),
  candidateProfileController.setCurrentCV
);

// Đổi tên CV (current hoặc history)
router.put(
  '/me/cv/rename',
  protect,
  authorize('candidate'),
  candidateProfileController.renameCV
);

// Xóa CV khỏi lịch sử của chính mình
router.delete(
  '/me/cv/:cvIndex',
  protect,
  authorize('candidate'),
  candidateProfileController.deleteCV
);

// Cập nhật kinh nghiệm của chính mình
router.put(
  '/me/experience',
  protect,
  authorize('candidate'),
  candidateProfileController.updateExperience
);

// Cập nhật học vấn của chính mình
router.put(
  '/me/education',
  protect,
  authorize('candidate'),
  candidateProfileController.updateEducation
);

// Cập nhật preferences của chính mình
router.put(
  '/me/preferences',
  protect,
  authorize('candidate'),
  candidateProfileController.updatePreferences
);

// Lấy tiến độ hoàn thiện hồ sơ của chính mình
router.get(
  '/me/progress',
  protect,
  authorize('candidate'),
  candidateProfileController.getProgress
);

// Xác thực kỹ năng của chính mình
router.put(
  '/me/skills/verify',
  protect,
  authorize('candidate'),
  candidateProfileController.verifySkill
);

// Lấy analytics của chính mình
router.get(
  '/me/analytics',
  protect,
  authorize('candidate'),
  candidateProfileController.getAnalytics
);

// =============== ROUTES CHO ADMIN/EMPLOYER XEM PROFILE KHÁC ===============

// Lấy hồ sơ ứng viên
router.get(
  '/:userId',
  protect,
  authorize('candidate'),
  candidateProfileController.getProfile
);
// Cập nhật hồ sơ ứng viên
router.put(
  '/:userId',
  protect,
  authorize('candidate'),
  candidateProfileController.updateProfile
);
// Upload CV
router.post(
  '/:userId/cv',
  protect,
  authorize('candidate'),
  upload.single('cv'),
  candidateProfileController.uploadCV
);
// Lấy kết quả phân tích CV
router.get(
  '/:userId/cv/analysis',
  protect,
  authorize('candidate'),
  candidateProfileController.getCVAnalysis
);
// Xem CV trực tiếp (inline)
router.get(
  '/:userId/cv/view',
  protect,
  authorize('candidate'),
  candidateProfileController.viewCurrentCV
);

// Đặt CV trong lịch sử làm CV hiện tại (by userId)
router.put(
  '/:userId/cv/current/:cvIndex',
  protect,
  authorize('candidate'),
  candidateProfileController.setCurrentCV
);

// Đổi tên CV (by userId)
router.put(
  '/:userId/cv/rename',
  protect,
  authorize('candidate'),
  candidateProfileController.renameCV
);
// Xác thực kỹ năng
router.put(
  '/:userId/skills/verify',
  protect,
  authorize('candidate'),
  candidateProfileController.verifySkill
);
// Tăng lượt xem profile
router.post('/:userId/view', candidateProfileController.incrementViews);
// Lấy analytics
router.get(
  '/:userId/analytics',
  protect,
  authorize('candidate'),
  candidateProfileController.getAnalytics
);
// Cập nhật kinh nghiệm
router.put(
  '/:userId/experience',
  protect,
  authorize('candidate'),
  candidateProfileController.updateExperience
);
// Cập nhật học vấn
router.put(
  '/:userId/education',
  protect,
  authorize('candidate'),
  candidateProfileController.updateEducation
);
// Cập nhật preferences
router.put(
  '/:userId/preferences',
  protect,
  authorize('candidate'),
  candidateProfileController.updatePreferences
);
// Lấy tiến độ hoàn thiện hồ sơ
router.get(
  '/:userId/progress',
  protect,
  authorize('candidate'),
  candidateProfileController.getProgress
);

router.delete(
  '/:userId/cv/:cvIndex',
  protect,
  authorize('candidate'),
  candidateProfileController.deleteCV
);

module.exports = router;
