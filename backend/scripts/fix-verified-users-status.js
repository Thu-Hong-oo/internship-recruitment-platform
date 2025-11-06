/**
 * Migration Script: Fix Verified Users Status
 *
 * Purpose: Update users who have verified email but status is still PENDING_VERIFICATION
 * Sets status to ACTIVE for these users
 *
 * Usage: node scripts/fix-verified-users-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/infrastructure/models/User');
const UserStatus = require('../src/domain/identity/enums/UserStatus');

async function fixVerifiedUsersStatus() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find users with isEmailVerified=true but status=PENDING_VERIFICATION
    const affectedUsers = await User.find({
      isEmailVerified: true,
      status: UserStatus.PENDING_VERIFICATION,
    });

    console.log(`\nFound ${affectedUsers.length} users needing status update:`);

    if (affectedUsers.length === 0) {
      console.log(
        '✅ No users need status update. All verified users already have ACTIVE status.'
      );
      process.exit(0);
    }

    // Display affected users
    affectedUsers.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ${user.email} (${user.role}) - Created: ${
          user.createdAt
        }`
      );
    });

    // Update status to ACTIVE
    console.log(`\nUpdating status to ACTIVE...`);
    const result = await User.updateMany(
      {
        isEmailVerified: true,
        status: UserStatus.PENDING_VERIFICATION,
      },
      {
        $set: { status: UserStatus.ACTIVE },
      }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);

    // Verify the update
    const remainingPending = await User.countDocuments({
      isEmailVerified: true,
      status: UserStatus.PENDING_VERIFICATION,
    });

    if (remainingPending === 0) {
      console.log(
        `\n✅ Verification: All verified users now have ACTIVE status`
      );
    } else {
      console.warn(
        `\n⚠️  Warning: ${remainingPending} verified users still have PENDING status`
      );
    }

    // Display final stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(`\n📊 Final User Status Distribution:`);
    stats.forEach(stat => {
      console.log(
        `   - ${stat._id}: ${stat.count} users (${stat.verified} verified)`
      );
    });
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run migration
console.log('='.repeat(60));
console.log('📝 Migration: Fix Verified Users Status');
console.log('='.repeat(60));
fixVerifiedUsersStatus();
