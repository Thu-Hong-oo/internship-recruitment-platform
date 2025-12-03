require('dotenv').config();
const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');
const User = require('../src/models/User');

async function cleanupInvalidExperiences() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all profiles with experiences
    const profiles = await CandidateProfile.find({
      'experience.internships': { $exists: true, $ne: [] }
    });

    console.log(`📊 Found ${profiles.length} profiles with experience data\n`);

    let totalCleaned = 0;
    let profilesUpdated = 0;

    for (const profile of profiles) {
      const originalCount = profile.experience.internships.length;
      
      // Filter out invalid internships
      const validInternships = profile.experience.internships.filter(exp => {
        // Check if startDate is invalid
        const invalidStartDate = 
          !exp.startDate || 
          exp.startDate === 'undefined' || 
          exp.startDate === 'null' ||
          exp.startDate === null ||
          typeof exp.startDate === 'string' && exp.startDate.trim() === '' ||
          isNaN(new Date(exp.startDate).getTime());

        // Keep only if startDate is valid
        const isValid = !invalidStartDate;
        
        if (!isValid) {
          console.log(`   ❌ Removing invalid internship: startDate="${exp.startDate}", position="${exp.position}", company="${exp.company}"`);
        }
        
        return isValid;
      });

      const removedCount = originalCount - validInternships.length;

      if (removedCount > 0) {
        profile.experience.internships = validInternships;
        await profile.save();
        
        const user = await User.findById(profile.userId).select('email');
        console.log(`🧹 [${profilesUpdated + 1}] Cleaned ${removedCount} invalid internship(s) for ${user?.email || profile.userId}`);
        console.log(`   Before: ${originalCount} internships`);
        console.log(`   After: ${validInternships.length} internships\n`);
        
        totalCleaned += removedCount;
        profilesUpdated++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Profiles scanned: ${profiles.length}`);
    console.log(`   Profiles updated: ${profilesUpdated}`);
    console.log(`   Total invalid internships removed: ${totalCleaned}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

cleanupInvalidExperiences();
