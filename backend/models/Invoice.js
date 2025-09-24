const mongoose = require('mongoose');

// Schema for billing party details (both billedBy and billedTo)
const billingPartySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true,
    maxlength: [200, 'Party name cannot exceed 200 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  GSTIN: {
    type: String,
    trim: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, 'Invalid GSTIN format'],
    uppercase: true
  },
  PAN: {
    type: String,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
    uppercase: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'India',
    maxlength: [100, 'Country name cannot exceed 100 characters']
  }
}, { _id: false });

// Schema for invoice line items
const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  hsn: {
    type: String,
    trim: true,
    match: [/^[0-9]{2,8}$/, 'HSN should be 2-8 digits'],
    maxlength: [8, 'HSN cannot exceed 8 characters']
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  gstRate: {
    type: Number,
    required: [true, 'GST rate is required'],
    min: [0, 'GST rate cannot be negative'],
    max: [100, 'GST rate cannot exceed 100%']
  },
  taxableAmount: {
    type: Number,
    required: [true, 'Taxable amount is required'],
    min: [0, 'Taxable amount cannot be negative']
  },
  cgst: {
    type: Number,
    default: 0,
    min: [0, 'CGST cannot be negative']
  },
  sgst: {
    type: Number,
    default: 0,
    min: [0, 'SGST cannot be negative']
  },
  igst: {
    type: Number,
    default: 0,
    min: [0, 'IGST cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Item total is required'],
    min: [0, 'Total cannot be negative']
  }
}, { _id: false });

// Schema for invoice totals
const totalsSchema = new mongoose.Schema({
  subTotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  taxableAmount: {
    type: Number,
    required: [true, 'Taxable amount is required'],
    min: [0, 'Taxable amount cannot be negative']
  },
  cgstTotal: {
    type: Number,
    default: 0,
    min: [0, 'CGST total cannot be negative']
  },
  sgstTotal: {
    type: Number,
    default: 0,
    min: [0, 'SGST total cannot be negative']
  },
  igstTotal: {
    type: Number,
    default: 0,
    min: [0, 'IGST total cannot be negative']
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required'],
    min: [0, 'Grand total cannot be negative']
  },
  totalInWords: {
    type: String,
    trim: true,
    maxlength: [500, 'Total in words cannot exceed 500 characters']
  }
}, { _id: false });

// Schema for bank details
const bankDetailsSchema = new mongoose.Schema({
  accountHolder: {
    type: String,
    trim: true,
    maxlength: [200, 'Account holder name cannot exceed 200 characters']
  },
  accountNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{9,18}$/, 'Invalid account number format']
  },
  IFSC: {
    type: String,
    trim: true,
    match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
    uppercase: true
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current', 'Overdraft', 'Cash Credit'],
    trim: true
  },
  bankName: {
    type: String,
    trim: true,
    maxlength: [200, 'Bank name cannot exceed 200 characters']
  },
  upiId: {
    type: String,
    trim: true,
    match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'Invalid UPI ID format'],
    lowercase: true
  }
}, { _id: false });

// Schema for approval history
const approvalHistorySchema = new mongoose.Schema({
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Action by user is required']
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['clerk', 'manager', 'controller', 'admin']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['created', 'updated', 'approved', 'rejected', 'marked_paid', 'escalated']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, { _id: true });

// Main Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters'],
    index: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required'],
    index: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value >= this.invoiceDate;
      },
      message: 'Due date must be on or after invoice date'
    }
  },
  
  // Billing parties
  billedBy: {
    type: billingPartySchema,
    required: [true, 'Billed by details are required']
  },
  billedTo: {
    type: billingPartySchema,
    required: [true, 'Billed to details are required']
  },
  
  // Invoice items and calculations
  items: {
    type: [invoiceItemSchema],
    required: [true, 'At least one item is required'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Invoice must have at least one item'
    }
  },
  
  totals: {
    type: totalsSchema,
    required: [true, 'Invoice totals are required']
  },
  
  bankDetails: {
    type: bankDetailsSchema,
    default: {}
  },
  
  // Additional information
  terms: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each term cannot exceed 500 characters']
  }],
  
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
  },
  
  summary: {
    type: String,
    trim: true,
    maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    default: ''
  },
  
  // Workflow and status
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'paid'],
      message: 'Status must be pending, approved, rejected, or paid'
    },
    default: 'pending',
    index: true
  },
  
  approvalHistory: {
    type: [approvalHistorySchema],
    default: []
  },
  
  // Department and assignment
  department: {
    type: String,
    enum: {
      values: ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Procurement', 'Legal'],
      message: 'Department must be one of: Sales, Marketing, Operations, Finance, HR, IT, Procurement, Legal'
    },
    required: [true, 'Department is required'],
    index: true
  },

  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned manager is required'],
    index: true
  },

  // User references
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user is required'],
    index: true
  },

  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },  // File and processing information
  filePath: {
    type: String,
    trim: true,
    maxlength: [500, 'File path cannot exceed 500 characters']
  },
  
  // File storage in database
  fileData: {
    type: Buffer,
    required: false
  },
  
  fileName: {
    type: String,
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  
  fileContentType: {
    type: String,
    trim: true,
    maxlength: [100, 'Content type cannot exceed 100 characters']
  },
  
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  
  rawText: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ status: 1, invoiceDate: -1 });
invoiceSchema.index({ uploadedBy: 1, status: 1 });
invoiceSchema.index({ approver: 1, status: 1 });
invoiceSchema.index({ 'billedBy.name': 1 });
invoiceSchema.index({ 'billedTo.name': 1 });

// Virtual for checking if invoice is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'paid' && new Date() > this.dueDate;
});

// Virtual for days until due/overdue
invoiceSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const timeDiff = this.dueDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to add creation entry to approval history
invoiceSchema.pre('save', function(next) {
  if (this.isNew) {
    this.approvalHistory.push({
      actionBy: this.uploadedBy,
      role: 'clerk', // Assuming upload is done by clerk
      action: 'created',
      date: new Date(),
      comment: 'Invoice uploaded to system'
    });
  }
  next();
});

// Static method to find overdue invoices
invoiceSchema.statics.findOverdue = function() {
  return this.find({
    status: { $ne: 'paid' },
    dueDate: { $lt: new Date() }
  });
};

// Instance method to add approval history entry
invoiceSchema.methods.addApprovalEntry = function(actionBy, role, action, comment) {
  this.approvalHistory.push({
    actionBy,
    role,
    action,
    date: new Date(),
    comment
  });
  return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);