const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkLatestNotifications() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Require all models first
    require('./src/models/Notification');
    require('./src/models/Application');
    require('./src/models/User');
    require('./src/models/CandidateProfile');
    require('./src/models/Job');
    require('./src/models/EmployerProfile');
    
    const Notification = require('./src/models/Notification');
    const Application = require('./src/models/Application');
    const User = require('./src/models/User');
    const CandidateProfile = require('./src/models/CandidateProfile');
    const Job = require('./src/models/Job');
    const EmployerProfile = require('./src/models/EmployerProfile');

    // Get latest application
    const latestApp = await Application.findOne()
      .sort({ createdAt: -1 })
      .populate('candidateId', 'userId')
      .populate('jobId', 'employer title');
    
    console.log('=== LATEST APPLICATION ===');
    console.log(JSON.stringify({
      _id: latestApp?._id,
      jobId: latestApp?.jobId?._id,
      jobTitle: latestApp?.jobId?.title,
      jobEmployer: latestApp?.jobId?.employer,
      candidateId: latestApp?.candidateId?._id,
      candidateUserId: latestApp?.candidateId?.userId,
      status: latestApp?.status,
      createdAt: latestApp?.createdAt,
    }, null, 2));
    console.log('');

    if (!latestApp) {
      console.log('❌ No applications found');
      process.exit(1);
    }

    // Get employer user ID
    const employerProfile = await EmployerProfile.findById(latestApp.jobId?.employer);
    const employerUserId = employerProfile?.owner;

    // Get candidate user ID
    const candidateUserId = latestApp.candidateId?.userId;

    console.log('=== USER IDs ===');
    console.log(`Employer User ID: ${employerUserId}`);
    console.log(`Candidate User ID: ${candidateUserId}`);
    console.log('');

    // Check notifications for employer
    if (employerUserId) {
      const employerNotifications = await Notification.find({ 
        recipient: employerUserId 
      })
        .sort({ createdAt: -1 })
        .limit(5);
      
      console.log('=== EMPLOYER NOTIFICATIONS ===');
      console.log(`Total: ${employerNotifications.length}`);
      employerNotifications.forEach((n, i) => {
        console.log(`\n${i + 1}. ${n.type} - ${n.title}`);
        console.log(`   Message: ${n.message}`);
        console.log(`   ApplicationId: ${n.data?.applicationId}`);
        console.log(`   Created: ${n.createdAt}`);
        console.log(`   Is for latest app: ${n.data?.applicationId?.toString() === latestApp._id.toString() ? '✅ YES' : '❌ NO'}`);
      });
    }

    // Check notifications for candidate
    if (candidateUserId) {
      const candidateNotifications = await Notification.find({ 
        recipient: candidateUserId 
      })
        .sort({ createdAt: -1 })
        .limit(5);
      
      console.log('\n=== CANDIDATE NOTIFICATIONS ===');
      console.log(`Total: ${candidateNotifications.length}`);
      candidateNotifications.forEach((n, i) => {
        console.log(`\n${i + 1}. ${n.type} - ${n.title}`);
        console.log(`   Message: ${n.message}`);
        console.log(`   ApplicationId: ${n.data?.applicationId}`);
        console.log(`   Created: ${n.createdAt}`);
        console.log(`   Is for latest app: ${n.data?.applicationId?.toString() === latestApp._id.toString() ? '✅ YES' : '❌ NO'}`);
      });
    }

    // Check all recent notifications
    const allRecent = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\n=== ALL RECENT NOTIFICATIONS (Last 10) ===');
    allRecent.forEach((n, i) => {
      console.log(`\n${i + 1}. ${n.type} - ${n.title}`);
      console.log(`   Recipient: ${n.recipient}`);
      console.log(`   ApplicationId: ${n.data?.applicationId}`);
      console.log(`   Created: ${n.createdAt}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLatestNotifications();

