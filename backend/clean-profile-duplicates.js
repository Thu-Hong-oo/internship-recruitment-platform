/**
 * Clean Profile Duplicates Script
 * 
 * Fixes:
 * 1. Remove soft skills from technical array
 * 2. Remove corrupted experience entries
 * 3. Remove duplicate certifications
 */

const mongoose = require('mongoose');
const CandidateProfile = require('./src/models/CandidateProfile');

async function cleanProfile() {
  try {
    await mongoose.connect('mongodb://localhost:27017/internbridge');
    console.log('✅ Connected to MongoDB');

    // Find profile by ID from user request
    const profile = await CandidateProfile.findById('68da2e6362b86d4ab4daff7d');

    if (!profile) {
      console.log('❌ Profile not found');
      process.exit(1);
    }
    
    console.log(`✅ Found profile: ${profile.personalInfo.fullName} (${profile._id})`)

    console.log('\n📋 BEFORE CLEANUP:');
    console.log(`Technical skills: ${profile.skills.technical.length}`);
    console.log(`Soft skills: ${profile.skills.soft.length}`);
    console.log(`Experience entries: ${profile.experience.internships.length}`);
    console.log(`Certifications: ${profile.certifications.length}`);

    // STEP 1: Remove soft skills from technical array
    const softSkillNames = new Set(
      profile.skills.soft.map(s => s.name.toLowerCase().trim())
    );

    const technicalBefore = profile.skills.technical.length;
    profile.skills.technical = profile.skills.technical.filter(skill => {
      const isNotSoftSkill = !softSkillNames.has(skill.name.toLowerCase().trim());
      if (!isNotSoftSkill) {
        console.log(`🗑️  Removed "${skill.name}" from technical (exists in soft)`);
      }
      return isNotSoftSkill;
    });
    
    console.log(`\n✅ Removed ${technicalBefore - profile.skills.technical.length} duplicate skills from technical`);

    // STEP 2: Remove corrupted experience (contains "Đỗ" or "Ngô" artifacts)
    const experienceBefore = profile.experience.internships.length;
    profile.experience.internships = profile.experience.internships.filter(exp => {
      const isCorrupted = exp.company.includes('Đỗ') || 
                         exp.company.includes('Ngô') ||
                         exp.company.includes('Mail.com');
      
      if (isCorrupted) {
        console.log(`🗑️  Removed corrupted experience: ${exp.company.substring(0, 50)}...`);
      }
      
      return !isCorrupted;
    });

    console.log(`✅ Removed ${experienceBefore - profile.experience.internships.length} corrupted experience entries`);

    // STEP 3: Remove duplicate certifications (keep only unique names)
    const uniqueCerts = new Map();
    profile.certifications.forEach(cert => {
      const key = cert.name.toLowerCase().trim();
      if (!uniqueCerts.has(key)) {
        uniqueCerts.set(key, cert);
      }
    });

    const certsBefore = profile.certifications.length;
    profile.certifications = Array.from(uniqueCerts.values());
    
    // Also clean education.certifications
    const uniqueEduCerts = new Map();
    (profile.education.certifications || []).forEach(cert => {
      const key = cert.name.toLowerCase().trim();
      if (!uniqueEduCerts.has(key)) {
        uniqueEduCerts.set(key, cert);
      }
    });
    
    profile.education.certifications = Array.from(uniqueEduCerts.values());

    console.log(`✅ Removed ${certsBefore - profile.certifications.length} duplicate certifications`);

    // Save changes
    await profile.save();

    console.log('\n📋 AFTER CLEANUP:');
    console.log(`Technical skills: ${profile.skills.technical.length}`);
    console.log(`Soft skills: ${profile.skills.soft.length}`);
    console.log(`Experience entries: ${profile.experience.internships.length}`);
    console.log(`Certifications: ${profile.certifications.length}`);

    console.log('\n✅ Profile cleaned successfully!');
    console.log('\n📌 Next steps:');
    console.log('1. Upload CV again to test new auto-fill logic');
    console.log('2. Verify skills stay in correct categories');
    console.log('3. Verify experience replaces instead of appends');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanProfile();
