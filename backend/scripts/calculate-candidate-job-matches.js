/**
 * Calculate Job Matching Scores for a Candidate
 * 
 * This script calculates matching scores between a candidate's profile
 * and all active jobs, storing results in CVMatchingScore collection.
 * 
 * Usage: node scripts/calculate-candidate-job-matches.js <candidateUserId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const CandidateProfile = require('../src/models/CandidateProfile');
const CVMatchingScore = require('../src/models/CVMatchingScore');
const aiService = require('../src/services/ai/aiService');

async function calculateMatchingScores(candidateUserId) {
  try {
    console.log('🚀 Starting matching score calculation...');
    console.log(`📋 Candidate User ID: ${candidateUserId}\n`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Fetch candidate profile
    const candidateProfile = await CandidateProfile.findOne({ 
      userId: candidateUserId 
    }).populate('userId', 'fullName email');

    if (!candidateProfile) {
      console.error('❌ Candidate profile not found');
      process.exit(1);
    }

    console.log(`👤 Candidate: ${candidateProfile.userId?.fullName || 'Unknown'}`);
    console.log(`📧 Email: ${candidateProfile.userId?.email || 'Unknown'}\n`);

    // 2. Build cvData from candidate profile
    const profileSkills = candidateProfile.skills || {};
    const allSkills = [
      ...(profileSkills.technical || []),
      ...(profileSkills.soft || []),
      ...(profileSkills.languages || [])
    ];

    const profileExperience = candidateProfile.experience || {};
    const allExperience = [
      ...(profileExperience.internships || []),
      ...(profileExperience.fullTime || []),
      ...(profileExperience.projects || [])
    ];

    const cvData = {
      personalInfo: candidateProfile.personalInfo || {},
      education: candidateProfile.education || {},
      experience: allExperience,
      skills: allSkills,
      resume: candidateProfile.resume?.current,
      extractedText: candidateProfile.resume?.current?.aiAnalysis?.extractedData || {},
    };

    console.log(`💼 Profile Summary:`);
    console.log(`   - Technical Skills: ${profileSkills.technical?.length || 0}`);
    console.log(`   - Soft Skills: ${profileSkills.soft?.length || 0}`);
    console.log(`   - Languages: ${profileSkills.languages?.length || 0}`);
    console.log(`   - Experience Items: ${allExperience.length}`);
    console.log(`   - Education: ${candidateProfile.education?.university?.length || 0} institutions\n`);

    // 3. Fetch all active jobs
    const activeJobs = await Job.find({ status: 'active' })
      .populate('skills')
      .populate('employerId', 'companyName')
      .lean();

    console.log(`🎯 Found ${activeJobs.length} active jobs\n`);

    if (activeJobs.length === 0) {
      console.log('⚠️  No active jobs found. Please create some jobs first.');
      await mongoose.disconnect();
      return;
    }

    // 4. Calculate matching scores for each job
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    console.log('⚡ Calculating matching scores...\n');

    for (let i = 0; i < activeJobs.length; i++) {
      const job = activeJobs[i];
      const jobNumber = i + 1;

      try {
        console.log(`📝 [${jobNumber}/${activeJobs.length}] ${job.title}`);
        console.log(`   Company: ${job.employerId?.companyName || 'Unknown'}`);
        console.log(`   Location: ${job.location?.city || 'Unknown'}`);

        // Prepare job data
        const jobData = {
          _id: job._id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          industryCode: job.industryCode,
          location: job.location,
          salaryRange: job.salaryRange,
          employmentType: job.employmentType,
        };

        // Calculate matching score
        const matchingResult = await aiService.calculateCVJobMatch({
          cvData,
          jobData,
          candidateId: candidateUserId,
        });

        // Delete existing score if any
        await CVMatchingScore.deleteMany({
          candidateId: candidateUserId,
          jobId: job._id,
        });

        // Save new score
        await CVMatchingScore.create(matchingResult);

        console.log(`   ✅ Score: ${matchingResult.overallScore}%`);
        console.log(`   - Skills: ${matchingResult.breakdown.skills.score}%`);
        console.log(`   - Experience: ${matchingResult.breakdown.experience.score}%`);
        console.log(`   - Education: ${matchingResult.breakdown.education.score}%\n`);

        successCount++;
        results.push({
          jobId: job._id,
          title: job.title,
          score: matchingResult.overallScore,
        });

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    // 5. Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CALCULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully calculated: ${successCount} jobs`);
    console.log(`❌ Failed: ${errorCount} jobs`);
    console.log(`📈 Total: ${activeJobs.length} jobs\n`);

    // Sort by score and display top matches
    results.sort((a, b) => b.score - a.score);
    
    console.log('🏆 TOP 10 MATCHES:');
    results.slice(0, 10).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title} - ${result.score}%`);
    });

    console.log('\n✅ Disconnected from MongoDB');
    await mongoose.disconnect();

    console.log('\n🎉 Script completed successfully!');
    console.log(`\n💡 You can now query: GET /api/nlp/best-matches`);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get candidateUserId from command line
const candidateUserId = process.argv[2];

if (!candidateUserId) {
  console.error('❌ Error: Candidate User ID is required');
  console.log('\nUsage: node scripts/calculate-candidate-job-matches.js <candidateUserId>');
  console.log('\nExample:');
  console.log('  node scripts/calculate-candidate-job-matches.js 6742fee0c77f89f20c35e62f');
  process.exit(1);
}

calculateMatchingScores(candidateUserId);
