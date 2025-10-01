// Xóa CV khỏi lịch sử
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const candidateProfileController = require('../controllers/candidateProfileController');

const router = express.Router();

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
