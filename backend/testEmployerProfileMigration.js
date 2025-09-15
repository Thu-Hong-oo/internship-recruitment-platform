/**
 * Test script để kiểm tra EmployerProfile migration
 * Chạy: node testEmployerProfileMigration.js
 */

const mongoose = require('mongoose');

async function testEmployerProfileMigration() {
  try {
    console.log('🧪 Testing EmployerProfile Migration...');

    // Test 1: Import các modules
    console.log('\n1️⃣ Testing imports...');

    try {
      const EmployerProfile = require('./src/models/EmployerProfile');
      console.log('✅ EmployerProfile model imported successfully');

      const EmployerProfileHelpers = require('./src/helpers/EmployerProfileHelpers');
      console.log('✅ EmployerProfileHelpers imported successfully');

      // Test schemas
      const CompanyInfoSchema = require('./src/models/schemas/CompanyInfoSchema');
      const BusinessInfoSchema = require('./src/models/schemas/BusinessInfoSchema');
      const VerificationSchema = require('./src/models/schemas/VerificationSchema');
      console.log('✅ All schemas imported successfully');

      // Test services
      const EmployerDocumentService = require('./src/services/EmployerDocumentService');
      const EmployerVerificationService = require('./src/services/EmployerVerificationService');
      console.log('✅ All services imported successfully');
    } catch (importError) {
      console.error('❌ Import failed:', importError.message);
      return;
    }

    // Test 2: Schema structure
    console.log('\n2️⃣ Testing schema structure...');

    const EmployerProfile = require('./src/models/EmployerProfile');
    const schema = EmployerProfile.schema;

    // Check essential fields
    const requiredFields = ['mainUserId', 'company', 'businessInfo', 'status'];
    const missingFields = requiredFields.filter(field => !schema.paths[field]);

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
    } else {
      console.log('✅ All required fields present');
    }

    // Test 3: Methods and Virtuals
    console.log('\n3️⃣ Testing methods and virtuals...');

    const methods = [
      'updateStats',
      'getDocumentService',
      'getVerificationService',
    ];
    const statics = ['findVerified', 'findByIndustry', 'findCanPostJobs'];
    const virtuals = ['isHiring', 'verificationProgress'];

    // Check methods
    methods.forEach(method => {
      if (typeof EmployerProfile.prototype[method] === 'function') {
        console.log(`✅ Method ${method} exists`);
      } else {
        console.error(`❌ Method ${method} missing`);
      }
    });

    // Check statics
    statics.forEach(static => {
      if (typeof EmployerProfile[static] === 'function') {
        console.log(`✅ Static ${static} exists`);
      } else {
        console.error(`❌ Static ${static} missing`);
      }
    });

    // Check virtuals
    virtuals.forEach(virtual => {
      if (schema.virtuals[virtual]) {
        console.log(`✅ Virtual ${virtual} exists`);
      } else {
        console.error(`❌ Virtual ${virtual} missing`);
      }
    });

    console.log('\n🎉 Migration test completed!');
    console.log('\n📋 Next steps:');
    console.log(
      '1. Test API endpoints: POST /api/employers/documents/business-license'
    );
    console.log(
      '2. Test API endpoints: POST /api/employers/documents/tax-certificate'
    );
    console.log(
      '3. Test API endpoints: DELETE /api/employers/documents/:documentId'
    );
    console.log('4. Monitor logs for any runtime errors');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test nếu file được chạy trực tiếp
if (require.main === module) {
  testEmployerProfileMigration();
}

module.exports = testEmployerProfileMigration;
