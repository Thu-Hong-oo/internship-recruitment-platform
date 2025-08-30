require('dotenv').config();
const { sendEmailVerification, sendPasswordResetEmail } = require('./src/services/emailService');

// Test data
const testUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

const testToken = 'test-verification-token-123456';

async function testEmailVerification() {
  console.log('🧪 Testing email verification...');
  
  try {
    await sendEmailVerification(testUser, testToken);
    console.log('✅ Email verification sent successfully!');
  } catch (error) {
    console.error('❌ Email verification failed:', error.message);
  }
}

async function testPasswordReset() {
  console.log('🧪 Testing password reset email...');
  
  try {
    await sendPasswordResetEmail(testUser, testToken);
    console.log('✅ Password reset email sent successfully!');
  } catch (error) {
    console.error('❌ Password reset email failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting email service tests...\n');
  
  // Check environment variables
  console.log('📋 Environment check:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✅ Set' : '❌ Missing');
  console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Missing');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS ? '✅ Set' : '❌ Missing');
  console.log('');

  // Run tests
  await testEmailVerification();
  console.log('');
  await testPasswordReset();
  
  console.log('\n🏁 Email service tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEmailVerification, testPasswordReset };
