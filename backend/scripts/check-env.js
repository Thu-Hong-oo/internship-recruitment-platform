/**
 * Script to check if all required environment variables are set
 * Usage: node scripts/check-env.js
 */

require('dotenv').config();

const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const optional = [
  'REDIS_URL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;

console.log('📋 Required Variables:');
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`   ❌ Missing: ${key}`);
    hasErrors = true;
  } else {
    const value = process.env[key];
    const preview = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value.substring(0, 10) + '...';
    console.log(`   ✅ ${key}: ${preview}`);
  }
});

console.log('\n📋 Optional Variables:');
optional.forEach(key => {
  if (process.env[key]) {
    const value = process.env[key];
    const preview = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value.substring(0, 10) + '...';
    console.log(`   ✅ ${key}: ${preview}`);
  } else {
    console.log(`   ⚠️  ${key}: Not set (optional)`);
  }
});

console.log('\n📊 Summary:');
console.log(`   PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`);

if (hasErrors) {
  console.error('\n❌ Missing required environment variables!');
  console.error('   Please check your .env file.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('   Ready to deploy! 🚀');
}
