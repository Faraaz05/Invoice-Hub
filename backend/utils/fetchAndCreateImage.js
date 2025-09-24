const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the Invoice model
const Invoice = require('../models/Invoice');

async function fetchAndCreateImage(invoiceId) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/invoicedb');
    console.log('Connected to MongoDB');

    // Fetch the invoice with the binary data
    console.log(`Fetching invoice with ID: ${invoiceId}`);
    const invoice = await Invoice.findById(invoiceId).select('fileData fileName fileContentType fileSize');
    
    if (!invoice) {
      console.error('Invoice not found!');
      return;
    }

    if (!invoice.fileData) {
      console.error('No file data found for this invoice!');
      return;
    }

    console.log(`Found invoice file:`);
    console.log(`- File Name: ${invoice.fileName}`);
    console.log(`- Content Type: ${invoice.fileContentType}`);
    console.log(`- File Size: ${invoice.fileSize} bytes`);
    console.log(`- Binary Data Size: ${invoice.fileData.length} bytes`);

    // Determine file extension from content type or original filename
    let extension = '';
    if (invoice.fileContentType) {
      if (invoice.fileContentType.includes('jpeg') || invoice.fileContentType.includes('jpg')) {
        extension = '.jpg';
      } else if (invoice.fileContentType.includes('png')) {
        extension = '.png';
      } else if (invoice.fileContentType.includes('pdf')) {
        extension = '.pdf';
      }
    }
    
    // Fallback to original filename extension
    if (!extension && invoice.fileName) {
      extension = path.extname(invoice.fileName);
    }

    // Create output filename
    const outputFilename = `recovered-invoice-${invoiceId}${extension}`;
    const outputPath = path.join(__dirname, '..', 'recovered-files', outputFilename);
    
    // Create directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the binary data to file
    console.log(`Writing file to: ${outputPath}`);
    fs.writeFileSync(outputPath, invoice.fileData);
    
    console.log('✅ File successfully recovered!');
    console.log(`📁 File saved as: ${outputPath}`);
    console.log(`📊 File size: ${fs.statSync(outputPath).size} bytes`);
    
    // Verify the file was written correctly
    const writtenSize = fs.statSync(outputPath).size;
    if (writtenSize === invoice.fileData.length) {
      console.log('✅ File integrity verified - sizes match!');
    } else {
      console.log('Warning: File sizes don\'t match!');
      console.log(`Expected: ${invoice.fileData.length} bytes`);
      console.log(`Written: ${writtenSize} bytes`);
    }

  } catch (error) {
    console.error('Error fetching and creating image:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Get invoice ID from command line argument or use default
const invoiceId = process.argv[2] || '68cf7f99eb9a22d0bda4b454';

console.log(`🔍 Fetching binary data for invoice ID: ${invoiceId}`);
fetchAndCreateImage(invoiceId);