// Debug script to find jobs in Ha Noi and check their data
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./src/models/Job');
const EmployerProfile = require('./src/models/EmployerProfile'); // Required for populate
const Skill = require('./src/models/Skill'); // Required for populate
const { createFlexibleRegex } = require('./src/utils/textUtils');

async function debugHanoiJobs() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');

    // Search for jobs with "Ha Noi" or "Hà Nội" (flexible)
    const locationRegex = createFlexibleRegex('Ha Noi');
    
    const query = {
      status: { $in: ['open', 'active'] },
      $or: [
        { location: locationRegex },
        { 'address.city': locationRegex },
        { 'address.district': locationRegex },
        { 'address.fullAddress': locationRegex }
      ]
    };

    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    console.log('');

    const jobs = await Job.find(query)
      .populate('employer', 'company.name company.logo')
      .populate('skillIds', 'name category')
      .lean();

    console.log(`📋 Found ${jobs.length} jobs in Ha Noi\n`);

    jobs.forEach((job, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Job #${index + 1}: ${job.title}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`ID: ${job._id}`);
      console.log(`Status: ${job.status}`);
      console.log(`\n📍 Location Data:`);
      console.log(`   location (legacy): ${job.location || 'null'}`);
      console.log(`   address.street: ${job.address?.street || 'null'}`);
      console.log(`   address.ward: ${job.address?.ward || 'null'}`);
      console.log(`   address.district: ${job.address?.district || 'null'}`);
      console.log(`   address.city: ${job.address?.city || 'null'}`);
      console.log(`   address.country: ${job.address?.country || 'null'}`);
      console.log(`   address.fullAddress: ${job.address?.fullAddress || 'null'}`);
      
      console.log(`\n🏢 Employer Data:`);
      console.log(`   employer._id: ${job.employer?._id || 'null'}`);
      console.log(`   employer.company: ${job.employer?.company ? 'EXISTS' : 'NULL'}`);
      console.log(`   employer.company.name: ${job.employer?.company?.name || 'null'}`);
      console.log(`   employer.company.logo type: ${typeof job.employer?.company?.logo}`);
      console.log(`   employer.company.logo:`, JSON.stringify(job.employer?.company?.logo, null, 2));
      
      console.log(`\n🏭 Industry Data:`);
      console.log(`   industryCode: ${job.industryCode || 'null'}`);
      console.log(`   subIndustryCode: ${job.subIndustryCode || 'null'}`);
      console.log(`   industryPath: [${(job.industryPath || []).join(', ')}]`);
      
      console.log(`\n💼 Skills Data:`);
      console.log(`   skills (array): [${(job.skills || []).join(', ')}]`);
      console.log(`   skillIds: ${job.skillIds ? `${job.skillIds.length} populated` : 'null'}`);
      
      console.log(`\n📊 Other Fields:`);
      console.log(`   title: ${job.title ? 'EXISTS' : 'NULL'}`);
      console.log(`   slug: ${job.slug || 'null'}`);
      console.log(`   description: ${job.description ? `${job.description.substring(0, 50)}...` : 'NULL'}`);
      console.log(`   jobType: ${job.jobType || 'null'}`);
      console.log(`   level: ${job.level || 'null'}`);
      console.log(`   salaryMin: ${job.salaryMin || 'null'}`);
      console.log(`   salaryMax: ${job.salaryMax || 'null'}`);
      
      // Check for any null/undefined critical fields
      const criticalFields = {
        _id: job._id,
        title: job.title,
        employer: job.employer,
        'employer._id': job.employer?._id,
      };
      
      const missingFields = Object.entries(criticalFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingFields.length > 0) {
        console.log(`\n❌ MISSING CRITICAL FIELDS: ${missingFields.join(', ')}`);
      } else {
        console.log(`\n✅ All critical fields present`);
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n📊 Summary: ${jobs.length} jobs found`);

    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugHanoiJobs();
