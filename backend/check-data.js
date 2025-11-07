const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const EmployerProfile = require('./src/infrastructure/models/EmployerProfile');
    const Company = require('./src/infrastructure/models/Company');

    const employer = await EmployerProfile.findOne({
      owner: '690d1b3c3b1c4c6933714c98',
    });
    console.log('Employer profile:', {
      _id: employer?._id,
      owner: employer?.owner,
      company: employer?.company,
      createdAt: employer?.createdAt,
    });

    // Check all companies for this owner
    const companies = await Company.find({ owner: '690d1b3c3b1c4c6933714c98' });
    console.log(
      'Companies for this owner:',
      companies.map(c => ({
        _id: c._id,
        name: c.name,
        companyId: c.companyId,
      }))
    );

    if (employer?.company) {
      const company = await Company.findById(employer.company);
      console.log('Company:', {
        _id: company?._id,
        name: company?.name,
        companyId: company?.companyId,
      });
    } else {
      console.log('No company reference in employer profile');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
