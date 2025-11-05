/**
 * Database Migration Script: Fix Address Field Type Issue
 *
 * This script fixes the MongoDB error: "Cannot create field 'country' in element {address: ""}"
 * by converting string address fields to proper object format.
 */

const mongoose = require('mongoose');
const { Candidate } = require('../domains/identity');

class AddressMigrationService {
  /**
   * Fix all candidate profiles with corrupted address fields
   */
  static async fixAllCorruptedAddresses() {
    try {
      console.log('🔧 Starting address field migration...');

      // Find all profiles where address is a string (including empty strings)
      const corruptedProfiles = await Candidate.find({
        $or: [
          { 'personalInfo.address': { $type: 'string' } }, // All strings (including empty)
          { 'personalInfo.address': { $exists: false } }, // Missing address field
        ],
      });

      console.log(
        `📊 Found ${corruptedProfiles.length} profiles with problematic addresses`
      );

      let fixedCount = 0;
      let errorCount = 0;

      for (const profile of corruptedProfiles) {
        try {
          const addressField = profile.personalInfo?.address;

          // Handle different address field states
          if (typeof addressField === 'string') {
            if (addressField === '') {
              // Empty string - set to null to avoid MongoDB error
              console.log(
                `🔧 Converting empty string address to null for profile ${profile._id}`
              );
              profile.personalInfo.address = null;
            } else {
              // Non-empty string - convert to object
              console.log(
                `🔧 Converting string address "${addressField}" to object for profile ${profile._id}`
              );
              profile.personalInfo.address = {
                street: '',
                ward: '',
                district: '',
                city: addressField,
                country: 'Vietnam',
              };
            }
          } else if (!addressField) {
            // Undefined or null - set to null explicitly
            console.log(
              `🔧 Setting undefined address to null for profile ${profile._id}`
            );
            profile.personalInfo.address = null;
          }

          await profile.save();
          fixedCount++;

          console.log(`✅ Fixed profile ${profile._id}`);
        } catch (error) {
          errorCount++;
          console.error(
            `❌ Failed to fix profile ${profile._id}:`,
            error.message
          );

          // Try setting to null as fallback
          try {
            profile.personalInfo.address = null;
            await profile.save();
            console.log(
              `🆘 Set address to null for profile ${profile._id} as fallback`
            );
          } catch (fallbackError) {
            console.error(
              `💥 Even fallback failed for profile ${profile._id}:`,
              fallbackError.message
            );
          }
        }
      }

      console.log('🎉 Migration completed!');
      console.log(`✅ Fixed: ${fixedCount} profiles`);
      console.log(`❌ Errors: ${errorCount} profiles`);

      return { fixedCount, errorCount, totalFound: corruptedProfiles.length };
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }

  /**
   * Check for profiles with corrupted address fields
   */
  static async checkCorruptedAddresses() {
    try {
      const stringAddresses = await Candidate.countDocuments({
        'personalInfo.address': { $type: 'string', $ne: '' },
      });

      const emptyStringAddresses = await Candidate.countDocuments({
        'personalInfo.address': '',
      });

      const nullAddresses = await Candidate.countDocuments({
        'personalInfo.address': null,
      });

      const objectAddresses = await Candidate.countDocuments({
        'personalInfo.address': { $type: 'object' },
      });

      const missingAddresses = await Candidate.countDocuments({
        'personalInfo.address': { $exists: false },
      });

      const totalProfiles = await Candidate.countDocuments();

      const totalProblematic =
        stringAddresses + emptyStringAddresses + missingAddresses;

      console.log('📊 Address Field Analysis:');
      console.log(`Total profiles: ${totalProfiles}`);
      console.log(
        `Non-empty string addresses (need fixing): ${stringAddresses}`
      );
      console.log(
        `Empty string addresses (need fixing): ${emptyStringAddresses}`
      );
      console.log(`Missing address fields (need fixing): ${missingAddresses}`);
      console.log(`Total problematic: ${totalProblematic}`);
      console.log(`Object addresses (correct): ${objectAddresses}`);
      console.log(`Null addresses (correct): ${nullAddresses}`);

      return {
        total: totalProfiles,
        stringAddresses,
        objectAddresses,
        nullAddresses,
        emptyStringAddresses,
        missingAddresses,
        totalProblematic,
      };
    } catch (error) {
      console.error('💥 Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Validate address field format
   */
  static validateAddressFormat(address) {
    if (!address) return { valid: true, type: 'null' };

    if (typeof address === 'string') {
      return {
        valid: address === '',
        type: 'string',
        needsFix: address !== '',
      };
    }

    if (typeof address === 'object') {
      const hasValidFields = Object.keys(address).some(key =>
        ['street', 'ward', 'district', 'city', 'country'].includes(key)
      );
      return {
        valid: hasValidFields,
        type: 'object',
        needsFix: !hasValidFields,
      };
    }

    return { valid: false, type: typeof address, needsFix: true };
  }
}

module.exports = AddressMigrationService;
