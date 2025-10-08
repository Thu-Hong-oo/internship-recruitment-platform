const express = require('express');
const router = express.Router();
const CompanyController = require('../../controllers/candidate/CompanyController');

const companyController = new CompanyController();

// GET /api/candidates/me/followed-companies - Get list of followed companies
router.get('/', companyController.getCompanies);

// POST /api/candidates/me/followed-companies/:id/action - Follow or unfollow a company
router.post('/:id/action', companyController.handleCompanyAction);

module.exports = router;
