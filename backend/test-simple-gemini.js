require('dotenv').config();
const axios = require('axios');

async function testSimpleGemini() {
  console.log('🧪 Testing Simple Gemini API (Free Tier)');
  console.log('==========================================');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('❌ No GEMINI_API_KEY found');
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
  
  // Try with v1beta and gemini-2.5-flash (from our models list)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
  try {
    console.log(`\n🌐 Testing URL: ${url}`);
    
    const response = await axios.post(`${url}?key=${apiKey}`, {
      contents: [{
        parts: [{
          text: "Hello! Please respond with exactly: {'test': 'success', 'working': true}"
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📋 Error:`, error.response.data);
    }
  }
}

testSimpleGemini();