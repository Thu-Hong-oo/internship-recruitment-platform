const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_ENDPOINT = `${API_BASE_URL}/api/industries`;

// Read admin token from environment or prompt
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_JWT_TOKEN_HERE';

const seedIndustriesViaAPI = async () => {
  try {
    console.log('🚀 Starting to seed industries via API...');
    console.log(`📍 API Endpoint: ${API_ENDPOINT}`);

    // Read JSON data
    const dataPath = path.join(__dirname, '../data/industries-seed.json');
    const industriesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`📦 Found ${industriesData.length} industries to create`);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Create each industry via API
    for (let i = 0; i < industriesData.length; i++) {
      const industry = industriesData[i];
      try {
        console.log(
          `\n[${i + 1}/${industriesData.length}] Creating: ${industry.code}...`
        );

        const response = await axios.post(API_ENDPOINT, industry, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ADMIN_TOKEN}`,
          },
        });

        if (response.data.success) {
          console.log(`   ✅ Created: ${industry.name}`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: ${response.data.message}`);
          failCount++;
          errors.push({
            industry: industry.code,
            error: response.data.message,
          });
        }
      } catch (error) {
        console.log(
          `   ❌ Failed: ${error.response?.data?.message || error.message}`
        );
        failCount++;
        errors.push({
          industry: industry.code,
          error: error.response?.data?.message || error.message,
        });
      }

      // Add delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📦 Total: ${industriesData.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.industry}: ${err.error}`);
      });
    }

    console.log('\n✨ Seeding process completed!');
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

// Check if admin token is provided
if (ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
  console.error('❌ Error: Please provide ADMIN_TOKEN environment variable');
  console.log('\nUsage:');
  console.log(
    '  ADMIN_TOKEN=your_jwt_token node scripts/seed-industries-api.js'
  );
  console.log('\nOr set it in .env file:');
  console.log('  ADMIN_TOKEN=your_jwt_token');
  process.exit(1);
}

// Run the seed function
seedIndustriesViaAPI();
