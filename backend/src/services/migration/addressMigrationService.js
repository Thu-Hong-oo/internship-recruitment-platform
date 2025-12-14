/**
 * Database Migration Script: Fix Address Field Type Issue
 *
 * This script fixes the MongoDB error: "Cannot create field 'country' in element {address: ""}"
 * by converting string address fields to proper object format.
 */

const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const { logger } = require('../../utils/logger');

class AddressMigrationService {
  /**
   * Fix all candidate profiles with corrupted address fields
   */
  static async fixAllCorruptedAddresses() {
    try {
      logger.info('🔧 Starting address field migration...');

      // Find all profiles where address is a string (including empty strings)
      const corruptedProfiles = await CandidateProfile.find({
        $or: [
          { 'personalInfo.address': { $type: 'string' } }, // All strings (including empty)
          { 'personalInfo.address': { $exists: false } }, // Missing address field
        ],
      });

      logger.info(
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
              logger.debug(
                `🔧 Converting empty string address to null for profile ${profile._id}`
              );
              profile.personalInfo.address = null;
            } else {
              // Non-empty string - convert to object
              logger.debug(
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
            logger.debug(
              `🔧 Setting undefined address to null for profile ${profile._id}`
            );
            profile.personalInfo.address = null;
          }

          await profile.save();
          fixedCount++;

          logger.debug(`✅ Fixed profile ${profile._id}`);
        } catch (error) {
          errorCount++;
          logger.error(
            `❌ Failed to fix profile ${profile._id}:`,
            { error: error.message }
          );

          // Try setting to null as fallback
          try {
            profile.personalInfo.address = null;
            await profile.save();
            logger.warn(
              `🆘 Set address to null for profile ${profile._id} as fallback`
            );
          } catch (fallbackError) {
            logger.error(
              `💥 Even fallback failed for profile ${profile._id}:`,
              { error: fallbackError.message }
            );
          }
        }
      }

      logger.info('🎉 Migration completed!');
      logger.info(`✅ Fixed: ${fixedCount} profiles`);
      logger.info(`❌ Errors: ${errorCount} profiles`);

      return { fixedCount, errorCount, totalFound: corruptedProfiles.length };
    } catch (error) {
      logger.error('💥 Migration failed:', error);
      throw error;
    }
  }

  /**
   * Check for profiles with corrupted address fields
   */
  static async checkCorruptedAddresses() {
    try {
      const stringAddresses = await CandidateProfile.countDocuments({
        'personalInfo.address': { $type: 'string', $ne: '' },
      });

      const emptyStringAddresses = await CandidateProfile.countDocuments({
        'personalInfo.address': '',
      });

      const nullAddresses = await CandidateProfile.countDocuments({
        'personalInfo.address': null,
      });

      const objectAddresses = await CandidateProfile.countDocuments({
        'personalInfo.address': { $type: 'object' },
      });

      const missingAddresses = await CandidateProfile.countDocuments({
        'personalInfo.address': { $exists: false },
      });

      const totalProfiles = await CandidateProfile.countDocuments();

      const totalProblematic =
        stringAddresses + emptyStringAddresses + missingAddresses;

      logger.info('📊 Address Field Analysis:', {
        totalProfiles,
        stringAddresses,
        emptyStringAddresses,
        missingAddresses,
        totalProblematic,
        objectAddresses,
        nullAddresses,
      });

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
      logger.error('💥 Analysis failed:', error);
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
