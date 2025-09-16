const mongoose = require('mongoose');
const User = require('./src/models/User');
const { USER_STATUS } = require('./src/constants/common.constants');

/**
 * Migration script to update existing users with new status field
 * This script will:
 * 1. Set status field based on isActive field
 * 2. Set default status to 'active' for active users and 'inactive' for inactive users
 */

async function migrateUserStatus() {
  try {
    console.log('🚀 Starting user status migration...');

    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/internship-platform'
    );
    console.log('✅ Connected to MongoDB');

    // Get all users without status field or with null status
    const usersToUpdate = await User.find({
      $or: [{ status: { $exists: false } }, { status: null }],
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersToUpdate) {
      try {
        // Determine status based on isActive field
        let newStatus;
        if (user.isActive === true) {
          newStatus = USER_STATUS.ACTIVE;
        } else if (user.isActive === false) {
          newStatus = USER_STATUS.INACTIVE;
        } else {
          // Default to active if isActive is undefined
          newStatus = USER_STATUS.ACTIVE;
          user.isActive = true;
        }

        // Update the user
        user.status = newStatus;
        user.statusChangedAt = new Date();

        await user.save();
        updatedCount++;

        console.log(
          `✅ Updated user ${user.email}: isActive=${user.isActive} → status=${newStatus}`
        );
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`⚠️  Skipped (errors): ${skippedCount} users`);
    console.log(`📊 Total processed: ${usersToUpdate.length} users`);

    // Verify migration
    const statusCounts = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 Current status distribution:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} users`);
    });

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Check if this script is run directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();

  migrateUserStatus()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUserStatus;
