const mongoose = require('mongoose');
const Company = require('../models/Company');
const Job = require('../models/Job');
const User = require('../models/User');
const { logger } = require('../utils/logger');
require('dotenv').config();

// Import sample data
const sampleCompanies = require('../data/sampleCompanies');
const sampleJobs = require('../data/sampleJobs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      logger.error('MONGO_URI environment variable is not set');
      logger.info('Please set MONGO_URI in your .env file or environment');
      logger.info('Example: MONGO_URI=mongodb://localhost:27017/internbridge');
      process.exit(1);
    }

    logger.info('Attempting to connect to MongoDB...');
    logger.info(`Connection string: ${process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      logger.error('MongoDB server is not accessible. Please check:');
      logger.error('1. MongoDB service is running');
      logger.error('2. MongoDB port is accessible (default: 27017)');
      logger.error('3. Network firewall settings');
    } else if (error.name === 'MongoParseError') {
      logger.error('Invalid MongoDB connection string. Please check MONGO_URI format');
    }
    
    process.exit(1);
  }
};

// Create admin user for posting jobs
const createAdminUser = async () => {
  try {
    const adminUser = await User.findOne({ email: 'admin@internbridge.com' });
    
    if (!adminUser) {
      const newAdminUser = await User.create({
        name: 'Admin User',
        email: 'admin@internbridge.com',
        password: 'admin123456',
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      logger.info('Admin user created successfully');
      return newAdminUser;
    }
    
    logger.info('Admin user already exists');
    return adminUser;
  } catch (error) {
    logger.error('Error creating admin user:', error.message);
    logger.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    // Check for specific validation errors
    if (error.name === 'ValidationError') {
      Object.keys(error.errors).forEach(key => {
        logger.error(`Validation error for ${key}:`, error.errors[key].message);
      });
    }
    
    throw error;
  }
};

// Seed companies
const seedCompanies = async () => {
  try {
    logger.info('Starting to seed companies...');
    
    // Clear existing companies
    await Company.deleteMany({});
    logger.info('Cleared existing companies');
    
    // Insert new companies
    const companies = await Company.insertMany(sampleCompanies);
    logger.info(`Successfully seeded ${companies.length} companies`);
    
    return companies;
  } catch (error) {
    logger.error('Error seeding companies:', error.message);
    throw error;
  }
};

// Seed jobs
const seedJobs = async (companies, adminUser) => {
  try {
    logger.info('Starting to seed jobs...');
    
    // Clear existing jobs
    await Job.deleteMany({});
    logger.info('Cleared existing jobs');
    
    // Map company names to company IDs
    const companyMap = {};
    companies.forEach(company => {
      companyMap[company.name] = company._id;
    });
    
    // Prepare jobs with company IDs
    const jobsWithCompanyIds = sampleJobs.map(job => {
      const companyId = companyMap[job.company];
      if (!companyId) {
        logger.warn(`Company not found for job: ${job.title} - ${job.company}`);
        return null;
      }
      
      return {
        ...job,
        companyId: companyId,
        postedBy: adminUser._id
      };
    }).filter(job => job !== null);
    
    // Insert jobs
    const jobs = await Job.insertMany(jobsWithCompanyIds);
    logger.info(`Successfully seeded ${jobs.length} jobs`);
    
    return jobs;
  } catch (error) {
    logger.error('Error seeding jobs:', error.message);
    throw error;
  }
};

// Update company stats
const updateCompanyStats = async (companies, jobs) => {
  try {
    logger.info('Updating company stats...');
    
    for (const company of companies) {
      const companyJobs = jobs.filter(job => job.companyId.toString() === company._id.toString());
      const activeInternships = companyJobs.filter(job => 
        job.status === 'active' && job.employmentType === 'internship'
      ).length;
      
      await Company.findByIdAndUpdate(company._id, {
        'stats.totalJobs': companyJobs.length,
        'stats.activeInternships': activeInternships
      });
    }
    
    logger.info('Company stats updated successfully');
  } catch (error) {
    logger.error('Error updating company stats:', error.message);
    throw error;
  }
};

// Main seeding function
const seedData = async () => {
  try {
    logger.info('Starting data seeding process...');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Seed companies
    const companies = await seedCompanies();
    
    // Seed jobs
    const jobs = await seedJobs(companies, adminUser);
    
    // Update company stats
    await updateCompanyStats(companies, jobs);
    
    logger.info('Data seeding completed successfully!');
    logger.info(`Created ${companies.length} companies`);
    logger.info(`Created ${jobs.length} jobs`);
    
    // Log statistics
    const internshipJobs = jobs.filter(job => job.employmentType === 'internship');
    const fullTimeJobs = jobs.filter(job => job.employmentType === 'full-time');
    const partTimeJobs = jobs.filter(job => job.employmentType === 'part-time');
    const contractJobs = jobs.filter(job => job.employmentType === 'contract');
    
    logger.info('Job Statistics:');
    logger.info(`- Internships: ${internshipJobs.length}`);
    logger.info(`- Full-time: ${fullTimeJobs.length}`);
    logger.info(`- Part-time: ${partTimeJobs.length}`);
    logger.info(`- Contract: ${contractJobs.length}`);
    
    // Log company statistics
    const vietnameseCompanies = companies.filter(company => company.location.country === 'Vietnam');
    const internationalCompanies = companies.filter(company => company.location.country !== 'Vietnam');
    
    logger.info('Company Statistics:');
    logger.info(`- Vietnamese companies: ${vietnameseCompanies.length}`);
    logger.info(`- International companies: ${internationalCompanies.length}`);
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
  } catch (error) {
    logger.error('Error in data seeding:', error.message);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
