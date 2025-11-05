const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const candidateRoutes = require('./candidate');
const employerRoutes = require('./employer');
const jobPostRoutes = require('./jobPost');
const applicationRoutes = require('./application');
const chatRoutes = require('./chat');
const notificationRoutes = require('./notification');
const roadmapRoutes = require('./roadmap');
const skillRoutes = require('./skill');
const adminRoutes = require('./admin');
// const aiRoutes = require('./ai');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Nền tảng Tuyển dụng Thông minh đang chạy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/employers', employerRoutes);
router.use('/jobs', jobPostRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/skills', skillRoutes);
router.use('/admin', adminRoutes);
// router.use('/ai', aiRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

module.exports = router;
