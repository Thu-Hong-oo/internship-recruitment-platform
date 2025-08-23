const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// TODO: Add analytics routes
// GET /api/analytics/dashboard - Get dashboard analytics
// GET /api/analytics/applications - Get application analytics
// GET /api/analytics/jobs - Get job analytics
// GET /api/analytics/users - Get user analytics

module.exports = router;
