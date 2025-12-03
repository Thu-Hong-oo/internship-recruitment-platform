require('dotenv').config();
const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');
const User = require('../src/models/User');

async function checkCandidateData() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const userId = '68da2e6362b86d4ab4daff7b';
    
    // Get user info
    const user = await User.findById(userId).lean();
    console.log('👤 USER INFO:');
    console.log(`   Email: ${user?.email}`);
    console.log(`   Name: ${user?.fullName}\n`);

    // Get candidate profile
    const profile = await CandidateProfile.findOne({ userId }).lean();
    
    if (!profile) {
      console.log('❌ No profile found for this user');
      return;
    }

    console.log('📊 PROFILE DATA:');
    console.log(`   Profile ID: ${profile._id}`);
    console.log(`   Created: ${profile.createdAt}\n`);

    // Check skills
    console.log('🔧 SKILLS:');
    if (profile.skills?.technical && profile.skills.technical.length > 0) {
      console.log('   Technical:');
      profile.skills.technical.forEach(skill => {
        console.log(`   - ${skill.name || skill} (${skill.level || 'N/A'})`);
      });
    } else {
      console.log('   ⚠️  No technical skills');
    }

    if (profile.skills?.soft && profile.skills.soft.length > 0) {
      console.log('   Soft:');
      profile.skills.soft.forEach(skill => {
        console.log(`   - ${skill.name || skill} (${skill.level || 'N/A'})`);
      });
    } else {
      console.log('   ⚠️  No soft skills');
    }
    console.log();

    // Check experience - THIS IS THE PROBLEM
    console.log('💼 EXPERIENCE:');
    if (profile.experience?.internships && profile.experience.internships.length > 0) {
      profile.experience.internships.forEach((exp, idx) => {
        console.log(`\n   Internship ${idx + 1}:`);
        console.log(`   - Position: ${exp.position || 'N/A'}`);
        console.log(`   - Company: ${exp.company || 'N/A'}`);
        console.log(`   - Start Date: ${exp.startDate} (${new Date(exp.startDate).toLocaleDateString()})`);
        console.log(`   - End Date: ${exp.endDate} (${new Date(exp.endDate).toLocaleDateString()})`);
        
        // Calculate years
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
        console.log(`   - Duration: ${Math.round(years * 10) / 10} years`);
        
        // Check if dates are valid
        if (start.toString() === 'Invalid Date') {
          console.log(`   ⚠️  INVALID START DATE: "${exp.startDate}"`);
        }
        if (exp.endDate && end.toString() === 'Invalid Date') {
          console.log(`   ⚠️  INVALID END DATE: "${exp.endDate}"`);
        }
        if (start > new Date()) {
          console.log(`   ⚠️  START DATE IN FUTURE!`);
        }
        if (years < 0) {
          console.log(`   ⚠️  NEGATIVE DURATION! End date before start date`);
        }
        if (years > 50) {
          console.log(`   🚨 SUSPICIOUS: Duration > 50 years (${years.toFixed(1)} years)`);
        }
      });
    } else {
      console.log('   ⚠️  No experience data');
    }
    console.log();

    // Check education
    console.log('🎓 EDUCATION:');
    if (profile.education?.university) {
      const uni = profile.education.university;
      console.log(`   University: ${uni.name || 'N/A'}`);
      console.log(`   Degree: ${uni.degree || 'N/A'}`);
      console.log(`   Major: ${uni.major || uni.field || 'N/A'}`);
      console.log(`   Graduation Year: ${uni.graduationYear || 'N/A'}`);
    } else {
      console.log('   ⚠️  No university data');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

checkCandidateData();
