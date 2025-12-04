/**
 * 🧪 Debug Learning Roadmap RAG API Issue
 * 
 * Test why learning-roadmap-rag returns "Unable to identify skill gaps"
 * Usage: node scripts/debug-roadmap-rag.js <candidateId> [jobId]
 */

const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');
const Job = require('../src/models/Job');
const CVMatchingScore = require('../src/models/CVMatchingScore');
const { logger } = require('../src/utils/logger');

async function debugRoadmapRag() {
  try {
    // Get candidateId from command line
    const candidateId = process.argv[2] || '68da2e6362b86d4ab4daff7b';
    const jobId = process.argv[3];

    logger.info('🔍 Debugging Learning Roadmap RAG API');
    logger.info(`   Candidate ID: ${candidateId}`);
    logger.info(`   Job ID: ${jobId || 'Not provided'}\n`);

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform';
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB\n');

    // 1. Check Candidate Profile
    logger.info('1️⃣ Checking Candidate Profile...');
    const candidateProfile = await CandidateProfile.findOne({ userId: candidateId });
    
    if (!candidateProfile) {
      logger.error('❌ Candidate profile not found!');
      logger.info('\n💡 Solution: Create profile first at POST /api/candidate-profile');
      process.exit(1);
    }

    logger.info('✅ Candidate profile found');
    
    // Check profile completeness
    const hasTechnicalSkills = candidateProfile.skills?.technical?.length > 0;
    const hasSoftSkills = candidateProfile.skills?.soft?.length > 0;
    const hasExperience = candidateProfile.experience?.internships?.length > 0 || 
                         candidateProfile.workExperience?.length > 0;
    const hasEducation = candidateProfile.education?.university?.name;

    logger.info('\n   Profile Completeness:');
    logger.info(`   ${hasTechnicalSkills ? '✅' : '❌'} Technical Skills: ${candidateProfile.skills?.technical?.length || 0}`);
    logger.info(`   ${hasSoftSkills ? '✅' : '⚠️'} Soft Skills: ${candidateProfile.skills?.soft?.length || 0}`);
    logger.info(`   ${hasExperience ? '✅' : '⚠️'} Experience: ${(candidateProfile.experience?.internships?.length || 0) + (candidateProfile.workExperience?.length || 0)}`);
    logger.info(`   ${hasEducation ? '✅' : '⚠️'} Education: ${hasEducation ? 'Yes' : 'No'}`);

    if (hasTechnicalSkills) {
      logger.info('\n   Current Skills:');
      candidateProfile.skills.technical.slice(0, 5).forEach(skill => {
        logger.info(`      - ${skill.name || skill}`);
      });
      if (candidateProfile.skills.technical.length > 5) {
        logger.info(`      ... and ${candidateProfile.skills.technical.length - 5} more`);
      }
    }

    // 2. Check if jobId provided
    if (jobId) {
      logger.info('\n2️⃣ Checking Job...');
      const job = await Job.findById(jobId);
      
      if (!job) {
        logger.error('❌ Job not found!');
        logger.info('\n💡 Solution: Use valid jobId or omit it and provide targetRole');
        process.exit(1);
      }

      logger.info('✅ Job found');
      logger.info(`   Title: ${job.title}`);
      logger.info(`   Required Skills: ${job.skills.length}`);
      
      if (job.skills.length > 0) {
        logger.info('\n   Required Skills:');
        job.skills.slice(0, 5).forEach(skill => {
          logger.info(`      - ${skill.name || skill}`);
        });
        if (job.skills.length > 5) {
          logger.info(`      ... and ${job.skills.length - 5} more`);
        }
      }

      // 3. Check if matching score exists
      logger.info('\n3️⃣ Checking Matching Score...');
      const matchingScore = await CVMatchingScore.findOne({
        candidateId,
        jobId,
      });

      if (matchingScore) {
        logger.info('✅ Matching score found');
        logger.info(`   Overall Score: ${matchingScore.overallScore}`);
        logger.info(`   Missing Skills: ${matchingScore.skillGapAnalysis?.missingSkills?.length || 0}`);
        
        if (matchingScore.skillGapAnalysis?.missingSkills?.length > 0) {
          logger.info('\n   Missing Skills from Matching Score:');
          matchingScore.skillGapAnalysis.missingSkills.slice(0, 5).forEach(skill => {
            logger.info(`      - ${skill.name || skill.skill || skill} (${skill.importance || 'N/A'})`);
          });
        }
      } else {
        logger.warn('⚠️ No matching score found - API will auto-calculate');
      }

      // 4. Test skill gap analysis
      logger.info('\n4️⃣ Testing Skill Gap Analysis...');
      const { getSelfSufficientAIService } = require('../src/services/ai/selfSufficientAIService');
      const aiService = getSelfSufficientAIService();

      const skillGapResult = await aiService.analyzeSkillGaps(
        candidateProfile,
        job
      );

      logger.info(`✅ Skill gap analysis completed`);
      logger.info(`   Missing Skills: ${skillGapResult.missingSkills.length}`);
      logger.info(`   Strong Skills: ${skillGapResult.strongSkills.length}`);
      logger.info(`   Match Rate: ${skillGapResult._stats.matchRate}%`);

      if (skillGapResult.missingSkills.length > 0) {
        logger.info('\n   Missing Skills:');
        skillGapResult.missingSkills.slice(0, 5).forEach(skill => {
          logger.info(`      - ${skill.name} (${skill.category}, ${skill.importance})`);
        });
      } else {
        logger.warn('   ⚠️ No missing skills found - perfect match or profile incomplete');
      }

    } else {
      logger.warn('\n2️⃣ No jobId provided - checking if targetRole can work...');
      
      // Check if profile has targetJob
      const hasTargetJob = candidateProfile.targetJob?.title;
      logger.info(`   ${hasTargetJob ? '✅' : '❌'} Target Job in profile: ${hasTargetJob ? candidateProfile.targetJob.title : 'None'}`);
    }

    // 5. Generate test request
    logger.info('\n' + '='.repeat(70));
    logger.info('📝 Test Request Examples:\n');

    if (jobId) {
      logger.info('Option 1: With jobId (Recommended)');
      logger.info('POST /api/nlp/learning-roadmap-rag');
      logger.info('Body:');
      logger.info(JSON.stringify({
        candidateId: candidateId,
        jobId: jobId,
        timeframe: 12
      }, null, 2));
    }

    logger.info('\nOption 2: With targetRole only');
    logger.info('POST /api/nlp/learning-roadmap-rag');
    logger.info('Body:');
    logger.info(JSON.stringify({
      candidateId: candidateId,
      targetRole: 'Frontend Developer', // Change to desired role
      timeframe: 12
    }, null, 2));

    logger.info('\nOption 3: With both');
    logger.info('POST /api/nlp/learning-roadmap-rag');
    logger.info('Body:');
    logger.info(JSON.stringify({
      candidateId: candidateId,
      targetJobId: jobId || '677b5a0ed3eff8fc71a6f654',
      targetRole: 'Frontend Developer',
      timeframe: 12
    }, null, 2));

    // 6. Final recommendation
    logger.info('\n' + '='.repeat(70));
    logger.info('💡 Recommendations:\n');

    if (!hasTechnicalSkills) {
      logger.error('❌ CRITICAL: No technical skills in profile!');
      logger.info('   Action: Add skills to profile via PATCH /api/candidate-profile');
      logger.info('   Example: { "skills": { "technical": ["React", "JavaScript", "Node.js"] } }');
    } else if (!jobId && !candidateProfile.targetJob?.title) {
      logger.warn('⚠️ WARNING: No jobId and no target job in profile');
      logger.info('   Action: Either provide jobId or targetRole in request body');
    } else {
      logger.info('✅ Profile looks good! API should work.');
      logger.info('   If still failing, check request body format above.');
    }

    logger.info('\n' + '='.repeat(70));

    process.exit(0);

  } catch (error) {
    logger.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run debug
debugRoadmapRag();
