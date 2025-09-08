const mongoose = require('mongoose');
const Skill = require('./src/models/Skill');
const Company = require('./src/models/Company');
const Job = require('./src/models/Job');
const User = require('./src/models/User');
const Application = require('./src/models/Application');
require('dotenv').config();
const skills = require('./src/data/sampleSkills');
const companies = require('./src/data/sampleCompanies');
const jobs = require('./src/data/sampleJobs');

// Mapping skill names to their IDs
const skillNameToId = {};

async function seedSkills() {
  console.log('🌱 Seeding Skills...');

  let successCount = 0;

  for (const skillData of skills) {
    try {
      // Check if skill already exists
      const existingSkill = await Skill.findOne({
        name: skillData.name,
      }).maxTimeMS(30000);
      if (existingSkill) {
        skillNameToId[skillData.name] = existingSkill._id;
        console.log(`⏭️ Skill already exists: ${skillData.name}`);
        successCount++;
        continue;
      }

      const skill = new Skill(skillData);
      await skill.save({ maxTimeMS: 30000 });
      skillNameToId[skillData.name] = skill._id;
      console.log(`✅ Created skill: ${skillData.name}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Error creating skill ${skillData.name}:`, error.message);
    }
  }

  console.log(`✅ Seeded ${successCount}/${skills.length} skills`);
}

async function seedCompanies() {
  console.log('🏢 Seeding Companies...');

  // Create a default user for companies
  let defaultUser = await User.findOne({
    email: 'admin@internship.com',
  }).maxTimeMS(30000);
  if (!defaultUser) {
    try {
      defaultUser = new User({
        email: 'admin@internship.com',
        password: 'admin123',
        role: 'employer',
        isVerified: true,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+84 123 456 789',
        },
      });
      await defaultUser.save({ maxTimeMS: 30000 });
      console.log('✅ Created admin user');
    } catch (error) {
      console.log('❌ Error creating admin user:', error.message);
      return [];
    }
  }

  const companyIds = [];
  let successCount = 0;

  for (const companyData of companies) {
    try {
      // Check if company already exists
      const existingCompany = await Company.findOne({
        name: companyData.name,
      }).maxTimeMS(30000);
      if (existingCompany) {
        companyIds.push(existingCompany._id);
        console.log(`⏭️ Company already exists: ${companyData.name}`);
        successCount++;
        continue;
      }

      const company = new Company({
        ...companyData,
        createdBy: defaultUser._id,
      });
      await company.save({ maxTimeMS: 30000 });
      companyIds.push(company._id);
      console.log(`✅ Created company: ${companyData.name}`);
      successCount++;
    } catch (error) {
      console.log(
        `❌ Error creating company ${companyData.name}:`,
        error.message
      );
    }
  }

  console.log(`✅ Seeded ${successCount}/${companies.length} companies`);
  return companyIds;
}

async function seedJobs(companyIds) {
  console.log('💼 Seeding Jobs...');

  if (companyIds.length === 0) {
    console.log('❌ No companies available for job seeding');
    return;
  }

  // Map company names to their IDs
  const companyNameToId = {};
  try {
    const companyDocs = await Company.find({}).maxTimeMS(30000);
    companyDocs.forEach(company => {
      companyNameToId[company.name] = company._id;
    });
  } catch (error) {
    console.log('❌ Error fetching companies:', error.message);
    return;
  }

  // Get default user
  const defaultUser = await User.findOne({
    email: 'admin@internship.com',
  }).maxTimeMS(30000);
  if (!defaultUser) {
    console.log('❌ Admin user not found');
    return;
  }

  let jobCount = 0;

  for (const jobData of jobs) {
    try {
      // Check if job already exists
      const existingJob = await Job.findOne({ title: jobData.title }).maxTimeMS(
        30000
      );
      if (existingJob) {
        console.log(`⏭️ Job already exists: ${jobData.title}`);
        jobCount++;
        continue;
      }

      // Map skills to their IDs
      const mappedSkills = jobData.requirements.skills.map(skill => {
        const skillName = skill.name || jobData.aiAnalysis.skillsExtracted[skill.importance - 1];
        return {
          ...skill,
          skillId: skillNameToId[skillName],
        };
      }).filter(skill => skill.skillId); // Only include skills that have valid IDs

      // Find company by name pattern
      let companyId = companyIds[0]; // Default to first company
      if (
        jobData.title.includes('Frontend') ||
        jobData.title.includes('Backend')
      ) {
        companyId = companyNameToId['FPT Software'];
      } else if (jobData.title.includes('UI/UX')) {
        companyId = companyNameToId['VNG Corporation'];
      } else if (jobData.title.includes('Data')) {
        companyId = companyNameToId['Grab Vietnam'];
      } else if (jobData.title.includes('Digital Marketing')) {
        companyId = companyNameToId['Tiki'];
      }

      const job = new Job({
        ...jobData,
        companyId: companyId,
        postedBy: defaultUser._id,
        'requirements.skills': mappedSkills,
      });

      await job.save({ maxTimeMS: 30000 });
      jobCount++;
      console.log(`✅ Created job: ${jobData.title}`);
    } catch (error) {
      console.log(`❌ Error creating job ${jobData.title}:`, error.message);
    }
  }

  console.log(`✅ Seeded ${jobCount}/${jobs.length} jobs`);
}

async function updateCompanyStats() {
  console.log('📊 Updating company statistics...');

  try {
    const companies = await Company.find({}).maxTimeMS(30000);
    let successCount = 0;

    for (const company of companies) {
      try {
        await company.updateStats();
        console.log(`✅ Updated stats for: ${company.name}`);
        successCount++;
      } catch (error) {
        console.log(
          `❌ Error updating stats for ${company.name}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Updated stats for ${successCount}/${companies.length} companies`
    );
  } catch (error) {
    console.log('❌ Error fetching companies for stats update:', error.message);
  }
}

async function seedAllData() {
  try {
    console.log('🚀 Starting data seeding...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    try {
      await Promise.all([
        Job.deleteMany({}).maxTimeMS(30000),
        Company.deleteMany({}).maxTimeMS(30000),
        Skill.deleteMany({}).maxTimeMS(30000),
      ]);
      console.log('✅ Cleared existing data');
    } catch (clearError) {
      console.log(
        '⚠️ Warning: Could not clear existing data:',
        clearError.message
      );
      console.log('Continuing with seeding...');
    }

    // Seed data in order
    await seedSkills();
    const companyIds = await seedCompanies();
    await seedJobs(companyIds);
    await updateCompanyStats();

    console.log('🎉 Data seeding completed successfully!');

    // Print summary
    const skillCount = await Skill.countDocuments();
    const companyCount = await Company.countDocuments();
    const jobCount = await Job.countDocuments();

    console.log('\n📈 Seeding Summary:');
    console.log(`- Skills: ${skillCount}`);
    console.log(`- Companies: ${companyCount}`);
    console.log(`- Jobs: ${jobCount}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose
    .connect(
      process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/internship-platform',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 60000,
        maxPoolSize: 10,
        minPoolSize: 5,
      }
    )
    .then(() => {
      console.log('📦 Connected to MongoDB');
      return seedAllData();
    })
    .catch(error => {
      console.error('❌ MongoDB connection error:', error);
    });
}

module.exports = {
  seedSkills,
  seedCompanies,
  seedJobs,
  seedAllData,
};
