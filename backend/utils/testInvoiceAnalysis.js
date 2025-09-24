const dotenv = require('dotenv');
const { analyzeInvoice } = require('./geminiClient');

// Load environment variables
dotenv.config();

async function testInvoiceAnalysis() {
  console.log('\n🧪 === TESTING INVOICE ANALYSIS FLOW ===');
  
  // Sample OCR text that might come from an invoice
  const sampleOCRText = `
  INVOICE
  
  Tax Invoice No: INV-2024-001
  Date: 15/03/2024
  Due Date: 15/04/2024
  
  Billed To:
  ABC Company Ltd
  123 Business Street
  Mumbai, Maharashtra 400001
  GSTIN: 27ABCDE1234F1Z5
  
  Billed By:
  XYZ Services Pvt Ltd
  456 Service Avenue
  Pune, Maharashtra 411001
  GSTIN: 27XYZAB5678G2H9
  
  Description                HSN    Qty   Rate    CGST   SGST   Total
  Software Development       998314  1    50000   4500   4500   59000
  
  Subtotal:                                              50000
  CGST (9%):                                              4500
  SGST (9%):                                              4500
  Grand Total:                                           59000
  
  Amount in Words: Fifty Nine Thousand Only
  `;
  
  console.log('📄 Testing with sample invoice text:');
  console.log(`📏 Text length: ${sampleOCRText.length} characters`);
  console.log('📝 Text preview:', sampleOCRText.substring(0, 200) + '...');
  
  try {
    console.log('\n🚀 Starting invoice analysis...');
    const startTime = Date.now();
    
    const result = await analyzeInvoice(sampleOCRText);
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Analysis completed in ${duration}ms`);
    
    console.log('\n📊 Results:');
    console.log('🔍 Structured JSON:');
    console.log(JSON.stringify(result.structuredJson, null, 2));
    
    console.log('\n📋 Summary:');
    console.log(result.summary);
    
    console.log('\n🎯 Key validations:');
    console.log(`✅ Invoice Number: ${result.structuredJson?.invoiceNumber || 'Missing'}`);
    console.log(`✅ Grand Total: ₹${result.structuredJson?.totals?.grandTotal || 0}`);
    console.log(`✅ Billed By: ${result.structuredJson?.billedBy?.name || 'Missing'}`);
    console.log(`✅ Items count: ${result.structuredJson?.items?.length || 0}`);
    
  } catch (error) {
    console.log('\n❌ Invoice analysis failed!');
    console.log(`💥 Error: ${error.message}`);
    console.log(`📍 Stack: ${error.stack}`);
  }
  
  console.log('\n==============================\n');
}

// Run the test
testInvoiceAnalysis();