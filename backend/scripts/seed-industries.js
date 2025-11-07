const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Industry model
const Industry = require('../src/infrastructure/models/Industry');

const seedIndustries = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/internship-platform',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ Connected to MongoDB');

    // Read JSON data
    const dataPath = path.join(__dirname, '../data/industries-seed.json');
    const industriesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`📦 Found ${industriesData.length} industries to seed`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    const existingCount = await Industry.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing industries`);
      console.log('🗑️  Clearing existing data...');
      await Industry.deleteMany({});
      console.log('✅ Cleared existing industries');
    }

    // Insert new data
    console.log('💾 Inserting new industries...');
    const result = await Industry.insertMany(industriesData);
    console.log(`✅ Successfully inserted ${result.length} industries`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   Total industries: ${result.length}`);
    console.log(
      `   Visible industries: ${result.filter(i => i.visible).length}`
    );
    console.log(
      `   Hidden industries: ${result.filter(i => !i.visible).length}`
    );

    // Display some examples
    console.log('\n📝 Sample industries:');
    result.slice(0, 5).forEach(industry => {
      console.log(`   - ${industry.code}: ${industry.name}`);
    });

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding industries:', error);
    process.exit(1);
  }
};

// Run the seed function
seedIndustries();
