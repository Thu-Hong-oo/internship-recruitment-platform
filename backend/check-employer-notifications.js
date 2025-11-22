const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkNotifications() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found. Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const Notification = require('./src/models/Notification');
    const User = require('./src/models/User');
    const EmployerProfile = require('./src/models/EmployerProfile');
    const Job = require('./src/models/Job');
    const Application = require('./src/models/Application');

    const employerUserId = '68e0f9c2ccf6d6abf8529698';

    console.log('=== CHECKING NOTIFICATIONS FOR EMPLOYER ===\n');
    console.log(`Employer User ID: ${employerUserId}\n`);

    // 1. Check User
    const employerUser = await User.findById(employerUserId);
    console.log('1. Employer User:');
    console.log(JSON.stringify({
      _id: employerUser?._id,
      email: employerUser?.email,
      fullName: employerUser?.fullName,
      role: employerUser?.role,
    }, null, 2));
    console.log('');

    if (!employerUser) {
      console.log('❌ Employer user not found!');
      process.exit(1);
    }

    // 2. Check EmployerProfile
    const employerProfile = await EmployerProfile.findOne({ owner: employerUserId });
    console.log('2. Employer Profile:');
    console.log(JSON.stringify({
      _id: employerProfile?._id,
      owner: employerProfile?.owner,
      companyName: employerProfile?.company?.name,
    }, null, 2));
    console.log('');

    // 3. Check All Notifications for this employer
    const allNotifications = await Notification.find({ recipient: employerUserId })
      .sort({ createdAt: -1 });
    
    console.log('3. All Notifications:');
    console.log(`Total: ${allNotifications.length}`);
    console.log(`Unread: ${allNotifications.filter(n => !n.isRead).length}`);
    console.log('');

    if (allNotifications.length > 0) {
      console.log('Recent notifications:');
      allNotifications.slice(0, 5).forEach((n, i) => {
        console.log(`\n${i + 1}. ${n.type}`);
        console.log(`   Title: ${n.title}`);
        console.log(`   Message: ${n.message}`);
        console.log(`   Recipient: ${n.recipient}`);
        console.log(`   Created: ${n.createdAt}`);
        console.log(`   Read: ${n.isRead}`);
        console.log(`   Data:`, JSON.stringify(n.data, null, 2));
      });
    } else {
      console.log('⚠️  No notifications found for this employer');
    }

    // 4. Check Recent Applications
    const recentApplications = await Application.find()
      .populate('jobId', 'employer title')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n4. Recent Applications:');
    recentApplications.forEach((app, i) => {
      const jobEmployerId = app.jobId?.employer?._id || app.jobId?.employer;
      const isForThisEmployer = jobEmployerId?.toString() === employerProfile?._id?.toString();
      console.log(`\n${i + 1}. Application ${app._id}`);
      console.log(`   Job: ${app.jobId?.title || 'N/A'}`);
      console.log(`   Job Employer: ${jobEmployerId}`);
      console.log(`   Is for this employer: ${isForThisEmployer ? '✅ YES' : '❌ NO'}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Created: ${app.createdAt}`);
    });

    // 5. Check for NEW_APPLICATION notifications
    const newAppNotifications = await Notification.find({
      recipient: employerUserId,
      type: 'NEW_APPLICATION',
    }).sort({ createdAt: -1 });
    
    console.log('\n5. NEW_APPLICATION Notifications:');
    console.log(`Found: ${newAppNotifications.length}`);
    newAppNotifications.forEach((n, i) => {
      console.log(`\n${i + 1}. Notification ${n._id}`);
      console.log(`   Title: ${n.title}`);
      console.log(`   ApplicationId: ${n.data?.applicationId}`);
      console.log(`   JobId: ${n.data?.jobId}`);
      console.log(`   Created: ${n.createdAt}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNotifications();

