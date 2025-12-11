/**
 * Test Gemini API Key Functionality
 * Usage: node test-gemini-api.js
 *
 * This script tests if the Gemini API key is working correctly
 * by sending a simple test request to the Google Generative AI API.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API Key...\n');

  // Check if API key exists
  if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
    console.log('💡 Please set GEMINI_API_KEY in your .env file');
    process.exit(1);
  }

  // Validate API key format (should start with 'AIzaSy')
  if (!GEMINI_API_KEY.startsWith('AIzaSy')) {
    console.error('❌ Error: Invalid API key format');
    console.log('💡 Gemini API key should start with "AIzaSy"');
    process.exit(1);
  }

  console.log('✅ API key found and format looks valid');

  try {
    // Initialize Gemini API
    console.log('🚀 Initializing Google Generative AI...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Get model (using the same model as in the codebase)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL 
    });

    console.log(`📝 Using model: ${model.model}`);
    console.log('💬 Sending test request...');

    // Simple test prompt
    const testPrompt = 'Hello! Please respond with exactly: "Gemini API is working correctly!"';

    // Generate content
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('\n🎉 SUCCESS! Gemini API is working');
    console.log('📄 Response:', text);

    // Check if response contains expected text
    if (text.includes('Gemini API is working correctly')) {
      console.log('✅ Response matches expected output');
    } else {
      console.log('⚠️ Response received but not exactly as expected');
    }

    // Additional info
    console.log('\n📊 Additional Info:');
    console.log('- Model used:', model.model);
    console.log('- Response length:', text.length, 'characters');

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.finishReason) {
        console.log('- Finish reason:', candidate.finishReason);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR: Gemini API test failed');
    console.error('Error details:', error.message);

    // Specific error handling
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 Solution: Check your API key is correct and active');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('💡 Solution: Check your API quota/limits');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Solution: Verify API key permissions');
    } else {
      console.log('💡 Solution: Check internet connection and API key validity');
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled Promise Rejection:');
  console.error(error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  testGeminiAPI()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed with error:');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testGeminiAPI };