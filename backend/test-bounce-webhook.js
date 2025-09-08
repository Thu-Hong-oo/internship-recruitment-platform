const axios = require('axios');

// Test script to simulate email bounce-back
async function testBounceWebhook() {
  const testEmail = 'tfegter4534543r4f@gmail.com'; // Email that bounced
  
  try {
    console.log('Testing email bounce webhook...');
    
    const response = await axios.post('http://localhost:3000/api/webhooks/email-bounce', {
      email: testEmail,
      reason: 'Không tìm thấy địa chỉ hoặc địa chỉ không thể nhận thư',
      timestamp: new Date().toISOString(),
      messageId: 'test-message-id-123'
    });
    
    console.log('Bounce webhook response:', response.data);
    
    // Test email validation
    console.log('\nTesting email validation...');
    const validationResponse = await axios.post('http://localhost:3000/api/webhooks/validate-email', {
      email: testEmail
    });
    
    console.log('Email validation response:', validationResponse.data);
    
  } catch (error) {
    console.error('Error testing webhook:', error.response?.data || error.message);
  }
}

// Test script to simulate email delivery
async function testDeliveryWebhook() {
  const testEmail = 'valid@example.com';
  
  try {
    console.log('Testing email delivery webhook...');
    
    const response = await axios.post('http://localhost:3000/api/webhooks/email-delivery', {
      email: testEmail,
      status: 'delivered',
      timestamp: new Date().toISOString(),
      messageId: 'test-delivery-message-id-456'
    });
    
    console.log('Delivery webhook response:', response.data);
    
  } catch (error) {
    console.error('Error testing delivery webhook:', error.response?.data || error.message);
  }
}

// Run tests
if (require.main === module) {
  console.log('Starting webhook tests...\n');
  
  testBounceWebhook()
    .then(() => {
      console.log('\n---\n');
      return testDeliveryWebhook();
    })
    .then(() => {
      console.log('\nAll tests completed!');
    })
    .catch(error => {
      console.error('Test failed:', error.message);
    });
}

module.exports = {
  testBounceWebhook,
  testDeliveryWebhook
};
