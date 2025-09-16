const express = require('express');
const { handleEmailBounce, handleEmailDelivery, validateEmailManually } = require('../controllers/emailWebhookController');

const router = express.Router();

// Middleware to allow CORS for frontend calls
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

router.post('/email-bounce', handleEmailBounce);
router.post('/email-delivery', handleEmailDelivery);
router.post('/validate-email', validateEmailManually);

module.exports = router;
