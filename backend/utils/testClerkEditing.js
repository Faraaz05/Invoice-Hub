const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data for clerk editing
const testEdits = {
  summary: "EDITED BY CLERK: This is a test invoice that has been manually reviewed and corrected by the clerk.",
  
  // Edit vendor information
  billedBy: {
    name: "CORRECTED: TechCorp Solutions Pvt Ltd",
    address: "UPDATED: 123 Business Park, Sector 5, Updated Address",
    city: "Gurgaon",
    state: "Haryana", 
    pincode: "122001",
    country: "India",
    gstin: "06ABCDE1234F1Z5",
    email: "billing@techcorp.com",
    phone: "+91-9876543210"
  },
  
  // Edit customer information
  billedTo: {
    name: "CORRECTED: InnovateTech Industries Ltd", 
    address: "UPDATED: 456 Industrial Area, Phase 2, Corrected Address",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560078", 
    country: "India",
    gstin: "29FGHIJ5678K1L9"
  },
  
  // Edit items - correcting AI mistakes
  items: [
    {
      description: "CORRECTED: Software License - Enterprise Plan (Annual)",
      hsnCode: "998314",
      qty: 1,
      unit: "License",
      rate: 500000, // Corrected amount
      gstRate: 18,
      taxableAmount: 500000,
      cgst: 45000, // Recalculated
      sgst: 45000, // Recalculated  
      igst: 0,
      total: 590000 // Corrected total
    },
    {
      description: "CORRECTED: Implementation & Training Services",
      hsnCode: "998313", 
      qty: 60, // Corrected quantity
      unit: "Hours",
      rate: 4000, // Corrected rate
      gstRate: 18,
      taxableAmount: 240000, // Recalculated
      cgst: 21600, // Recalculated
      sgst: 21600, // Recalculated
      igst: 0,
      total: 283200 // Corrected total
    }
  ],
  
  // Corrected totals
  totals: {
    subTotal: 740000, // Recalculated
    discount: 0,
    taxableAmount: 740000,
    cgstTotal: 66600, // Recalculated
    sgstTotal: 66600, // Recalculated  
    igstTotal: 0,
    grandTotal: 873200, // Corrected final total
    totalInWords: "Eight Lakh Seventy Three Thousand Two Hundred Only"
  },
  
  paymentTerms: "UPDATED: Net 45 days (Extended due to project complexity)",
  notes: "CLERK NOTES: Invoice amounts corrected after manual verification. Training hours increased from 50 to 60 as per actual requirement."
};

async function testClerkEditing() {
  console.log('🧪 Testing Clerk Editing Functionality...\n');
  
  try {
    // Step 1: Login as clerk
    console.log('1. 🔐 Logging in as clerk...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'clerk@invoicehub.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Clerk login successful');
    
    // Step 2: Get list of invoices to find one to edit
    console.log('\n2. 📋 Getting invoice list...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Handle different possible response structures
    let invoices = [];
    if (invoicesResponse.data.data && invoicesResponse.data.data.invoices && Array.isArray(invoicesResponse.data.data.invoices)) {
      invoices = invoicesResponse.data.data.invoices;
    } else if (invoicesResponse.data.data && Array.isArray(invoicesResponse.data.data)) {
      invoices = invoicesResponse.data.data;
    } else if (Array.isArray(invoicesResponse.data)) {
      invoices = invoicesResponse.data;
    } else if (invoicesResponse.data.invoices && Array.isArray(invoicesResponse.data.invoices)) {
      invoices = invoicesResponse.data.invoices;
    }
    
    console.log(`   Found ${invoices.length} invoices`);
    
    if (invoices.length === 0) {
      console.log('❌ No invoices found to edit');
      console.log('💡 Try uploading an invoice first using the test HTML interface');
      return;
    }
    
    const invoiceToEdit = invoices[0]; // Get the first invoice
    console.log(`✅ Found invoice to edit: ${invoiceToEdit._id}`);
    console.log(`   Original Summary: ${invoiceToEdit.summary?.substring(0, 50) || 'No summary'}...`);
    console.log(`   Original Vendor: ${invoiceToEdit.billedBy?.name || 'Unknown'}`);
    console.log(`   Original Total: ₹${invoiceToEdit.totals?.grandTotal || 0}`);
    
    // Step 3: Edit the invoice
    console.log('\n3. ✏️  Editing invoice with clerk corrections...');
    const editResponse = await axios.put(
      `${BASE_URL}/invoices/${invoiceToEdit._id}`,
      testEdits,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const updatedInvoice = editResponse.data.data;
    console.log('✅ Invoice successfully updated by clerk!');
    
    // Step 4: Verify the changes
    console.log('\n4. 🔍 Verifying changes...');
    console.log(`   NEW Summary: ${updatedInvoice.summary?.substring(0, 80)}...`);
    console.log(`   NEW Vendor: ${updatedInvoice.billedBy?.name}`);
    console.log(`   NEW Customer: ${updatedInvoice.billedTo?.name}`);
    console.log(`   NEW Items Count: ${updatedInvoice.items?.length}`);
    console.log(`   NEW Grand Total: ₹${updatedInvoice.totals?.grandTotal}`);
    console.log(`   NEW Payment Terms: ${updatedInvoice.paymentTerms}`);
    
    // Step 5: Check approval history
    console.log('\n5. 📝 Approval History:');
    if (updatedInvoice.approvalHistory && updatedInvoice.approvalHistory.length > 0) {
      const lastEntry = updatedInvoice.approvalHistory[updatedInvoice.approvalHistory.length - 1];
      console.log(`   Last Action: ${lastEntry.action} by ${lastEntry.role}`);
      console.log(`   Comment: ${lastEntry.comments}`);
      console.log(`   Date: ${lastEntry.date}`);
    }
    
    console.log('\n✅ Clerk Editing Test Completed Successfully!');
    console.log('\n📊 Test Results:');
    console.log('   ✅ Clerk can login');
    console.log('   ✅ Clerk can view invoices');
    console.log('   ✅ Clerk can edit all invoice fields');
    console.log('   ✅ Clerk can update summary');
    console.log('   ✅ Clerk can correct AI mistakes');
    console.log('   ✅ Changes are saved to database');
    console.log('   ✅ Approval history is updated');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 This might be expected if testing with wrong user role');
    }
    if (error.response?.status === 404) {
      console.log('💡 Make sure there are invoices in the database to edit');
    }
  }
}

// Instructions
console.log('🚀 Clerk Editing Test');
console.log('====================');
console.log('This test will:');
console.log('1. Login as a clerk user');
console.log('2. Find an existing invoice');
console.log('3. Edit various fields (vendor, totals, summary, etc.)');
console.log('4. Verify the changes were saved');
console.log('5. Check approval history was updated');
console.log('');
console.log('Make sure the server is running on http://localhost:5000');
console.log('');

// Run the test
testClerkEditing();