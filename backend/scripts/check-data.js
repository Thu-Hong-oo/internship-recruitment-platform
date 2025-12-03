require('dotenv').config();
const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const profile = await CandidateProfile.findOne({ 
      userId: '68da2e6362b86d4ab4daff7b' 
    }).lean();
    
    console.log('Total internships:', profile.experience.internships.length);
    
    profile.experience.internships.forEach((exp, i) => {
      console.log(`\nInternship ${i+1}:`);
      console.log('  startDate:', exp.startDate, typeof exp.startDate);
      console.log('  endDate:', exp.endDate, typeof exp.endDate);
      console.log('  position:', exp.position?.substring(0, 50) || 'N/A');
      console.log('  company:', exp.company?.substring(0, 50) || 'N/A');
      
      // Check validity
      const invalidStart = !exp.startDate || 
                          exp.startDate === 'undefined' || 
                          isNaN(new Date(exp.startDate).getTime());
      const invalidEnd = exp.endDate && 
                        exp.endDate !== null && 
                        exp.endDate !== 'undefined' &&
                        isNaN(new Date(exp.endDate).getTime());
      
      if (invalidStart) console.log('  ❌ INVALID START DATE');
      if (invalidEnd) console.log('  ❌ INVALID END DATE');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
