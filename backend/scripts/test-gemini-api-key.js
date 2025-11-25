/**
 * Script to test Gemini API Key directly
 * 
 * Usage:
 *   node scripts/test-gemini-api-key.js
 * 
 * This script will test if the API key is valid by making a simple API call.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🧪 Testing Gemini API Key...\n');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set in .env file!');
  process.exit(1);
}

console.log(`📋 API Key Info:`);
console.log(`   Preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   Length: ${apiKey.length}`);
console.log(`   Starts with AIzaSy: ${apiKey.startsWith('AIzaSy')}`);
console.log(`   Has spaces: ${apiKey.includes(' ')}`);
console.log(`   Has newlines: ${apiKey.includes('\n') || apiKey.includes('\r')}\n`);

// Check for common issues
if (apiKey.length < 30) {
  console.warn('⚠️  API Key seems too short. Expected ~39 characters.');
}

if (!apiKey.startsWith('AIzaSy')) {
  console.warn('⚠️  API Key does not start with "AIzaSy". This might be invalid.');
}

if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\r')) {
  console.warn('⚠️  API Key contains whitespace. This might cause issues.');
  console.log(`   Trimmed: "${apiKey.trim()}"`);
}

console.log('\n🔄 Initializing GoogleGenerativeAI...');
try {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  console.log('✅ GoogleGenerativeAI initialized successfully\n');

  console.log('🔄 Getting model...');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('✅ Model obtained successfully\n');

  console.log('🔄 Making test API call...');
  const prompt = 'Say "Hello" in one word.';
  
  model.generateContent(prompt)
    .then(result => {
      const response = result.response;
      const text = response.text();
      
      console.log('✅ API call SUCCESSFUL!');
      console.log(`📝 Response: "${text}"\n`);
      console.log('🎉 Your API key is VALID and working!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ API call FAILED!\n');
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      
      if (error.message.includes('API Key not found') || error.message.includes('API_KEY_INVALID')) {
        console.error('\n🔴 Problem: API Key is INVALID or NOT FOUND');
        console.error('\nPossible causes:');
        console.error('   1. API key has been revoked or expired');
        console.error('   2. API key does not have permission to access Gemini API');
        console.error('   3. API key is restricted and does not allow this model');
        console.error('   4. API key format is incorrect');
        console.error('\nSolutions:');
        console.error('   1. Create a new API key: https://aistudio.google.com/app/apikey');
        console.error('   2. Check API key restrictions in Google Cloud Console');
        console.error('   3. Ensure Generative Language API is enabled');
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        console.error('\n🔴 Problem: API Quota Exceeded');
        console.error('   Your API key is valid but you have exceeded the quota limit.');
      } else if (error.message.includes('404')) {
        console.error('\n🔴 Problem: Model Not Found');
        console.error('   The model "gemini-1.5-flash" might not be available for your API key.');
      } else {
        console.error('\n🔴 Problem: Unknown Error');
        console.error('   Check the error message above for details.');
      }
      
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Failed to initialize GoogleGenerativeAI');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

