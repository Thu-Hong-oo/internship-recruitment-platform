#!/usr/bin/env node

/**
 * Address Migration Script
 * Usage: node scripts/fixAddressFields.js
 */

const mongoose = require('mongoose');
const AddressMigrationService = require('../src/services/addressMigrationService');
require('dotenv').config();

async function runMigration() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform'
    );
    console.log('✅ Connected to MongoDB');

    // Check current state
    console.log('\n📊 Analyzing current address field state...');
    const analysis = await AddressMigrationService.checkCorruptedAddresses();

    if (analysis.totalProblematic === 0) {
      console.log('🎉 No corrupted address fields found. Database is clean!');
      process.exit(0);
    }

    // Ask for confirmation
    console.log(
      `\n⚠️  Found ${analysis.totalProblematic} profiles that need fixing.`
    );
    console.log(`  - Non-empty strings: ${analysis.stringAddresses}`);
    console.log(`  - Empty strings: ${analysis.emptyStringAddresses}`);
    console.log(`  - Missing fields: ${analysis.missingAddresses}`);
    console.log('This will convert/fix addresses to proper format.');

    // In production, you might want to add a confirmation prompt here
    const shouldProceed =
      process.argv.includes('--force') || process.env.NODE_ENV !== 'production';

    if (!shouldProceed) {
      console.log(
        '❌ Migration cancelled. Add --force flag to proceed in production.'
      );
      process.exit(1);
    }

    // Run migration
    console.log('\n🚀 Starting migration...');
    const result = await AddressMigrationService.fixAllCorruptedAddresses();

    console.log('\n📈 Migration Results:');
    console.log(
      `✅ Successfully fixed: ${result.fixedCount}/${result.totalFound} profiles`
    );

    if (result.errorCount > 0) {
      console.log(`❌ Errors encountered: ${result.errorCount} profiles`);
      console.log('Check logs above for details.');
    }

    // Verify results
    console.log('\n🔍 Verifying migration results...');
    const postAnalysis =
      await AddressMigrationService.checkCorruptedAddresses();

    if (postAnalysis.totalProblematic === 0) {
      console.log(
        '🎉 Migration successful! All address fields are now properly formatted.'
      );
    } else {
      console.log(
        `⚠️  ${postAnalysis.totalProblematic} profiles still need fixing. Check error logs.`
      );
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', error => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the migration
runMigration();
