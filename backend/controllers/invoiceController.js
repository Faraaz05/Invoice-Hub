const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { extractTextFromFile, validateInvoiceText, preprocessExtractedText } = require('../utils/ocrUtils');
const { analyzeInvoice } = require('../utils/geminiClient');
const { notifyNewInvoice, notifyEscalation } = require('../utils/sendEmail');
const { cleanupFile } = require('../middleware/uploadMiddleware');
const path = require('path');

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      uploadedBy: req.user.id
    };

    const invoice = await Invoice.create(invoiceData);
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('uploadedBy', 'name email role')
      .populate('approver', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating invoice'
    });
  }
};

// Get all invoices with filtering and pagination
const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      vendor,
      invoiceNumber,
      department,
      minAmount,
      maxAmount,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (vendor) {
      filter['billedBy.name'] = { $regex: vendor, $options: 'i' };
    }
    
    if (invoiceNumber) {
      filter.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
    }
    
    if (department) {
      filter.department = department;
    }
    
    // Amount range filtering
    if (minAmount || maxAmount) {
      filter['totals.grandTotal'] = {};
      if (minAmount) {
        filter['totals.grandTotal'].$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter['totals.grandTotal'].$lte = parseFloat(maxAmount);
      }
    }

    // Role-based filtering
    if (req.user.role === 'manager') {
      // Managers see invoices assigned to them or from their department
      filter.assignedManager = req.user.id;
    } else if (req.user.role === 'controller') {
      // Controllers see only approved invoices ready for payment
      filter.status = 'approved';
    }
    // Clerks and Admins see all invoices (no additional filtering)

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find(filter)
      .select('-fileData')  // Exclude file data from list view for performance
      .populate('uploadedBy', 'name email role')
      .populate('assignedManager', 'name email role department')
      .populate('approver', 'name email role')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices'
    });
  }
};

// Get single invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .select('-fileData')  // Exclude file data from invoice details for performance
      .populate('uploadedBy', 'name email role')
      .populate('assignedManager', 'name email role department')
      .populate('approver', 'name email role')
      .populate('approvalHistory.actionBy', 'name email role');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice'
    });
  }
};

// Update invoice (for verification/editing)
const updateInvoice = async (req, res) => {
  try {
    console.log('\n🔄 === INVOICE UPDATE STARTED ===');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`👤 User: ${req.user?.name} (${req.user?.email}) - Role: ${req.user?.role}`);
    console.log(`🆔 Invoice ID: ${req.params.id}`);
    console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`🗓️ Raw Invoice Date: "${req.body.invoiceDate}" (${typeof req.body.invoiceDate})`);
    console.log(`🗓️ Raw Due Date: "${req.body.dueDate}" (${typeof req.body.dueDate})`);

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (req.user.role === 'clerk' && invoice.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit invoices you uploaded'
      });
    }

    if (invoice.status === 'approved' || invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit approved or paid invoices'
      });
    }

    // Parse dates properly before updating
    const updateData = { ...req.body };
    
    // Enhanced date parsing function for updates
    const parseUpdateDate = (dateValue) => {
      if (!dateValue) return null;
      
      // If it's already a Date object, return it
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        console.log(`🔄 Parsing date string: "${dateValue}"`);
        
        // Try MM/DD/YYYY format first (common in US)
        const mmddyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, month, day, year] = mmddyyyyMatch;
          const parsedDate = new Date(year, month - 1, day);
          console.log(`✅ Parsed MM/DD/YYYY: ${dateValue} -> ${parsedDate.toISOString()}`);
          return parsedDate;
        }
        
        // Try DD/MM/YYYY format
        const ddmmyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          // Assume DD/MM/YYYY if day > 12 or if this makes more sense
          if (parseInt(day) > 12 || parseInt(month) <= 12) {
            const parsedDate = new Date(year, month - 1, day);
            console.log(`✅ Parsed DD/MM/YYYY: ${dateValue} -> ${parsedDate.toISOString()}`);
            return parsedDate;
          }
        }
        
        // Try ISO format or other standard formats
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          console.log(`✅ Parsed ISO/standard: ${dateValue} -> ${parsedDate.toISOString()}`);
          return parsedDate;
        }
      }
      
      console.log(`❌ Failed to parse date: ${dateValue} (${typeof dateValue})`);
      return null;
    };

    // Parse invoice date if provided
    if (updateData.invoiceDate) {
      updateData.invoiceDate = parseUpdateDate(updateData.invoiceDate);
    }
    
    // Parse due date if provided
    if (updateData.dueDate) {
      updateData.dueDate = parseUpdateDate(updateData.dueDate);
    }

    console.log('\n📅 === UPDATE DATE PROCESSING ===');
    console.log(`Invoice Date: ${updateData.invoiceDate ? updateData.invoiceDate.toISOString() : 'Not provided'}`);
    console.log(`Due Date: ${updateData.dueDate ? updateData.dueDate.toISOString() : 'Not provided'}`);
    
    // Validate dates before update
    if (updateData.invoiceDate && updateData.dueDate) {
      if (updateData.dueDate < updateData.invoiceDate) {
        console.log('❌ Due date validation failed in controller');
        return res.status(400).json({
          success: false,
          message: `Due date (${updateData.dueDate.toDateString()}) cannot be before invoice date (${updateData.invoiceDate.toDateString()})`
        });
      }
      console.log('✅ Date validation passed in controller');
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email role')
     .populate('approver', 'name email role');

    // Add update entry to approval history
    await updatedInvoice.addApprovalEntry(
      req.user.id,
      req.user.role,
      'updated',
      'Invoice details updated'
    );

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating invoice'
    });
  }
};

