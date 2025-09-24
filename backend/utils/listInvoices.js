const mongoose = require('mongoose');
require('dotenv').config();

// Import the Invoice model
const Invoice = require('../models/Invoice');

async function listInvoices() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/invoicedb');
    console.log('Connected to MongoDB');

    // Fetch all invoices with basic info
    console.log('Fetching all invoices...');
    const invoices = await Invoice.find({})
      .select('_id invoiceNumber fileName fileContentType fileSize fileData createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (invoices.length === 0) {
      console.log('No invoices found in the database.');
      return;
    }

    console.log(`\n📋 Found ${invoices.length} invoices:\n`);
    
    invoices.forEach((invoice, index) => {
      console.log(`${index + 1}. Invoice ID: ${invoice._id}`);
      console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
      console.log(`   File Name: ${invoice.fileName || 'N/A'}`);
      console.log(`   Content Type: ${invoice.fileContentType || 'N/A'}`);
      console.log(`   File Size: ${invoice.fileSize || 'N/A'} bytes`);
      console.log(`   Created: ${invoice.createdAt}`);
      console.log(`   Has File Data: ${invoice.fileData ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error listing invoices:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

listInvoices();