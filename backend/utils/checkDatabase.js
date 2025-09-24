const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/invoicedb');
    console.log('Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Available collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check invoices collection specifically
    console.log('\n🔍 Checking invoices collection...');
    const invoicesCount = await mongoose.connection.db.collection('invoices').countDocuments();
    console.log(`Total invoices: ${invoicesCount}`);

    if (invoicesCount > 0) {
      const invoices = await mongoose.connection.db.collection('invoices')
        .find({})
        .project({ _id: 1, invoiceNumber: 1, fileName: 1, fileContentType: 1, fileSize: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log('\n📋 Recent invoices:');
      invoices.forEach((invoice, index) => {
        console.log(`${index + 1}. ID: ${invoice._id}`);
        console.log(`   Invoice Number: ${invoice.invoiceNumber || 'N/A'}`);
        console.log(`   File Name: ${invoice.fileName || 'N/A'}`);
        console.log(`   Content Type: ${invoice.fileContentType || 'N/A'}`);
        console.log(`   File Size: ${invoice.fileSize || 'N/A'} bytes`);
        console.log(`   Created: ${invoice.createdAt || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

checkDatabase();