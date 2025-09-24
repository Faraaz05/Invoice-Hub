// Load environment variables
require('dotenv').config();

const { analyzeInvoice } = require('./geminiClient');

// Debug environment variables
console.log('🔍 Environment Debug:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'N/A');
console.log('');

// Sample invoice text for testing
const sampleInvoiceText = `
INVOICE

Invoice No: INV-2024-001
Date: 15/09/2024
Due Date: 15/10/2024

From:
TechCorp Solutions Pvt Ltd
123 Business Park, Sector 5
Gurgaon, Haryana - 122001
GSTIN: 06ABCDE1234F1Z5
Email: billing@techcorp.com
Phone: +91-9876543210

To:
InnovateTech Industries Ltd
456 Industrial Area, Phase 2
Bangalore, Karnataka - 560078
GSTIN: 29FGHIJ5678K1L9

Items:
1. Software License - Annual Plan
   HSN: 998314
   Qty: 1 Unit
   Rate: ₹450,000.00
   GST: 18%
   Taxable Amount: ₹450,000.00
   CGST (9%): ₹40,500.00
   SGST (9%): ₹40,500.00
   Total: ₹531,000.00

2. Implementation Services
   HSN: 998313
   Qty: 50 Hours
   Rate: ₹5,000.00
   GST: 18%
   Taxable Amount: ₹250,000.00
   CGST (9%): ₹22,500.00
   SGST (9%): ₹22,500.00
   Total: ₹295,000.00

Subtotal: ₹700,000.00
Total GST: ₹126,000.00
Grand Total: ₹826,000.00

Amount in Words: Eight Lakh Twenty Six Thousand Only

Payment Terms: Net 30 days
Notes: Please transfer the amount to our bank account within due date.
`;

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...\n');
  
  try {
    console.log('Sample Invoice Text:');
    console.log(sampleInvoiceText.substring(0, 200) + '...\n');
    
    console.log('🤖 Calling Gemini AI for analysis...');
    const startTime = Date.now();
    
    const result = await analyzeInvoice(sampleInvoiceText);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Analysis completed in ${duration}ms\n`);
    
    console.log('📋 AI Summary:');
    console.log(result.summary);
    console.log('\n📊 Structured Data:');
    console.log(JSON.stringify(result.structuredJson, null, 2));
    
    // Test specific extractions
    console.log('\n🔍 Key Extracted Fields:');
    console.log(`- Invoice Number: ${result.structuredJson.invoiceNumber}`);
    console.log(`- Vendor: ${result.structuredJson.billedBy?.name}`);
    console.log(`- Customer: ${result.structuredJson.billedTo?.name}`);
    console.log(`- Items Count: ${result.structuredJson.items?.length}`);
    console.log(`- Grand Total: ₹${result.structuredJson.totals?.grandTotal}`);
    console.log(`- GST Total: ₹${(result.structuredJson.totals?.cgstTotal || 0) + (result.structuredJson.totals?.sgstTotal || 0) + (result.structuredJson.totals?.igstTotal || 0)}`);
    
    console.log('\n✅ Gemini AI Integration Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testGeminiIntegration();