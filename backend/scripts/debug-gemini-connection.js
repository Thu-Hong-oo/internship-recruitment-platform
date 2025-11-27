/**
 * Script để debug kết nối Gemini API
 * 
 * Usage:
 *   node backend/scripts/debug-gemini-connection.js
 * 
 * Script này sẽ:
 * 1. Kiểm tra API key có tồn tại không
 * 2. Kiểm tra format API key
 * 3. Test kết nối với Gemini API
 * 4. Hiển thị thông tin chi tiết về lỗi (nếu có)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Debugging Gemini API Connection...\n');
console.log('='.repeat(60));

// Step 1: Check if API key exists
console.log('\n📋 Step 1: Checking API Key...');
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is NOT SET in .env file!');
  console.error('\n💡 Solution:');
  console.error('   1. Open backend/.env file');
  console.error('   2. Add: GEMINI_API_KEY=your-api-key-here');
  console.error('   3. Get API key from: https://aistudio.google.com/app/apikey');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY is set');

// Step 2: Check API key format
console.log('\n📋 Step 2: Checking API Key Format...');
apiKey = apiKey.trim();

const issues = [];

if (apiKey.includes(' ')) {
  issues.push('⚠️  Contains spaces (will be trimmed)');
}

if (apiKey.includes('\n') || apiKey.includes('\r')) {
  issues.push('⚠️  Contains newlines (will be trimmed)');
}

if (!apiKey.startsWith('AIzaSy')) {
  issues.push(`❌ Does NOT start with "AIzaSy" (starts with: "${apiKey.substring(0, 6)}")`);
}

if (apiKey.length < 30 || apiKey.length > 50) {
  issues.push(`⚠️  Unusual length: ${apiKey.length} (expected ~39 chars)`);
}

if (issues.length > 0) {
  console.log('⚠️  Format Issues Found:');
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('✅ API Key format looks valid');
}

console.log(`   Preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   Length: ${apiKey.length} characters`);

// Step 3: Initialize GoogleGenerativeAI
console.log('\n📋 Step 3: Initializing GoogleGenerativeAI...');
let genAI;
try {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('✅ GoogleGenerativeAI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize GoogleGenerativeAI');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

// Step 4: Get Model
console.log('\n📋 Step 4: Getting Model...');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
console.log(`   Model: ${modelName}`);

let model;
try {
  model = genAI.getGenerativeModel({ model: modelName });
  console.log('✅ Model obtained successfully');
} catch (error) {
  console.error('❌ Failed to get model');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

// Step 5: Test API Call
console.log('\n📋 Step 5: Testing API Call...');
console.log('   Sending test request...');

const testPrompt = 'Say "Hello" in one word.';

model.generateContent(testPrompt)
  .then(result => {
    const response = result.response;
    const text = response.text();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! API Key is VALID and working!');
    console.log('='.repeat(60));
    console.log(`📝 Response: "${text}"`);
    console.log('\n🎉 Gemini API connection is working correctly!');
    console.log('   You can now use Gemini features in your application.');
    process.exit(0);
  })
  .catch(error => {
    console.log('\n' + '='.repeat(60));
    console.error('❌ API CALL FAILED!');
    console.log('='.repeat(60));
    console.error(`\nError Message: ${error.message}`);
    
    // Detailed error analysis
    if (error.message.includes('API Key not found') || error.message.includes('API_KEY_INVALID')) {
      console.error('\n🔴 Problem: API Key is INVALID or NOT FOUND');
      console.error('\nPossible Causes:');
      console.error('   1. ❌ API key has been revoked or expired');
      console.error('   2. ❌ API key does not have permission to access Gemini API');
      console.error('   3. ❌ API key is restricted and does not allow this model');
      console.error('   4. ❌ API key format is incorrect (even if it looks correct)');
      console.error('\nSolutions:');
      console.error('   1. ✅ Create a NEW API key: https://aistudio.google.com/app/apikey');
      console.error('   2. ✅ Check API key restrictions in Google Cloud Console');
      console.error('   3. ✅ Ensure "Generative Language API" is enabled');
      console.error('   4. ✅ Copy API key carefully (no extra spaces or characters)');
      console.error('   5. ✅ Restart server after updating .env file');
    } else if (error.message.includes('429') || error.message.includes('quota')) {
      console.error('\n🔴 Problem: API Quota Exceeded');
      console.error('   Your API key is valid but you have exceeded the quota limit.');
      console.error('\nSolutions:');
      console.error('   1. Wait for quota to reset');
      console.error('   2. Upgrade your Google Cloud plan');
    } else if (error.message.includes('404')) {
      console.error('\n🔴 Problem: Model Not Found');
      console.error(`   The model "${modelName}" might not be available for your API key.`);
      console.error('\nSolutions:');
      console.error('   1. Try using: gemini-1.5-flash');
      console.error('   2. Check if model name is correct');
    } else {
      console.error('\n🔴 Problem: Unknown Error');
      console.error('   Check the error message above for details.');
    }
    
    console.error('\n💡 Note: Your application will use fallback parsing (rule-based)');
    console.error('   when Gemini API is unavailable, so it will still work.');
    
    process.exit(1);
  });



