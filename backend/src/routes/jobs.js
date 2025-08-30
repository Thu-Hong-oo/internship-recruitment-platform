const express = require('express');


const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// TODO: Add job routes
// GET /api/jobs - Get all jobs
// GET /api/jobs/:id - Get single job
// POST /api/jobs - Create job (employer only)
// PUT /api/jobs/:id - Update job (employer only)
// DELETE /api/jobs/:id - Delete job (employer only)

module.exports = router;

