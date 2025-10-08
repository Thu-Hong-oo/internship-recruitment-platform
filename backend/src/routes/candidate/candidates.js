const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

// Import CV Builder routes
const cvBuilderRoutes = require('../candidate/cvBuilderRoutes');
const profileRoutes = require('./profileRoutes');
const resumeRoutes = require('./resumeRoutes');
const applicationRoutes = require('./applicationRoutes');
const savedJobRoutes = require('./savedJobRoutes');
const companyRoutes = require('./companyRoutes');
const jobRoutes = require('./jobRoutes');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// ============================================
// CV BUILDER ROUTES
// ============================================
router.use('/me/cv-builder', cvBuilderRoutes);
router.use('/me/profile', profileRoutes);
router.use('/me/resume', resumeRoutes);
router.use('/me/applications', applicationRoutes);
router.use('/me/saved-jobs', savedJobRoutes);
router.use('/me/followed-companies', companyRoutes);
router.use('/jobs', jobRoutes); // For searching and viewing jobs

module.exports = router;
