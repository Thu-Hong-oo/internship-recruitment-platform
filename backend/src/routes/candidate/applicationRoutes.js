const express = require('express');
const router = express.Router();
const ApplicationController = require('../../controllers/candidate/ApplicationController');

const applicationController = new ApplicationController();

// GET /api/candidates/me/applications - Get all applications for the current user
router.get('/', applicationController.getApplications);

// PATCH /api/candidates/me/applications/:id - Handle actions like withdrawing an application
router.patch('/:id', applicationController.updateApplication);

module.exports = router;
