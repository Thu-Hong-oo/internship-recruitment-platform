const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');

async function cleanDuplicateSkills() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internbridge';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const candidateId = '68da2e6362b86d4ab4daff7b';
    const profileId = '68da2e6362b86d4ab4daff7d';

    // Get profile by _id (not userId)
    const profile = await CandidateProfile.findById(profileId);
    
    if (!profile) {
      console.log('❌ Profile not found!');
      process.exit(1);
    }

    console.log('\n📊 Current Skills:');
    console.log(`   - Technical: ${profile.skills.technical?.length || 0}`);
    console.log(`   - Soft: ${profile.skills.soft?.length || 0}`);
    console.log(`   - Languages: ${profile.skills.languages?.length || 0}`);

    // Clean up: Remove all skills that are duplicated
    const softSkillNames = new Set([
      'kỹ năng giao tiếp',
      'kỹ năng làm việc nhóm',
      'kỹ năng kiểm tra',
      'kỹ năng quản lý',
      'kỹ năng lưu trữ hồ sơ',
      'kỹ năng quản lý thời gian',
      'kỹ năng kiểm tra, quản lý, lưu trữ hồ sơ',
      'communication',
      'teamwork',
      'time management',
      'problem solving',
      'leadership'
    ]);

    // Remove soft skills from technical array
    const originalTechnicalCount = profile.skills.technical?.length || 0;
    profile.skills.technical = (profile.skills.technical || []).filter(skill => {
      const name = skill.name.toLowerCase().trim();
      return !softSkillNames.has(name);
    });

    const removedCount = originalTechnicalCount - profile.skills.technical.length;

    console.log(`\n🧹 Cleaning Results:`);
    console.log(`   - Removed ${removedCount} soft skills from technical array`);
    console.log(`   - Remaining technical skills: ${profile.skills.technical.length}`);

    // Also clean experience (empty arrays)
    profile.experience.internships = [];
    profile.experience.projects = [];

    console.log('\n✅ Cleaned experience arrays (ready for re-parsing)');

    // Save
    await profile.save();
    console.log('\n💾 Profile updated successfully!');

    console.log('\n📋 New Skills Structure:');
    console.log(`   - Technical: ${profile.skills.technical?.length || 0}`);
    console.log(`   - Soft: ${profile.skills.soft?.length || 0}`);
    console.log(`   - Languages: ${profile.skills.languages?.length || 0}`);

    console.log('\n✅ Now re-upload your CV to re-parse with correct classification!');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDuplicateSkills();