// Approve/Reject invoice
const approveRejectInvoice = async (req, res) => {
  try {
    const { action, comment } = req.body;
    
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either approved or rejected'
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} invoice with status: ${invoice.status}`
      });
    }

    // Check if user has approval rights
    if (!['manager', 'controller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have approval rights'
      });
    }

    // Check if manager is assigned to this invoice
    if (req.user.role === 'manager' && invoice.assignedManager.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve/reject invoices assigned to your department'
      });
    }

    invoice.status = action;
    invoice.approver = req.user.id;
    
    await invoice.addApprovalEntry(
      req.user.id,
      req.user.role,
      action,
      comment || `Invoice ${action} by ${req.user.role}`
    );

    // Check for high-value escalation (if approved by manager)
    if (action === 'approved' && req.user.role === 'manager') {
      const isHighValue = invoice.totals?.grandTotal >= (process.env.HIGH_VALUE_THRESHOLD || 500000);
      
      if (isHighValue) {
        console.log(`💰 High-value invoice detected (₹${invoice.totals.grandTotal}). Notifying controllers for escalation.`);
        
        try {
          const controllers = await User.find({ role: { $in: ['controller', 'admin'] } }).select('name email');
          if (controllers.length > 0) {
            const populatedInvoice = await Invoice.findById(invoice._id)
              .populate('uploadedBy', 'name email role')
              .populate('approver', 'name email role');
              
            notifyEscalation(populatedInvoice, controllers, req.user).catch(error => {
              console.error('Escalation email notification failed:', error);
            });
          }
        } catch (emailError) {
          console.error('Error finding controllers for escalation:', emailError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${action} successfully`,
      data: invoice
    });

  } catch (error) {
    console.error('Approve/Reject invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing invoice approval'
    });
  }
};

