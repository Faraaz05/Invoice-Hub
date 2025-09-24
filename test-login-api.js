// Test script to verify the login API endpoint
const axios = require('axios');

async function testLoginAPI() {
  console.log('Testing Login API...\n');
  
  try {
    // Test with valid admin credentials
    console.log('1. Testing with valid admin credentials:');
    const validResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@invoicehub.com',
      password: 'admin123'
    });
    
    console.log('✅ Status:', validResponse.status);
    console.log('✅ Response:', JSON.stringify(validResponse.data, null, 2));
    console.log('✅ Token received:', validResponse.data.token ? 'Yes' : 'No');
    console.log('✅ User data received:', validResponse.data.user ? 'Yes' : 'No');
    
  } catch (error) {
    console.log('❌ Valid credentials test failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  try {
    // Test with invalid credentials
    console.log('2. Testing with invalid credentials:');
    const invalidResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    });
    
    console.log('⚠️ Unexpected success with invalid credentials');
    console.log('Response:', JSON.stringify(invalidResponse.data, null, 2));
    
  } catch (error) {
    console.log('✅ Invalid credentials correctly rejected:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  try {
    // Test with missing fields
    console.log('3. Testing with missing password:');
    const missingFieldResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@invoicehub.com'
    });
    
    console.log('⚠️ Unexpected success with missing password');
    console.log('Response:', JSON.stringify(missingFieldResponse.data, null, 2));
    
  } catch (error) {
    console.log('✅ Missing field correctly rejected:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
  }
}

// Run the test
testLoginAPI().catch(console.error);