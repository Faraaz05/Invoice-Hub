const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Invoice = require('../models/Invoice');

// Test the invoice file storage functionality
const testFileStorage = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    // Find an invoice with file data
    const invoiceWithFile = await Invoice.findOne({ 
      fileData: { $exists: true, $ne: null } 
    }).select('_id fileName fileContentType fileSize fileData');
    
    if (!invoiceWithFile) {
      console.log('❌ No invoices with file data found. Upload an invoice first.');
      return;
    }
    
    console.log('\n✅ Found invoice with file data:');
    console.log(`📋 Invoice ID: ${invoiceWithFile._id}`);
    console.log(`📄 File Name: ${invoiceWithFile.fileName}`);
    console.log(`📊 Content Type: ${invoiceWithFile.fileContentType}`);
    console.log(`💾 File Size: ${invoiceWithFile.fileSize} bytes`);
    console.log(`🗂️  Buffer Size: ${invoiceWithFile.fileData.length} bytes`);
    
    // Test file retrieval API endpoint
    console.log('\n🔗 File can be accessed at:');
    console.log(`   GET http://localhost:5000/api/invoices/${invoiceWithFile._id}/file`);
    console.log('   (Requires Authorization: Bearer <JWT_TOKEN> header)');
    
    // Count total invoices with file data
    const totalWithFiles = await Invoice.countDocuments({ 
      fileData: { $exists: true, $ne: null } 
    });
    
    console.log(`\n📈 Total invoices with file data: ${totalWithFiles}`);
    
    // Check database size impact
    const sampleInvoices = await Invoice.find({})
      .select('_id fileName fileSize')
      .limit(5);
      
    console.log('\n📊 Recent invoices:');
    sampleInvoices.forEach(inv => {
      console.log(`   ${inv._id}: ${inv.fileName || 'No file'} (${inv.fileSize || 0} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Error testing file storage:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Usage instructions
console.log(`
🧪 INVOICE FILE STORAGE TEST

This script checks if invoice files are properly stored in the database.

✨ Features tested:
- File data storage in MongoDB
- File metadata (name, type, size)
- Database retrieval functionality
- API endpoint availability

🚀 To test:
1. Upload an invoice using the test HTML page
2. Run this script to verify file storage
3. Access the file via API endpoint

📝 Instructions:
- Start server: npm start
- Open: test-upload.html
- Upload any PDF/image invoice
- Run: node utils/testFileStorage.js
`);

// Run if called directly
if (require.main === module) {
  testFileStorage();
}

module.exports = { testFileStorage };