// Mark invoice as paid
const markAsPaid = async (req, res) => {
  try {
    const { transactionId, paymentDate, comment } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved invoices can be marked as paid'
      });
    }

    // Check if user has payment marking rights
    if (!['controller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have rights to mark invoices as paid'
      });
    }

    invoice.status = 'paid';
    
    await invoice.addApprovalEntry(
      req.user.id,
      req.user.role,
      'marked_paid',
      comment || `Payment processed. Transaction ID: ${transactionId}, Payment Date: ${paymentDate}`
    );

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: invoice
    });

  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking invoice as paid'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get pending approvals count
    const pendingApprovals = await Invoice.countDocuments({
      status: 'pending'
    });

    // Get monthly spend
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlySpendResult = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'rejected' }
        }
      },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$totals.grandTotal' }
        }
      }
    ]);

    const monthlySpend = monthlySpendResult.length > 0 ? monthlySpendResult[0].totalSpend : 0;

    // Get overdue invoices count
    const overdueInvoices = await Invoice.countDocuments({
      dueDate: { $lt: new Date() },
      status: 'pending'
    });

    // Get recent invoices
    const recentInvoices = await Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id invoiceNumber status totals.grandTotal createdAt billedBy.name');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          pendingApprovals,
          monthlySpend,
          overdueInvoices,
          totalInvoices: await Invoice.countDocuments({})
        },
        recentInvoices
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Upload invoice file and extract text using OCR
const uploadInvoice = async (req, res) => {
  let filePath = null;
  const startTime = Date.now();
  
  console.log('\n🚀 === INVOICE UPLOAD STARTED ===');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`👤 User: ${req.user?.name} (${req.user?.email}) - Role: ${req.user?.role}`);
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ ERROR: No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if department was selected
    const selectedDepartment = req.body.department;
    if (!selectedDepartment) {
      console.log('❌ ERROR: No department selected');
      return res.status(400).json({
        success: false,
        message: 'Please select a department for this invoice'
      });
    }

    console.log(`🏢 Department: ${selectedDepartment}`);

    // Find the manager for the selected department (case-insensitive)
    const departmentManager = await User.findOne({ 
      role: 'manager', 
      department: { $regex: new RegExp(`^${selectedDepartment}$`, 'i') }
    });

    if (!departmentManager) {
      console.log(`❌ ERROR: No manager found for ${selectedDepartment} department`);
      return res.status(400).json({
        success: false,
        message: `No manager found for ${selectedDepartment} department. Please contact admin to assign a manager.`
      });
    }

    console.log(`👨‍💼 Assigned Manager: ${departmentManager.name} (${departmentManager.email})`);

    filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    console.log(`📄 File Details:`);
    console.log(`   Original Name: ${originalName}`);
    console.log(`   File Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   MIME Type: ${mimeType}`);
    console.log(`   Temp Path: ${filePath}`);

    // Read file data into buffer for database storage
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`💾 File buffer created: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // Extract text from the uploaded file
    let extractionResult;
    let rawText = '';
    
    console.log('\n🔍 === OCR EXTRACTION PHASE ===');
    try {
      const ocrStartTime = Date.now();
      extractionResult = await extractTextFromFile(filePath, mimeType);
      rawText = preprocessExtractedText(extractionResult.extractedText);
      const ocrDuration = Date.now() - ocrStartTime;
      
      console.log(`✅ OCR Extraction Successful:`);
      console.log(`   Method: ${extractionResult.extractionMethod}`);
      console.log(`   Text Length: ${rawText.length} characters`);
      console.log(`   Processing Time: ${ocrDuration}ms`);
      console.log(`   Extracted Text Preview: "${rawText.substring(0, 100)}..."`);
    } catch (ocrError) {
      console.error('❌ OCR extraction failed:', ocrError.message);
      
      // For OCR failures, we'll still save the file but with minimal text
      extractionResult = {
        extractedText: `OCR extraction failed: ${ocrError.message}`,
        extractionMethod: 'failed',
        metadata: { error: ocrError.message }
      };
      rawText = extractionResult.extractedText;
    }

    // Validate if the extracted text looks like an invoice
    // Skip validation if OCR failed - allow manual processing
    console.log('\n📋 === INVOICE VALIDATION PHASE ===');
    const validation = extractionResult.extractionMethod === 'failed' 
      ? { isValid: true, reason: 'OCR failed - manual processing required', foundKeywords: [] }
      : validateInvoiceText(rawText);
    
    console.log(`🔍 Validation Result:`);
    console.log(`   Valid: ${validation.isValid}`);
    console.log(`   Reason: ${validation.reason || 'Passed validation'}`);
    console.log(`   Keywords Found: ${validation.foundKeywords?.join(', ') || 'None'}`);
    
    if (!validation.isValid) {
      console.log('❌ Validation failed - cleaning up file');
      // Clean up the uploaded file
      cleanupFile(filePath);
      
      return res.status(400).json({
        success: false,
        message: `Invalid invoice file: ${validation.reason}`,
        details: {
          foundKeywords: validation.foundKeywords || [],
          textLength: rawText.length,
          suggestion: 'Try uploading a clearer image or a text-based PDF'
        }
      });
    }

    // Analyze invoice with Gemini AI to extract structured data
    console.log('\n🤖 === AI ANALYSIS PHASE ===');
    let aiAnalysis;
    try {
      const aiStartTime = Date.now();
      console.log('🚀 Sending request to Gemini AI...');
      console.log(`📊 Text to analyze: ${rawText.length} characters`);
      
      aiAnalysis = await analyzeInvoice(rawText);
      const aiDuration = Date.now() - aiStartTime;
      
      console.log(`✅ AI Analysis Completed:`);
      console.log(`   Processing Time: ${aiDuration}ms`);
      console.log(`   Fields Extracted: ${Object.keys(aiAnalysis.structuredJson || {}).length}`);
      console.log(`   Invoice Number: ${aiAnalysis.structuredJson?.invoiceNumber || 'Not detected'}`);
      console.log(`   Grand Total: ₹${aiAnalysis.structuredJson?.totals?.grandTotal || 0}`);
    } catch (aiError) {
      console.error('❌ AI analysis failed:', aiError.message);
      // Continue with fallback data - the analyzeInvoice function handles fallbacks internally
      aiAnalysis = await analyzeInvoice(rawText); // This will return fallback data
    }

    const structuredData = aiAnalysis.structuredJson;
    const aiSummary = aiAnalysis.summary;

    // Safe date parsing function
    const parseDate = (dateString, fallbackDate = new Date()) => {
      if (!dateString) {
        console.log(`⚠️  No date provided, using fallback: ${fallbackDate.toISOString()}`);
        return fallbackDate;
      }
      
      console.log(`📅 Parsing date: "${dateString}" (type: ${typeof dateString})`);
      
      // If it's already a Date object, validate it
      if (dateString instanceof Date) {
        if (isNaN(dateString.getTime())) {
          console.log(`❌ Invalid Date object, using fallback: ${fallbackDate.toISOString()}`);
          return fallbackDate;
        }
        console.log(`✅ Valid Date object: ${dateString.toISOString()}`);
        return dateString;
      }
      
      // Try parsing various date formats
      const formats = [
        // ISO format
        () => new Date(dateString),
        // DD/MM/YYYY format (common in India)
        () => {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
        },
        // DD-MM-YYYY format
        () => {
          const parts = dateString.split('-');
          if (parts.length === 3 && parts[0].length <= 2) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
        },
        // YYYY-MM-DD format
        () => {
          const parts = dateString.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
          }
          return null;
        }
      ];
      
      for (let i = 0; i < formats.length; i++) {
        try {
          const parsedDate = formats[i]();
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            console.log(`✅ Successfully parsed with format ${i + 1}: ${parsedDate.toISOString()}`);
            return parsedDate;
          }
        } catch (error) {
          console.log(`❌ Format ${i + 1} failed: ${error.message}`);
        }
      }
      
      console.log(`❌ All date parsing attempts failed for "${dateString}", using fallback: ${fallbackDate.toISOString()}`);
      return fallbackDate;
    };

    console.log('\n📅 === DATE PROCESSING ===');
    const parsedInvoiceDate = parseDate(structuredData.invoiceDate, new Date());
    
    // Only parse due date if it's provided (not null)
    let parsedDueDate = null;
    if (structuredData.dueDate && structuredData.dueDate !== null) {
      parsedDueDate = parseDate(structuredData.dueDate, null);
      
      // Ensure due date is not before invoice date
      if (parsedDueDate && parsedDueDate < parsedInvoiceDate) {
        console.log('⚠️  Due date is before invoice date, adjusting...');
        parsedDueDate.setTime(parsedInvoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        console.log(`✅ Adjusted due date: ${parsedDueDate.toISOString()}`);
      }
    } else {
      console.log('ℹ️  No due date found in invoice, leaving as null');
    }

    // Use AI-extracted data or fallback to default values
    const invoiceData = {
      invoiceNumber: structuredData.invoiceNumber || `TEMP-${Date.now()}`,
      invoiceDate: parsedInvoiceDate,
      dueDate: parsedDueDate, // Will be null if not provided in invoice
      
      billedBy: {
        name: structuredData.billedBy?.name || 'Pending Verification',
        address: structuredData.billedBy?.address || 'Pending Verification',
        city: structuredData.billedBy?.city || 'Pending',
        state: structuredData.billedBy?.state || 'Pending',
        pincode: structuredData.billedBy?.pincode || '000000',
        country: structuredData.billedBy?.country || 'India',
        gstin: structuredData.billedBy?.gstin || 'Pending Verification',
        email: structuredData.billedBy?.email || '',
        phone: structuredData.billedBy?.phone || ''
      },
      
      billedTo: {
        name: structuredData.billedTo?.name || 'Pending Verification',
        address: structuredData.billedTo?.address || 'Pending Verification',
        city: structuredData.billedTo?.city || 'Pending',
        state: structuredData.billedTo?.state || 'Pending',
        pincode: structuredData.billedTo?.pincode || '000000',
        country: structuredData.billedTo?.country || 'India',
        gstin: structuredData.billedTo?.gstin || 'Pending Verification'
      },
      
      items: structuredData.items && structuredData.items.length > 0 ? structuredData.items : [{
        description: 'Pending Verification',
        hsnCode: '0000',
        qty: 1,
        unit: 'nos',
        rate: 0,
        gstRate: 18,
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0
      }],
      
      totals: {
        subTotal: structuredData.totals?.subTotal || 0,
        discount: structuredData.totals?.discount || 0,
        taxableAmount: structuredData.totals?.taxableAmount || 0,
        cgstTotal: structuredData.totals?.cgstTotal || 0,
        sgstTotal: structuredData.totals?.sgstTotal || 0,
        igstTotal: structuredData.totals?.igstTotal || 0,
        grandTotal: structuredData.totals?.grandTotal || 0,
        totalInWords: structuredData.totals?.totalInWords || 'Pending Verification'
      },
      
      paymentTerms: structuredData.paymentTerms || 'As per agreement',
      notes: structuredData.notes || 'Extracted using AI analysis',
      
      // Department assignment
      department: selectedDepartment,
      assignedManager: departmentManager._id,
      
      // OCR and file information
      filePath: `/uploads/invoices/${fileName}`,
      fileData: fileBuffer,
      fileName: originalName,
      fileContentType: mimeType,
      fileSize: fileSize,
      rawText: rawText,
      summary: aiSummary,
      
      uploadedBy: req.user.id,
      status: 'pending'
    };

    // Create invoice record with AI-extracted structured data
    console.log('\n💾 === DATABASE STORAGE PHASE ===');
    console.log('📋 Validating invoice data before saving...');
    
    // Validate dates
    console.log(`📅 Invoice Date: ${invoiceData.invoiceDate} (${invoiceData.invoiceDate instanceof Date ? 'Date' : typeof invoiceData.invoiceDate})`);
    console.log(`📅 Due Date: ${invoiceData.dueDate ? invoiceData.dueDate : 'null (optional)'} (${invoiceData.dueDate instanceof Date ? 'Date' : typeof invoiceData.dueDate})`);
    
    if (!invoiceData.invoiceDate || isNaN(invoiceData.invoiceDate.getTime())) {
      throw new Error('Invalid invoice date');
    }
    
    // Only validate due date if it's provided (since it's optional)
    if (invoiceData.dueDate && isNaN(invoiceData.dueDate.getTime())) {
      throw new Error('Invalid due date');
    }
    
    // Only check due date vs invoice date if due date is provided
    if (invoiceData.dueDate && invoiceData.dueDate < invoiceData.invoiceDate) {
      throw new Error('Due date cannot be before invoice date');
    }
    
    console.log('✅ Date validation passed');
    console.log('📊 Invoice data structure:');
    console.log(`   - Invoice Number: ${invoiceData.invoiceNumber}`);
    console.log(`   - Invoice Date: ${invoiceData.invoiceDate.toISOString()}`);
    console.log(`   - Due Date: ${invoiceData.dueDate ? invoiceData.dueDate.toISOString() : 'Not specified'}`);
    console.log(`   - Billed By: ${invoiceData.billedBy.name}`);
    console.log(`   - Billed To: ${invoiceData.billedTo.name}`);
    console.log(`   - Items count: ${invoiceData.items.length}`);
    console.log(`   - Grand Total: ₹${invoiceData.totals.grandTotal}`);
    
    const dbStartTime = Date.now();
    const invoice = await Invoice.create(invoiceData);
    const dbDuration = Date.now() - dbStartTime;
    
    console.log(`✅ Invoice saved to database:`);
    console.log(`   Invoice ID: ${invoice._id}`);
    console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`   Storage Time: ${dbDuration}ms`);

    // Clean up the temporary file from disk since it's now stored in database
    cleanupFile(filePath);
    console.log(`🗑️  Temporary file cleaned up: ${filePath}`);

    // Populate the response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('uploadedBy', 'name email role')
      .populate('assignedManager', 'name email role department');

    // Notify managers about new invoice (async - don't wait for email)
    console.log('\n📧 === EMAIL NOTIFICATION PHASE ===');
    try {
      // Notify the assigned manager directly
      console.log(`📩 Sending notification to assigned manager for invoice: ${invoice.invoiceNumber}`);
      console.log(`   Manager: ${departmentManager.name} (${departmentManager.email}) - ${selectedDepartment} Department`);
      notifyNewInvoice(populatedInvoice, [departmentManager]).catch(error => {
        console.error('❌ Email notification failed:', error);
      });
    } catch (emailError) {
      console.error('❌ Error in email notification:', emailError);
    }

    const totalDuration = Date.now() - startTime;
    console.log('\n🎉 === UPLOAD COMPLETED SUCCESSFULLY ===');
    console.log(`⏱️  Total Processing Time: ${totalDuration}ms`);
    console.log(`📊 Processing Breakdown:`);
    console.log(`   File Upload: ✅`);
    console.log(`   OCR Extraction: ✅ (${extractionResult.extractionMethod})`);
    console.log(`   AI Analysis: ✅ (${Object.keys(aiAnalysis.structuredJson || {}).length} fields)`);
    console.log(`   Database Storage: ✅`);
    console.log(`   Email Notifications: ✅`);
    console.log('===============================================\n');

    // Send success response with OCR and AI analysis results
    res.status(201).json({
      success: true,
      message: 'Invoice uploaded and processed successfully with AI analysis',
      data: {
        invoice: populatedInvoice,
        file: {
          originalName,
          fileName,
          size: fileSize,
          mimeType
        },
        extraction: {
          method: extractionResult.extractionMethod,
          textLength: rawText.length,
          validation: {
            isValid: validation.isValid || false,
            confidence: validation.confidence || 0,
            foundKeywords: validation.foundKeywords || [],
            reason: validation.reason || 'Unknown'
          },
          metadata: extractionResult.metadata || {}
        },
        aiAnalysis: {
          processed: true,
          summary: aiSummary,
          fieldsExtracted: Object.keys(structuredData).length,
          itemsCount: structuredData.items?.length || 0,
          grandTotal: structuredData.totals?.grandTotal || 0
        }
      }
    });

  } catch (error) {
    console.error('Upload invoice error:', error);
    
    // Clean up file on error
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing uploaded invoice',
      error: error.message
    });
  }
};

// Serve invoice file from database
const getInvoiceFile = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).select('fileData fileName fileContentType fileSize uploadedBy');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.fileData) {
      return res.status(404).json({
        success: false,
        message: 'No file data found for this invoice'
      });
    }

    // All authenticated users can download invoice files
    // (Removed clerk restriction - clerks can download any invoice)

    // Set appropriate headers
    res.set({
      'Content-Type': invoice.fileContentType,
      'Content-Length': invoice.fileSize,
      'Content-Disposition': `inline; filename="${invoice.fileName}"`,
      'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
    });

    // Send the file buffer
    res.send(invoice.fileData);

  } catch (error) {
    console.error('Get invoice file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoice file'
    });
  }
};

// Preview invoice (extract data without saving)
const previewInvoice = async (req, res) => {
  let filePath = null;
  const startTime = Date.now();
  
  console.log('\n🔍 === INVOICE PREVIEW STARTED ===');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`👤 User: ${req.user?.name} (${req.user?.email}) - Role: ${req.user?.role}`);
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ ERROR: No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    console.log(`📄 File Details:`);
    console.log(`   Original Name: ${originalName}`);
    console.log(`   File Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   MIME Type: ${mimeType}`);
    console.log(`   Temp Path: ${filePath}`);

    // Read file data into buffer for potential database storage
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`💾 File buffer created: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // Extract text from the uploaded file
    let extractionResult;
    let rawText = '';
    
    console.log('\n🔍 === OCR EXTRACTION PHASE ===');
    try {
      const ocrStartTime = Date.now();
      extractionResult = await extractTextFromFile(filePath, mimeType);
      rawText = preprocessExtractedText(extractionResult.extractedText);
      const ocrDuration = Date.now() - ocrStartTime;
      
      console.log(`✅ OCR Extraction Successful:`);
      console.log(`   Method: ${extractionResult.extractionMethod}`);
      console.log(`   Text Length: ${rawText.length} characters`);
      console.log(`   Processing Time: ${ocrDuration}ms`);
    } catch (ocrError) {
      console.error('❌ OCR extraction failed:', ocrError.message);
      extractionResult = {
        extractedText: `OCR extraction failed: ${ocrError.message}`,
        extractionMethod: 'failed',
        metadata: { error: ocrError.message }
      };
      rawText = extractionResult.extractedText;
    }

    // Validate if the extracted text looks like an invoice
    console.log('\n📋 === INVOICE VALIDATION PHASE ===');
    const validation = extractionResult.extractionMethod === 'failed' 
      ? { isValid: true, reason: 'OCR failed - manual processing required', foundKeywords: [] }
      : validateInvoiceText(rawText);
    
    if (!validation.isValid) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: `Invalid invoice file: ${validation.reason}`,
        details: {
          foundKeywords: validation.foundKeywords || [],
          textLength: rawText.length,
          suggestion: 'Try uploading a clearer image or a text-based PDF'
        }
      });
    }

    // Analyze invoice with Gemini AI to extract structured data
    console.log('\n🤖 === AI ANALYSIS PHASE ===');
    let aiAnalysis;
    try {
      const aiStartTime = Date.now();
      aiAnalysis = await analyzeInvoice(rawText);
      const aiDuration = Date.now() - aiStartTime;
      
      console.log(`✅ AI Analysis Completed in ${aiDuration}ms`);
    } catch (aiError) {
      console.error('❌ AI analysis failed:', aiError.message);
      aiAnalysis = await analyzeInvoice(rawText); // Fallback
    }

    const structuredData = aiAnalysis.structuredJson;

    // Format dates for frontend
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
    };

    // Store file data in session/temp storage for later saving
    req.session = req.session || {};
    const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.session[tempFileId] = {
      fileBuffer,
      fileName,
      originalName,
      mimeType,
      fileSize,
      rawText,
      extractionResult,
      aiAnalysis
    };

    const previewData = {
      tempFileId,
      invoiceNumber: structuredData.invoiceNumber || `TEMP-${Date.now()}`,
      invoiceDate: formatDate(structuredData.invoiceDate),
      dueDate: formatDate(structuredData.dueDate),
      billedBy: structuredData.billedBy || {},
      billedTo: structuredData.billedTo || {},
      items: structuredData.items || [],
      totals: structuredData.totals || {},
      paymentTerms: structuredData.paymentTerms || 'As per agreement',
      notes: structuredData.notes || 'Extracted using AI analysis'
    };

    // Clean up temp file
    cleanupFile(filePath);

    const totalDuration = Date.now() - startTime;
    console.log(`\n🔍 Preview completed in ${totalDuration}ms`);

    res.status(200).json({
      success: true,
      message: 'Invoice processed successfully - ready for validation',
      data: {
        previewData,
        fileInfo: { originalName, size: fileSize, mimeType },
        aiAnalysis: {
          summary: aiAnalysis.summary,
          fieldsExtracted: Object.keys(structuredData).length,
          processingTime: totalDuration
        }
      }
    });

  } catch (error) {
    console.error('Preview invoice error:', error);
    if (filePath) cleanupFile(filePath);
    
    res.status(500).json({
      success: false,
      message: 'Error processing uploaded invoice',
      error: error.message
    });
  }
};

