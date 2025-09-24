const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const connectDB = require('../config/db');

// Sample GST-compliant invoice data
const sampleInvoiceData = {
  invoiceNumber: "INV-2024-001",
  invoiceDate: new Date("2024-09-15"),
  dueDate: new Date("2024-10-15"),
  
  billedBy: {
    name: "TechCorp Solutions Pvt Ltd",
    address: "Plot No. 123, Sector 18, Gurgaon, Haryana - 122015",
    GSTIN: "06AABCT1332L1ZZ",
    PAN: "AABCT1332L",
    state: "Haryana",
    country: "India"
  },
  
  billedTo: {
    name: "InnovateTech Industries Ltd",
    address: "Building A-2, IT Park, Electronic City, Bangalore, Karnataka - 560100",
    GSTIN: "29AACCT5678M1Z8",
    PAN: "AACCT5678M",
    state: "Karnataka",
    country: "India"
  },
  
  items: [
    {
      description: "Software Development Services - Q3 2024",
      hsn: "998314",
      qty: 1,
      gstRate: 18,
      taxableAmount: 500000,
      cgst: 0,
      sgst: 0,
      igst: 90000,
      total: 590000
    },
    {
      description: "Technical Consultation Services",
      hsn: "998313",
      qty: 30,
      gstRate: 18,
      taxableAmount: 150000,
      cgst: 0,
      sgst: 0,
      igst: 27000,
      total: 177000
    },
    {
      description: "Project Management Tools License",
      hsn: "852351",
      qty: 5,
      gstRate: 18,
      taxableAmount: 25000,
      cgst: 0,
      sgst: 0,
      igst: 4500,
      total: 29500
    }
  ],
  
  totals: {
    subTotal: 675000,
    discount: 0,
    taxableAmount: 675000,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 121500,
    grandTotal: 796500,
    totalInWords: "Seven Lakh Ninety Six Thousand Five Hundred Rupees Only"
  },
  
  bankDetails: {
    accountHolder: "TechCorp Solutions Pvt Ltd",
    accountNumber: "1234567890123456",
    IFSC: "HDFC0001234",
    accountType: "Current",
    bankName: "HDFC Bank",
    upiId: "techcorp@hdfc"
  },
  
  terms: [
    "Payment due within 30 days of invoice date",
    "Late payment charges of 2% per month will be applicable",
    "All disputes subject to Gurgaon jurisdiction",
    "This is a computer generated invoice"
  ],
  
  additionalNotes: "Thank you for your business. Please remit payment as per agreed terms.",
  
  summary: "Q3 2024 software development and consultation services provided as per MSA dated 01-Jan-2024. All deliverables completed successfully and accepted by client.",
  
  status: "pending",
  
  filePath: "/uploads/invoices/INV-2024-001.pdf",
  rawText: "TechCorp Solutions Pvt Ltd\nInvoice No: INV-2024-001\nDate: 15-Sep-2024\nBill To: InnovateTech Industries Ltd..."
};

const createSampleData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Create a sample clerk user if not exists
    let sampleClerk = await User.findOne({ email: 'clerk@invoicehub.com' });
    
    if (!sampleClerk) {
      console.log('Creating sample clerk user...');
      const passwordHash = await bcrypt.hash('password123', 12);
      sampleClerk = await User.create({
        name: 'Sample Clerk',
        email: 'clerk@invoicehub.com',
        passwordHash,
        role: 'clerk'
      });
      console.log('Sample clerk user created:', sampleClerk.email);
    }

    // Check if sample invoice already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber: sampleInvoiceData.invoiceNumber });
    
    if (existingInvoice) {
      console.log('Sample invoice already exists:', sampleInvoiceData.invoiceNumber);
      return existingInvoice;
    }

    // Create sample invoice
    console.log('Creating sample invoice...');
    const invoice = await Invoice.create({
      ...sampleInvoiceData,
      uploadedBy: sampleClerk._id
    });

    console.log('Sample invoice created successfully:');
    console.log('Invoice Number:', invoice.invoiceNumber);
    console.log('Invoice ID:', invoice._id);
    console.log('Grand Total:', invoice.totals.grandTotal);
    console.log('Status:', invoice.status);
    
    return invoice;
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Function to fetch and display the sample invoice
const fetchSampleInvoice = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    const invoice = await Invoice.findOne({ invoiceNumber: "INV-2024-001" })
      .populate('uploadedBy', 'name email role')
      .populate('approver', 'name email role')
      .populate('approvalHistory.actionBy', 'name email role');
    
    if (!invoice) {
      console.log('Sample invoice not found');
      return;
    }
    
    console.log('\n=== SAMPLE INVOICE RETRIEVED ===');
    console.log('Invoice Number:', invoice.invoiceNumber);
    console.log('Invoice Date:', invoice.invoiceDate.toDateString());
    console.log('Due Date:', invoice.dueDate.toDateString());
    console.log('Billed By:', invoice.billedBy.name);
    console.log('Billed To:', invoice.billedTo.name);
    console.log('Items Count:', invoice.items.length);
    console.log('Grand Total: ₹', invoice.totals.grandTotal.toLocaleString('en-IN'));
    console.log('Status:', invoice.status);
    console.log('Uploaded By:', invoice.uploadedBy.name, `(${invoice.uploadedBy.email})`);
    console.log('Approval History:', invoice.approvalHistory.length, 'entries');
    console.log('Created At:', invoice.createdAt.toDateString());
    console.log('Is Overdue:', invoice.isOverdue);
    console.log('Days Until Due:', invoice.daysUntilDue);
    
    return invoice;
    
  } catch (error) {
    console.error('Error fetching sample invoice:', error);
  } finally {
    mongoose.connection.close();
  }
};

module.exports = {
  createSampleData,
  fetchSampleInvoice,
  sampleInvoiceData
};

// Run if called directly
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'create') {
    createSampleData();
  } else if (action === 'fetch') {
    fetchSampleInvoice();
  } else {
    console.log('Usage: node sampleInvoiceSeeder.js [create|fetch]');
  }
}