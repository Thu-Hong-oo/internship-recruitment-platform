/**
 * Find Candidate User ID
 * 
 * Usage: node scripts/find-candidate.js [email]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const CandidateProfile = require('../src/models/CandidateProfile');

async function findCandidate(email) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    let query = { role: 'intern' };
    if (email) {
      query.email = new RegExp(email, 'i');
    }

    const candidates = await User.find(query)
      .select('_id email fullName role createdAt')
      .lean();

    if (candidates.length === 0) {
      console.log('❌ No candidates found');
      if (email) {
        console.log(`\nTried searching for email containing: "${email}"`);
      }
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Found ${candidates.length} candidate(s):\n`);

    for (const candidate of candidates) {
      console.log(`👤 Name: ${candidate.fullName || 'N/A'}`);
      console.log(`📧 Email: ${candidate.email}`);
      console.log(`🆔 User ID: ${candidate._id}`);
      console.log(`📅 Created: ${candidate.createdAt.toLocaleDateString()}`);

      // Check if has profile
      const profile = await CandidateProfile.findOne({ userId: candidate._id });
      if (profile) {
        const skillsCount = [
          ...(profile.skills?.technical || []),
          ...(profile.skills?.soft || []),
          ...(profile.skills?.languages || [])
        ].length;
        console.log(`✅ Has profile (${skillsCount} skills)`);
      } else {
        console.log(`⚠️  No profile yet`);
      }
      console.log('');
    }

    console.log('💡 To calculate job matches:');
    console.log(`   node scripts/calculate-candidate-job-matches.js ${candidates[0]._id}`);
    console.log('\n✅ Disconnected from MongoDB');
    
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const email = process.argv[2];
findCandidate(email);
