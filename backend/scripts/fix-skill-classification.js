const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');

async function fixSkillClassification() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internbridge';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const profileId = '68da2e6362b86d4ab4daff7d';

    // Get profile
    const profile = await CandidateProfile.findById(profileId);
    
    if (!profile) {
      console.log('❌ Profile not found!');
      process.exit(1);
    }

    console.log('\n📊 BEFORE Fix:');
    console.log(`   - Technical: ${profile.skills.technical?.length || 0} skills`);
    console.log(`   - Soft: ${profile.skills.soft?.length || 0} skills`);
    console.log(`   - Languages: ${profile.skills.languages?.length || 0} skills`);

    // Soft skill keywords to identify
    const softSkillKeywords = [
      'kỹ năng giao tiếp',
      'kỹ năng làm việc nhóm',
      'kỹ năng kiểm tra',
      'kỹ năng quản lý',
      'kỹ năng lưu trữ',
      'kỹ năng quản lý thời gian',
      'communication',
      'teamwork',
      'time management',
      'problem solving',
      'leadership',
      'organization',
      'planning'
    ];

    // Get unique soft skills (remove duplicates)
    const softSkillsMap = new Map();
    (profile.skills.soft || []).forEach(skill => {
      const name = skill.name.toLowerCase().trim();
      if (!softSkillsMap.has(name)) {
        softSkillsMap.set(name, skill);
      }
    });

    // Remove soft skills from technical array and keep only real technical skills
    const pureTechnicalSkills = [];
    const movedToSoft = [];

    (profile.skills.technical || []).forEach(skill => {
      const name = skill.name.toLowerCase().trim();
      
      // Check if it's a soft skill
      const isSoftSkill = softSkillKeywords.some(keyword => name.includes(keyword));
      
      if (isSoftSkill) {
        // Move to soft if not already there
        if (!softSkillsMap.has(name)) {
          softSkillsMap.set(name, {
            name: skill.name,
            level: skill.level || 'intermediate',
            verified: false,
            endorsements: 0
          });
          movedToSoft.push(skill.name);
        }
      } else {
        // Keep as technical
        pureTechnicalSkills.push(skill);
      }
    });

    // Update profile
    profile.skills.soft = Array.from(softSkillsMap.values());
    profile.skills.technical = pureTechnicalSkills;

    console.log('\n🔄 Classification Results:');
    console.log(`   - Moved to soft: ${movedToSoft.length} skills`);
    movedToSoft.forEach(name => console.log(`      • ${name}`));
    console.log(`   - Kept as technical: ${pureTechnicalSkills.length} skills`);
    pureTechnicalSkills.forEach(skill => console.log(`      • ${skill.name}`));

    // Save
    await profile.save();

    console.log('\n📊 AFTER Fix:');
    console.log(`   - Technical: ${profile.skills.technical?.length || 0} skills`);
    console.log(`   - Soft: ${profile.skills.soft?.length || 0} skills`);
    console.log(`   - Languages: ${profile.skills.languages?.length || 0} skills`);

    console.log('\n✅ Skills classification fixed successfully!');
    console.log('\n💡 Recommendation: Restart your server to apply code fixes for future uploads');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSkillClassification();
