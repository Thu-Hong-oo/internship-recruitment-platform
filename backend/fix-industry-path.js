// Script to fix jobs with empty industryPath
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./src/models/Job');
const { buildIndustryPath } = require('./src/utils/jobHelpers');

async function fixIndustryPaths() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Find all jobs with empty industryPath but have industryCode or subIndustryCode
    const jobsToFix = await Job.find({
      $and: [
        {
          $or: [
            { industryPath: { $exists: false } },
            { industryPath: { $size: 0 } },
          ],
        },
        {
          $or: [
            { industryCode: { $exists: true, $ne: null } },
            { subIndustryCode: { $exists: true, $ne: null } },
          ],
        },
      ],
    });

    console.log(`📋 Found ${jobsToFix.length} jobs to fix`);

    let fixed = 0;
    let failed = 0;

    for (const job of jobsToFix) {
      try {
        const newPath = await buildIndustryPath(
          job.industryCode,
          job.subIndustryCode
        );

        if (newPath.length > 0) {
          job.industryPath = newPath;
          await job.save();
          console.log(`✅ Fixed job ${job._id}: ${job.title}`);
          console.log(`   industryCode: ${job.industryCode}, subIndustryCode: ${job.subIndustryCode}`);
          console.log(`   New industryPath: [${newPath.join(', ')}]`);
          fixed++;
        } else {
          console.log(`⚠️  Job ${job._id} has no valid industry path`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error fixing job ${job._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📋 Total: ${jobsToFix.length}`);

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndustryPaths();
