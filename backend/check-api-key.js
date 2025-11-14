/**
 * Simple API Key Checker - Tests if your Gemini API key is valid
 */

require('dotenv').config();
const axios = require('axios');

async function checkAPIKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Checking Gemini API Key Status...\n');
  
  if (!apiKey) {
    console.log('❌ No GEMINI_API_KEY found in .env file');
    process.exit(1);
  }
  
  console.log(`✅ API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`📏 Length: ${apiKey.length} characters\n`);
  
  // Test with a very simple prompt
  const testPrompt = 'Say "Hello" in one word.';
  
  const endpoints = [
    {
      name: 'gemini-1.5-flash (v1beta)',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    },
    {
      name: 'gemini-pro (v1beta)',  
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    },
    {
      name: 'gemini-1.5-pro (v1beta)',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📡 URL: ${endpoint.url.split('?')[0]}`);
    
    try {
      const response = await axios.post(
        endpoint.url,
        {
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`✅ SUCCESS! Model responded: "${response.data.candidates[0].content.parts[0].text.trim()}"`);
        console.log(`\n🎉 YOUR API KEY WORKS WITH: ${endpoint.name}`);
        console.log(`\nℹ️  This is the model that will work for your project.`);
        return;
      }
      
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data?.error;
        
        console.log(`❌ Failed (HTTP ${status})`);
        
        if (status === 404) {
          console.log(`   → Model not found or not available`);
        } else if (status === 429) {
          console.log(`   → Quota exceeded`);
          console.log(`   → Message: ${errorData?.message?.substring(0, 150)}...`);
        } else if (status === 403) {
          console.log(`   → Permission denied / API key invalid`);
        } else if (status === 400) {
          console.log(`   → Bad request`);
          console.log(`   → ${errorData?.message || 'Unknown error'}`);
        } else {
          console.log(`   → ${errorData?.message || error.message}`);
        }
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
  }
  
  console.log('\n\n❌ ========================================');
  console.log('❌ NONE OF THE MODELS WORKED');
  console.log('❌ ========================================\n');
  console.log('🔧 SOLUTION:');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Create a NEW API key in a NEW Google Cloud project');
  console.log('3. Enable "Generative Language API" in that project');
  console.log('4. Update your .env file with the new key\n');
  console.log('OR try:');
  console.log('1. Go to: https://aistudio.google.com/app/apikey');
  console.log('2. Click "Create API key in new project"');
  console.log('3. Copy the new key and update .env\n');
}

checkAPIKey().catch(console.error);
