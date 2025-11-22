const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testCreateNotification() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const NotificationService = require('./src/services/notificationService');
    const User = require('./src/models/User');

    const employerUserId = '68e0f9c2ccf6d6abf8529698';

    console.log('=== TEST CREATE NOTIFICATION ===\n');
    console.log(`Employer User ID: ${employerUserId}\n`);

    // Check user exists
    const employerUser = await User.findById(employerUserId);
    if (!employerUser) {
      console.log('❌ Employer user not found!');
      process.exit(1);
    }
    console.log(`✅ Found employer: ${employerUser.email}\n`);

    // Try to create notification
    console.log('Creating notification...');
    try {
      const notification = await NotificationService.notifyNewApplication(
        employerUserId,
        '69216c7a96bde024980826a7', // applicationId
        '69214a41e4f559f0b126acb7', // jobId
        'Test Candidate'
      );
      
      console.log('✅ Notification created successfully!');
      console.log(JSON.stringify({
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipient: notification.recipient,
        data: notification.data,
        createdAt: notification.createdAt,
      }, null, 2));
    } catch (error) {
      console.error('❌ Error creating notification:');
      console.error(error.message);
      console.error(error.stack);
    }

    // Check if notification exists in DB
    const Notification = require('./src/models/Notification');
    const notifications = await Notification.find({ recipient: employerUserId })
      .sort({ createdAt: -1 })
      .limit(1);
    
    console.log('\n=== CHECKING DB ===');
    console.log(`Notifications in DB: ${notifications.length}`);
    if (notifications.length > 0) {
      console.log('Latest notification:');
      console.log(JSON.stringify({
        _id: notifications[0]._id,
        type: notifications[0].type,
        title: notifications[0].title,
        recipient: notifications[0].recipient,
        createdAt: notifications[0].createdAt,
      }, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCreateNotification();

