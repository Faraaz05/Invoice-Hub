const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

mongoose.connect('mongodb://localhost:27017/invoicedb')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get all invoices without populate to see raw data
    const invoices = await Invoice.find({}).select('-fileData');
    console.log('Raw invoices count:', invoices.length);
    
    if (invoices.length > 0) {
      console.log('First invoice uploadedBy:', invoices[0].uploadedBy);
      console.log('First invoice status:', invoices[0].status);
      console.log('First invoice basic info:', {
        id: invoices[0]._id,
        invoiceNumber: invoices[0].invoiceNumber,
        status: invoices[0].status,
        uploadedBy: invoices[0].uploadedBy
      });
    }
    
    // Try to populate and see if it fails
    try {
      const populatedInvoices = await Invoice.find({})
        .select('-fileData')
        .populate('uploadedBy', 'name email role');
      console.log('Populated invoices count:', populatedInvoices.length);
    } catch (err) {
      console.error('Populate error:', err.message);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });