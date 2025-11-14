/**
 * Test script to verify Gemini API is working properly
 * Run: node test-gemini-fix.js
 */

require('dotenv').config();
const { analyzeInvoice } = require('./utils/geminiClient');

// Sample invoice text for testing
const sampleInvoiceText = `
TAX INVOICE

Invoice No: INV-2024-001
Date: 15/11/2024

Billed By:
ABC Technologies Pvt Ltd
123 MG Road, Bangalore
Karnataka - 560001
GSTIN: 29ABCDE1234F1Z5
Phone: +91-80-1234-5678

Billed To:
XYZ Corporation
456 Park Street, Kolkata
West Bengal - 700016
GSTIN: 19XYZAB5678C1D2

Items:
1. Software Development Services - HSN: 998314
   Qty: 100 Hours @ Rs. 2,000/hr
   Taxable Amount: Rs. 2,00,000
   CGST @ 9%: Rs. 18,000
   SGST @ 9%: Rs. 18,000
   Total: Rs. 2,36,000

Total Amount: Rs. 2,36,000
Amount in Words: Rupees Two Lakh Thirty-Six Thousand Only

Payment Terms: Net 30 Days
Bank Details: HDFC Bank, A/c: 12345678901, IFSC: HDFC0001234
`;

async function testGeminiAPI() {
  console.log('🧪 =======================================');
  console.log('🧪 GEMINI API TEST SCRIPT');
  console.log('🧪 =======================================\n');

  // Check API Key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('🔑 API Key Check:');
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in .env file!');
    console.log('');
    console.log('📝 TO FIX:');
    console.log('1. Go to: https://aistudio.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Add to backend/.env: GEMINI_API_KEY=your_key_here');
    console.log('4. Run this test again');
    process.exit(1);
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`📏 Length: ${apiKey.length} characters`);
  console.log('');

  // Test the analysis
  console.log('📄 Testing Invoice Analysis...\n');
  console.log('⏱️  This may take 5-15 seconds with retry logic...\n');

  const startTime = Date.now();

  try {
    const result = await analyzeInvoice(sampleInvoiceText);
    const duration = Date.now() - startTime;

    console.log('\n🎉 =======================================');
    console.log('🎉 SUCCESS! GEMINI API IS WORKING!');
    console.log('🎉 =======================================\n');

    console.log('📊 Test Results:');
    console.log(`⏱️  Total Time: ${duration}ms`);
    console.log(`🔧 Source: ${result.source}`);
    console.log(`✅ Success: ${result.success !== false}`);
    console.log('');

    if (result.source === 'gemini') {
      console.log('✨ Gemini AI Analysis Successful!');
      console.log('');
      console.log('📋 Extracted Data Preview:');
      console.log(`   Invoice Number: ${result.structuredJson.invoiceNumber}`);
      console.log(`   Invoice Date: ${result.structuredJson.invoiceDate}`);
      console.log(`   Vendor: ${result.structuredJson.billedBy?.name}`);
      console.log(`   Customer: ${result.structuredJson.billedTo?.name}`);
      console.log(`   Items: ${result.structuredJson.items?.length || 0}`);
      console.log(`   Total Amount: ₹${result.structuredJson.totals?.grandTotal || 0}`);
      console.log('');
      console.log('📝 Summary:');
      console.log(`   ${result.summary}`);
      console.log('');
      console.log('✅ YOUR GEMINI API IS READY FOR SUBMISSION! 🚀');
    } else if (result.source === 'fallback') {
      console.log('⚠️  Gemini API Used Fallback');
      console.log('');
      console.log('❌ Issue:', result.fallbackReason);
      console.log('');
      console.log('🔧 RECOMMENDED ACTIONS:');
      console.log('1. Get a NEW API key from: https://aistudio.google.com/app/apikey');
      console.log('2. Make sure you create it in a NEW project');
      console.log('3. Update backend/.env with the new key');
      console.log('4. Run this test again');
      console.log('');
      console.log('📖 See GEMINI_FIX_GUIDE.md for detailed instructions');
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('\n❌ =======================================');
    console.log('❌ TEST FAILED');
    console.log('❌ =======================================\n');

    console.log(`⏱️  Failed after: ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
    console.log('');

    if (error.response) {
      console.log('📡 API Response:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
      console.log('');
    }

    console.log('🔧 TROUBLESHOOTING:');
    console.log('');
    
    if (error.response?.status === 403) {
      console.log('❌ 403 Forbidden - Your API key is invalid or restricted');
      console.log('');
      console.log('FIX: Get a new API key');
      console.log('1. Visit: https://aistudio.google.com/app/apikey');
      console.log('2. Sign in and create a NEW API key');
      console.log('3. Update backend/.env');
    } else if (error.response?.status === 429) {
      console.log('❌ 429 Too Many Requests - Rate limit exceeded');
      console.log('');
      console.log('FIX: Wait 1 minute or get a new API key');
    } else if (error.response?.status === 503) {
      console.log('❌ 503 Service Unavailable - Gemini is overloaded');
      console.log('');
      console.log('FIX: Retry in 30 seconds or get a new API key from a different project');
    } else if (error.response?.status === 500) {
      console.log('❌ 500 Internal Server Error - Gemini service issue');
      console.log('');
      console.log('FIX: Wait and retry, or try a different model');
    } else {
      console.log('❌ Unknown error - Check your internet connection and API key');
    }

    console.log('');
    console.log('📖 See GEMINI_FIX_GUIDE.md for detailed fix instructions');
    
    process.exit(1);
  }

  console.log('');
  console.log('🏁 Test Complete!');
  console.log('=======================================\n');
}

// Run the test
testGeminiAPI().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
