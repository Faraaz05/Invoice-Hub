/**
 * Test Google Generative AI SDK with gemini-2.5-flash
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function main() {
  console.log('🧪 Testing Google Generative AI SDK...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No GEMINI_API_KEY found in .env file');
    process.exit(1);
  }
  
  console.log(`✅ API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}\n`);
  
  try {
    // Initialize the SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });
    
    console.log('📡 Testing gemini-2.5-flash model...');
    
    const prompt = 'Explain how AI works in a few words';
    console.log(`📝 Prompt: "${prompt}"\n`);
    
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const duration = Date.now() - startTime;
    
    const text = response.text;
    
    console.log('✅ SUCCESS! API is working!\n');
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📄 Response:\n${text}\n`);
    
    console.log('🎉 ========================================');
    console.log('🎉 GEMINI 2.5 FLASH IS WORKING PERFECTLY!');
    console.log('🎉 ========================================\n');
    console.log('✅ Ready for invoice processing!');
    
  } catch (error) {
    console.log('❌ Error occurred:\n');
    console.log(`Name: ${error.name}`);
    console.log(`Message: ${error.message}`);
    console.log('\nStack:', error.stack);
    
    if (error.message && error.message.includes('API key not valid')) {
      console.log('\n🔧 FIX: Get a new API key from https://aistudio.google.com/app/apikey');
    } else if (error.message && error.message.includes('quota')) {
      console.log('\n🔧 FIX: Your API quota is exhausted. Get a new key or enable billing.');
    } else if (error.message && error.message.includes('not found')) {
      console.log('\n🔧 FIX: Enable Generative Language API at:');
      console.log('https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    }
    
    process.exit(1);
  }
}

main();
