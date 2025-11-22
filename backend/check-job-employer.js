const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkJobEmployer() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    require('./src/models/Job');
    require('./src/models/EmployerProfile');
    require('./src/models/User');
    
    const Job = require('./src/models/Job');
    const EmployerProfile = require('./src/models/EmployerProfile');
    const User = require('./src/models/User');

    const jobId = '69214a43e4f559f0b126acd2'; // Job ID từ latest application

    console.log('=== CHECKING JOB EMPLOYER ===\n');
    console.log(`Job ID: ${jobId}\n`);

    // Get job
    const job = await Job.findById(jobId);
    console.log('1. Job Info:');
    console.log(JSON.stringify({
      _id: job?._id,
      title: job?.title,
      employer: job?.employer,
      employerType: typeof job?.employer,
      employerIsObject: job?.employer instanceof mongoose.Types.ObjectId,
    }, null, 2));
    console.log('');

    if (!job) {
      console.log('❌ Job not found');
      process.exit(1);
    }

    // Extract employer ID
    const employerId = job.employer?._id || job.employer;
    console.log('2. Extracted Employer ID:');
    console.log(JSON.stringify({
      employerId: employerId?.toString(),
      employerIdType: typeof employerId,
      employerIdIsObject: employerId instanceof mongoose.Types.ObjectId,
    }, null, 2));
    console.log('');

    // Get employer profile
    const employerProfile = await EmployerProfile.findById(employerId);
    console.log('3. Employer Profile:');
    console.log(JSON.stringify({
      found: !!employerProfile,
      _id: employerProfile?._id?.toString(),
      owner: employerProfile?.owner?.toString(),
      hasOwner: !!employerProfile?.owner,
      companyName: employerProfile?.company?.name,
    }, null, 2));
    console.log('');

    if (!employerProfile) {
      console.log('❌ Employer profile not found');
      process.exit(1);
    }

    // Get employer user
    const employerUser = await User.findById(employerProfile.owner);
    console.log('4. Employer User:');
    console.log(JSON.stringify({
      found: !!employerUser,
      _id: employerUser?._id?.toString(),
      email: employerUser?.email,
      fullName: employerUser?.fullName,
    }, null, 2));
    console.log('');

    if (!employerUser) {
      console.log('❌ Employer user not found');
      process.exit(1);
    }

    console.log('✅ All checks passed! Notification should work.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkJobEmployer();

