const express = require('express');
const router = express.Router();
const ProfileController = require('../../controllers/candidate/ProfileController');
const { apiRateLimit } = require('../../middleware/globalRateLimit');

const profileController = new ProfileController();

// GET /api/candidates/me/profile - Get full profile
router.get('/', profileController.getProfile);

// PATCH /api/candidates/me/profile - Update profile sections (personalInfo, preferences, etc.)
router.patch('/', apiRateLimit, profileController.updateProfile);

// GET /api/candidates/me/profile/:section - Get a specific section like 'education' or 'experience'
router.get('/:section', profileController.getSection);

// POST /api/candidates/me/profile/:section - Add an item to a section (e.g., add a new experience)
router.post('/:section', apiRateLimit, profileController.addToSection);

// PATCH /api/candidates/me/profile/:section/:id - Update a specific item in a section
router.patch('/:section/:id', profileController.updateSectionEntry);

// DELETE /api/candidates/me/profile/:section/:id - Delete a specific item from a section
router.delete('/:section/:id', profileController.deleteSectionEntry);

module.exports = router;
