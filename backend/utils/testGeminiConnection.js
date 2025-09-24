const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

async function testGeminiConnection() {
  console.log('\n🧪 === GEMINI API CONNECTION TEST ===');
  
  const apiKey = process.env.GEMINI_API_KEY;
  const baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  
  console.log('🔑 API Key Check:');
  if (!apiKey) {
    console.log('❌ No GEMINI_API_KEY found in environment');
    return;
  }
  console.log(`✅ API Key present: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`📏 Length: ${apiKey.length} characters`);
  
  console.log('\n🌐 Testing basic API connectivity...');
  console.log(`🎯 URL: ${baseURL}`);
  
  try {
    const response = await axios.post(
      `${baseURL}?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say 'Hello from Gemini API test!' and return only this text."
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('\n✅ API Request successful!');
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Response structure:');
    console.log(`   - candidates: ${response.data?.candidates?.length || 0}`);
    
    if (response.data?.candidates?.[0]) {
      const candidate = response.data.candidates[0];
      console.log(`   - finishReason: ${candidate.finishReason || 'none'}`);
      
      const aiResponse = candidate.content?.parts?.[0]?.text;
      if (aiResponse) {
        console.log(`   - response: "${aiResponse}"`);
        console.log('\n🎉 Gemini API is working correctly!');
      } else {
        console.log('❌ No text response found');
      }
    } else {
      console.log('❌ No candidates in response');
    }
    
  } catch (error) {
    console.log('\n❌ API Request failed!');
    console.log(`💥 Error: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 HTTP Status: ${error.response.status}`);
      console.log(`📄 Response data:`, error.response.data);
    } else if (error.request) {
      console.log('📡 No response received - network/connectivity issue');
    }
    
    console.log('\n🔍 Troubleshooting suggestions:');
    console.log('1. Check if API key is valid and active');
    console.log('2. Verify internet connectivity');
    console.log('3. Check if Gemini API quota is exceeded');
    console.log('4. Ensure API is enabled in Google Cloud Console');
  }
  
  console.log('\n==============================\n');
}

// Run the test
testGeminiConnection();