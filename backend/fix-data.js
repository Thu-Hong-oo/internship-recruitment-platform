const mongoose = require('mongoose');
require('dotenv').config();

async function fixData() {
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

    // Find company by owner
    const company = await Company.findOne({
      owner: '690d1b3c3b1c4c6933714c98',
    });
    console.log('Company by owner:', {
      _id: company?._id,
      name: company?.name,
      companyId: company?.companyId,
      owner: company?.owner,
    });

    // Fix companyId if missing
    if (company && !company.companyId) {
      console.log('Adding companyId to company...');
      const companyId = `COMP_${Date.now()}_${company.owner
        .toString()
        .slice(-6)}`;
      company.companyId = companyId;
      await company.save();
      console.log(`Updated company with companyId: ${companyId}`);
    }

    if (employer && company && !employer.company) {
      console.log('Updating employer profile with company reference...');
      employer.company = company._id;
      await employer.save();
      console.log('Updated successfully');

      // Verify
      const updatedEmployer = await EmployerProfile.findById(
        employer._id
      ).populate('company');
      console.log('Updated employer with populated company:', {
        _id: updatedEmployer._id,
        company: updatedEmployer.company
          ? {
              _id: updatedEmployer.company._id,
              name: updatedEmployer.company.name,
            }
          : null,
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixData();
