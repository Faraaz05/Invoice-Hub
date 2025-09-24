const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Invoice = require('./models/Invoice');
const { notifyNewInvoice, notifyEscalation } = require('./utils/sendEmail');

require('dotenv').config();

async function testEmailWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB for email testing');
    
    // Create test users if they don't exist
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const clerk = await User.findOne({ role: 'clerk' }) || await User.create({
      name: 'Test Clerk',
      email: 'clerk@test.com',
      passwordHash: hashedPassword,
      role: 'clerk'
    });
    
    const manager = await User.findOne({ role: 'manager' }) || await User.create({
      name: 'Test Manager',
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      role: 'manager'
    });
    
    const controller = await User.findOne({ role: 'controller' }) || await User.create({
      name: 'Test Controller',
      email: 'controller@test.com',
      passwordHash: hashedPassword,
      role: 'controller'
    });
    
    console.log('👥 Test users ready');
    
    // Create a test invoice
    const testInvoice = new Invoice({
      invoiceNumber: 'TEST-INV-' + Date.now(),
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      
      billedBy: {
        name: 'Test Vendor Pvt Ltd',
        address: '123 Test Street, Test City, Test State - 123456',
        GSTIN: '27AAAPT1234C1Z5',
        PAN: 'AAAPT1234C',
        state: 'Maharashtra',
        country: 'India'
      },
      
      billedTo: {
        name: 'Test Client Ltd',
        address: '456 Client Avenue, Client City, Client State - 654321',
        GSTIN: '29BBBPT5678C1Z1',
        PAN: 'BBBPT5678C',
        state: 'Karnataka',
        country: 'India'
      },
      
      items: [{
        description: 'Test Product/Service',
        hsn: '1234',
        qty: 10,
        gstRate: 18,
        taxableAmount: 1000,
        cgst: 90,
        sgst: 90,
        igst: 0,
        total: 1180
      }],
      
      totals: {
        subTotal: 1000,
        discount: 0,
        taxableAmount: 1000,
        cgstTotal: 90,
        sgstTotal: 90,
        igstTotal: 0,
        grandTotal: 600000, // High value to trigger escalation
        totalInWords: 'Six Lakh Rupees Only'
      },
      
      uploadedBy: clerk._id,
      status: 'pending',
      summary: 'Test invoice for email notification workflow'
    });
    
    await testInvoice.save();
    console.log('📄 Test invoice created');
    
    // Test 1: New invoice notification to managers
    console.log('\n📧 Testing new invoice notification...');
    const managers = [manager];
    await notifyNewInvoice(testInvoice, managers, clerk);
    
    // Simulate manager approval
    testInvoice.status = 'approved';
    testInvoice.approver = manager._id;
    await testInvoice.addApprovalEntry(manager._id, 'manager', 'approved', 'Approved for payment');
    
    // Test 2: High-value escalation notification to controllers
    console.log('\n🚨 Testing escalation notification...');
    const controllers = [controller];
    const populatedInvoice = await Invoice.findById(testInvoice._id)
      .populate('uploadedBy', 'name email role')
      .populate('approver', 'name email role');
      
    await notifyEscalation(populatedInvoice, controllers, manager);
    
    console.log('\n✅ Email workflow test completed successfully!');
    console.log('📧 Check the console output above for email notifications');
    
    // Cleanup
    await Invoice.findByIdAndDelete(testInvoice._id);
    console.log('🧹 Test invoice cleaned up');
    
  } catch (error) {
    console.error('❌ Email workflow test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}

testEmailWorkflow();