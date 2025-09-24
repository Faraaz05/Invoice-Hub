const axios = require('axios');

async function testPendingInvoicesAPI() {
  try {
    console.log('Testing pending invoices API...\n');
    
    // You'll need to replace this with a valid JWT token from your login
    const token = 'your-jwt-token-here';
    
    const response = await axios.get('http://localhost:5000/api/invoices?status=pending&department=&page=1&limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.invoices) {
      console.log('\nSample Invoice Structure:');
      console.log(JSON.stringify(response.data.data.invoices[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error testing API:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testPendingInvoicesAPI();