// Save confirmed invoice after validation
const saveConfirmedInvoice = async (req, res) => {
  try {
    const { invoiceData, tempFileId } = req.body;
    
    console.log('\n💾 === SAVING CONFIRMED INVOICE ===');
    console.log(`👤 User: ${req.user?.name} - tempFileId: ${tempFileId}`);

    // Retrieve temp file data from session
    if (!req.session || !req.session[tempFileId]) {
      return res.status(400).json({
        success: false,
        message: 'File session expired. Please re-upload the file.'
      });
    }

    const tempData = req.session[tempFileId];
    
    // Parse dates
    const parseDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    const finalInvoiceData = {
      ...invoiceData,
      invoiceDate: parseDate(invoiceData.invoiceDate),
      dueDate: parseDate(invoiceData.dueDate),
      
      // File data from temp storage
      filePath: `/uploads/invoices/${tempData.fileName}`,
      fileData: tempData.fileBuffer,
      fileName: tempData.originalName,
      fileContentType: tempData.mimeType,
      fileSize: tempData.fileSize,
      rawText: tempData.rawText,
      
      uploadedBy: req.user.id,
      status: 'pending'
    };

    const invoice = await Invoice.create(finalInvoiceData);
    
    // Clean up temp session data
    delete req.session[tempFileId];

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('uploadedBy', 'name email role');

    console.log(`✅ Invoice saved: ${invoice.invoiceNumber} (${invoice._id})`);

    res.status(201).json({
      success: true,
      message: 'Invoice saved successfully',
      data: { invoice: populatedInvoice }
    });

  } catch (error) {
    console.error('Save confirmed invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving invoice',
      error: error.message
    });
  }
};

