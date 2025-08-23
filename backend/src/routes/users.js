const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.use(authorize('admin'));

// TODO: Add user management routes
// GET /api/users - Get all users
// GET /api/users/:id - Get single user
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user

module.exports = router;
