const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugNotification() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const Job = require('./src/models/Job');
    const EmployerProfile = require('./src/models/EmployerProfile');
    const User = require('./src/models/User');
    const Notification = require('./src/models/Notification');
    const Application = require('./src/models/Application');

    const jobId = '69214a41e4f559f0b126acb7';
    const applicationId = '69216c7a96bde024980826a7';

    console.log('\n=== DEBUG NOTIFICATION ===\n');

    // 1. Check Job
    const job = await Job.findById(jobId);
    console.log('1. Job Info:');
    console.log(JSON.stringify({
      _id: job?._id,
      title: job?.title,
      employer: job?.employer,
      employerType: typeof job?.employer,
    }, null, 2));

    if (!job || !job.employer) {
      console.log('❌ Job không tồn tại hoặc không có employer');
      process.exit(1);
    }

    // 2. Check EmployerProfile
    const employerId = job.employer._id || job.employer;
    const employerProfile = await EmployerProfile.findById(employerId);
    console.log('\n2. EmployerProfile Info:');
    console.log(JSON.stringify({
      _id: employerProfile?._id,
      owner: employerProfile?.owner,
      hasOwner: !!employerProfile?.owner,
      companyName: employerProfile?.company?.name,
    }, null, 2));

    if (!employerProfile) {
      console.log('❌ EmployerProfile không tồn tại');
      process.exit(1);
    }

    if (!employerProfile.owner) {
      console.log('❌ EmployerProfile không có owner');
      process.exit(1);
    }

    // 3. Check Employer User
    const employerUser = await User.findById(employerProfile.owner);
    console.log('\n3. Employer User Info:');
    console.log(JSON.stringify({
      _id: employerUser?._id,
      email: employerUser?.email,
      fullName: employerUser?.fullName,
      role: employerUser?.role,
    }, null, 2));

    if (!employerUser) {
      console.log('❌ Employer User không tồn tại');
      process.exit(1);
    }

    // 4. Check Notifications
    const notifications = await Notification.find({ 
      recipient: employerUser._id 
    })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\n4. Recent Notifications for Employer:');
    console.log(`Total: ${await Notification.countDocuments({ recipient: employerUser._id })}`);
    console.log(`Unread: ${await Notification.countDocuments({ recipient: employerUser._id, isRead: false })}`);
    console.log('\nRecent notifications:');
    notifications.forEach(n => {
      console.log(JSON.stringify({
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        recipient: n.recipient,
        data: n.data,
        createdAt: n.createdAt,
        isRead: n.isRead,
      }, null, 2));
    });

    // 5. Check Application
    const application = await Application.findById(applicationId);
    console.log('\n5. Application Info:');
    console.log(JSON.stringify({
      _id: application?._id,
      jobId: application?.jobId,
      candidateId: application?.candidateId,
      status: application?.status,
      createdAt: application?.createdAt,
    }, null, 2));

    // 6. Check for NEW_APPLICATION notifications
    const newAppNotifications = await Notification.find({
      recipient: employerUser._id,
      type: 'NEW_APPLICATION',
      'data.applicationId': applicationId,
    });
    console.log('\n6. NEW_APPLICATION Notifications for this application:');
    console.log(`Found: ${newAppNotifications.length}`);
    newAppNotifications.forEach(n => {
      console.log(JSON.stringify({
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        createdAt: n.createdAt,
      }, null, 2));
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugNotification();

