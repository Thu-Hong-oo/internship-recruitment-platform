require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Job = require('./src/models/Job');

async function debugCityValues() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all distinct city values
    const allCities = await Job.distinct('address.city');
    console.log('📍 All distinct city values in database:');
    console.log(JSON.stringify(allCities, null, 2));
    console.log(`\nTotal: ${allCities.length} cities\n`);

    // Test flexible regex for "Ho Chi Minh"
    const { createFlexibleRegex } = require('./src/utils/textUtils');
    
    console.log('🔍 Testing "Ho Chi Minh" (no accents):');
    const regexNoAccent = createFlexibleRegex('Ho Chi Minh');
    const jobsNoAccent = await Job.find({ 'address.city': regexNoAccent })
      .select('_id title address.city')
      .limit(15);
    console.log(`Found: ${jobsNoAccent.length} jobs`);
    jobsNoAccent.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} - City: "${job.address.city}"`);
    });

    console.log('\n🔍 Testing "Hồ Chí Minh" (with accents):');
    const regexWithAccent = createFlexibleRegex('Hồ Chí Minh');
    const jobsWithAccent = await Job.find({ 'address.city': regexWithAccent })
      .select('_id title address.city')
      .limit(15);
    console.log(`Found: ${jobsWithAccent.length} jobs`);
    jobsWithAccent.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} - City: "${job.address.city}"`);
    });

    console.log('\n🔍 Testing exact match "Thành phố Hồ Chí Minh":');
    const jobsExact = await Job.find({ 'address.city': 'Thành phố Hồ Chí Minh' })
      .select('_id title address.city')
      .limit(15);
    console.log(`Found: ${jobsExact.length} jobs`);
    jobsExact.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} - City: "${job.address.city}"`);
    });

    console.log('\n🔍 Testing exact match "Hồ Chí Minh":');
    const jobsExactShort = await Job.find({ 'address.city': 'Hồ Chí Minh' })
      .select('_id title address.city')
      .limit(15);
    console.log(`Found: ${jobsExactShort.length} jobs`);
    jobsExactShort.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} - City: "${job.address.city}"`);
    });

    console.log('\n🔍 Testing exact match "Ho Chi Minh City":');
    const jobsEnglish = await Job.find({ 'address.city': 'Ho Chi Minh City' })
      .select('_id title address.city')
      .limit(15);
    console.log(`Found: ${jobsEnglish.length} jobs`);
    jobsEnglish.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} - City: "${job.address.city}"`);
    });

    // Show regex patterns
    console.log('\n📝 Regex patterns generated:');
    console.log('No accent input:', regexNoAccent);
    console.log('With accent input:', regexWithAccent);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugCityValues();
