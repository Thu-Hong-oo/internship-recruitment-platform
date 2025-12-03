/**
 * Calculate matching scores for existing applications
 * Run this script to populate CVMatchingScore for applications created before auto-calculation was implemented
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('../src/models/Application');
const CandidateProfile = require('../src/models/CandidateProfile');
const Job = require('../src/models/Job');
const User = require('../src/models/User');
const CVMatchingScore = require('../src/models/CVMatchingScore');
const aiService = require('../src/services/ai/aiService');
const { logger } = require('../src/utils/logger');

async function calculateExistingScores() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Find all applications
    const applications = await Application.find({})
      .populate('jobId')
      .populate('candidateId')
      .lean();

    console.log(`📊 Found ${applications.length} applications`);

    let processed = 0;
    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const application of applications) {
      processed++;
      
      try {
        if (!application.jobId || !application.candidateId) {
          console.log(`⚠️  [${processed}/${applications.length}] Skipping - missing job or candidate`);
          skipped++;
          continue;
        }

        // Get userId from candidateProfile
        const candidateProfileId = application.candidateId._id || application.candidateId;
        const candidateProfile = await CandidateProfile.findById(candidateProfileId).populate('userId').lean();
        
        if (!candidateProfile || !candidateProfile.userId) {
          console.log(`⚠️  [${processed}/${applications.length}] Skipping - no profile or userId`);
          skipped++;
          continue;
        }

        // Check if score already exists
        const existingScore = await CVMatchingScore.findOne({
          jobId: application.jobId._id,
          candidateId: candidateProfile.userId._id,
        });

        if (existingScore) {
          console.log(`⏭️  [${processed}/${applications.length}] Skipping - score already exists for ${candidateProfile.userId.email}`);
          skipped++;
          continue;
        }

        // Convert profile to cvData
        const cvData = {
          skills: [],
          experience: [],
          education: [],
          currentLevel: 'beginner',
        };

        // Technical skills
        if (candidateProfile.skills?.technical && Array.isArray(candidateProfile.skills.technical)) {
          cvData.skills.push(...candidateProfile.skills.technical.map(skill => ({
            name: skill.name || skill,
            level: skill.level || 'beginner',
          })));
        }

        // Soft skills
        if (candidateProfile.skills?.soft && Array.isArray(candidateProfile.skills.soft)) {
          cvData.skills.push(...candidateProfile.skills.soft.map(skill => ({
            name: skill.name || skill,
            level: skill.level || 'beginner',
          })));
        }

        // Experience
        if (candidateProfile.experience?.internships && Array.isArray(candidateProfile.experience.internships)) {
          cvData.experience.push(...candidateProfile.experience.internships.map(exp => ({
            position: exp.position || '',
            company: exp.company || '',
            startDate: exp.startDate || null,
            endDate: exp.endDate || null,
            description: exp.description || '',
          })));
        }

        // Education
        if (candidateProfile.education?.university && candidateProfile.education.university.name) {
          cvData.education.push({
            degree: candidateProfile.education.university.degree,
            major: candidateProfile.education.university.major || candidateProfile.education.university.field,
            school: candidateProfile.education.university.name,
            graduationYear: candidateProfile.education.university.graduationYear,
          });
        }

        // Calculate level
        if (cvData.experience.length > 0) {
          const totalYears = cvData.experience.reduce((total, exp) => {
            // Validate dates
            if (!exp.startDate || exp.startDate === 'undefined' || exp.startDate === 'null') {
              return total;
            }

            const start = new Date(exp.startDate);
            if (isNaN(start.getTime())) {
              return total;
            }

            // Handle endDate - if null/undefined, use current date
            let end;
            if (!exp.endDate || exp.endDate === 'undefined' || exp.endDate === 'null' || exp.endDate === null) {
              end = new Date();
            } else {
              end = new Date(exp.endDate);
              if (isNaN(end.getTime())) {
                end = new Date();
              }
            }

            // Sanity checks
            const now = new Date();
            if (start > now || end < start) {
              return total;
            }

            const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
            
            // Cap at 50 years to prevent data errors
            if (years > 50) {
              return total + 50;
            }

            return total + Math.max(0, years);
          }, 0);

          if (totalYears >= 5) cvData.currentLevel = 'expert';
          else if (totalYears >= 3) cvData.currentLevel = 'advanced';
          else if (totalYears >= 1) cvData.currentLevel = 'intermediate';
        }

        // Calculate matching score
        const result = await aiService.calculateAdvancedMatchScore(cvData, application.jobId, {
          candidateId: candidateProfile.userId._id,
          jobId: application.jobId._id,
          saveToDatabase: true,
        });

        console.log(`✅ [${processed}/${applications.length}] Calculated score ${result.overallScore} for ${candidateProfile.userId.email} -> Job: ${application.jobId.title}`);
        success++;

        // Add delay to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ [${processed}/${applications.length}] Failed:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total applications: ${applications.length}`);
    console.log(`   ✅ Successfully calculated: ${success}`);
    console.log(`   ⏭️  Skipped (already exists or missing data): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
calculateExistingScores();
