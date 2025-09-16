// Admin Controllers Index
// Centralized exports for all admin controllers

const userController = require('./userController');
const analyticsController = require('./analyticsController');
const employerController = require('./employerController');
const companyController = require('./companyController');
const verificationController = require('./verificationController');
const jobController = require('./jobController');
const systemController = require('./systemController');

module.exports = {
  // User Management
  ...userController,

  // Analytics & Dashboard
  ...analyticsController,

  // Employer Management
  ...employerController,

  // Company Management
  ...companyController,

  // Verification Management
  ...verificationController,

  // Job Moderation
  ...jobController,

  // System Management
  ...systemController,
};
