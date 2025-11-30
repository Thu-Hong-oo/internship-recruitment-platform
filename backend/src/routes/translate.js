const express = require('express');
const router = express.Router();

const translationController = require('../controllers/translationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', translationController.translateText);

module.exports = router;