// Get department analytics for managers
const getDepartmentAnalytics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const userDepartment = req.user.department;
    const userId = req.user.id;

    // Check if user is manager or higher
    if (!['manager', 'controller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role or higher required.'
      });
    }

    // Build query filter - managers see their department, admins see all
    const baseFilter = {};

    // Only apply date filtering if timeframe is specified
    if (timeframe) {
      const now = new Date();
      const startDate = new Date(now);
      
      switch (timeframe) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '12months':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          // If invalid timeframe, don't apply date filter
          break;
      }

      // Only add date filter if we have a valid timeframe
      if (['1month', '3months', '6months', '12months'].includes(timeframe)) {
        baseFilter.invoiceDate = { $gte: startDate, $lte: now };
      }
    }

    if (req.user.role === 'manager') {
      baseFilter.department = userDepartment;
    }

    console.log('Analytics Query Filter:', {
      baseFilter,
      timeframeApplied: !!timeframe,
      timeframe: timeframe || 'all',
      userRole: req.user.role,
      userDepartment
    });

    // Get all invoices for the period
    const invoices = await Invoice.find(baseFilter)
      .populate('uploadedBy', 'name email')
      .populate('assignedManager', 'name email')
      .sort({ invoiceDate: -1 });

    console.log(`Found ${invoices.length} invoices for analytics`);
    
    // Also get all invoices for this department to debug
    const allDeptInvoices = await Invoice.find(
      req.user.role === 'manager' ? { department: userDepartment } : {}
    ).select('invoiceNumber invoiceDate department status totals createdAt');
    
    console.log('All department invoices:', allDeptInvoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
      department: inv.department,
      status: inv.status,
      total: inv.totals?.grandTotal
    })));

    // Calculate overview metrics
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totals?.grandTotal || 0), 0);
    
    // Calculate average processing time (from invoice date to approval/rejection)
    const processedInvoices = invoices.filter(inv => 
      ['approved', 'rejected', 'paid'].includes(inv.status) && 
      inv.approvalHistory && 
      inv.approvalHistory.length > 0
    );
    
    let avgProcessingTime = 0;
    if (processedInvoices.length > 0) {
      const totalProcessingTime = processedInvoices.reduce((sum, inv) => {
        const lastApproval = inv.approvalHistory[inv.approvalHistory.length - 1];
        const processingTime = (new Date(lastApproval.timestamp) - new Date(inv.invoiceDate)) / (1000 * 60 * 60 * 24);
        return sum + processingTime;
      }, 0);
      avgProcessingTime = totalProcessingTime / processedInvoices.length;
    }

    // Calculate approval rate
    const approvedInvoices = invoices.filter(inv => ['approved', 'paid'].includes(inv.status));
    const approvalRate = totalInvoices > 0 ? (approvedInvoices.length / totalInvoices) * 100 : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: invoices.filter(inv => inv.status === 'pending').length,
      approved: invoices.filter(inv => inv.status === 'approved').length,
      rejected: invoices.filter(inv => inv.status === 'rejected').length,
      paid: invoices.filter(inv => inv.status === 'paid').length
    };

    // Quarterly trends
    const quarterlyTrends = [];
    
    // Group invoices by quarter
    const quarterlyData = {};
    invoices.forEach(invoice => {
      const date = new Date(invoice.invoiceDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const quarter = Math.ceil(month / 3); // 1-4
      const quarterKey = `${year}-Q${quarter}`;
      const quarterLabel = `Q${quarter} ${year}`;
      
      if (!quarterlyData[quarterKey]) {
        quarterlyData[quarterKey] = {
          quarter: quarterLabel,
          invoiceCount: 0,
          totalAmount: 0
        };
      }
      
      quarterlyData[quarterKey].invoiceCount++;
      quarterlyData[quarterKey].totalAmount += invoice.totals?.grandTotal || 0;
    });

    // Convert to array and sort by quarter (last 8 quarters / 2 years)
    Object.keys(quarterlyData)
      .sort()
      .slice(-8) // Last 8 quarters
      .forEach(key => {
        quarterlyTrends.push(quarterlyData[key]);
      });

    // Top vendors analysis
    const vendorData = {};
    invoices.forEach(invoice => {
      const vendorName = invoice.billedBy?.name || 'Unknown Vendor';
      if (!vendorData[vendorName]) {
        vendorData[vendorName] = {
          name: vendorName,
          invoiceCount: 0,
          totalAmount: 0
        };
      }
      vendorData[vendorName].invoiceCount++;
      vendorData[vendorName].totalAmount += invoice.totals?.grandTotal || 0;
    });

    const topVendors = Object.values(vendorData)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5); // Top 5 vendors

    // Department performance metrics (if admin, show all departments)
    let departmentStats = [];
    if (req.user.role === 'admin') {
      const departments = ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Procurement', 'Legal'];
      
      for (const dept of departments) {
        const deptInvoices = invoices.filter(inv => inv.department === dept);
        if (deptInvoices.length > 0) {
          const deptApproved = deptInvoices.filter(inv => ['approved', 'paid'].includes(inv.status));
          departmentStats.push({
            department: dept,
            totalInvoices: deptInvoices.length,
            totalAmount: deptInvoices.reduce((sum, inv) => sum + (inv.totals?.grandTotal || 0), 0),
            approvalRate: (deptApproved.length / deptInvoices.length) * 100
          });
        }
      }
    }

    const analyticsData = {
      overview: {
        totalInvoices,
        totalAmount,
        avgProcessingTime,
        approvalRate
      },
      statusBreakdown,
      quarterlyTrends,
      topVendors,
      departmentStats,
      timeframe: timeframe || 'all',
      department: req.user.role === 'manager' ? userDepartment : 'All Departments'
    };

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  approveRejectInvoice,
  markAsPaid,
  getDashboardStats,
  uploadInvoice,
  previewInvoice,
  saveConfirmedInvoice,
  getInvoiceFile,
  getDepartmentAnalytics
};