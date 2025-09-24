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
      if (!dateString) return fallbackDate;
      
      // If it's already a Date object, validate it
      if (dateString instanceof Date) {
        if (isNaN(dateString.getTime())) return fallbackDate;
        return dateString;
      }
      
      // Try parsing various date formats
      const formats = [
        () => new Date(dateString),
        () => {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
        },
        () => {
          const parts = dateString.split('-');
          if (parts.length === 3 && parts[0].length <= 2) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
          return null;
        },
        () => {
          const parts = dateString.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
          }
          return null;
        }
      ];
      
      for (const format of formats) {
        try {
          const parsedDate = format();
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        } catch (error) {
          continue;
        }
      }
      
      return fallbackDate;
    };

    const parsedInvoiceDate = parseDate(structuredData.invoiceDate, new Date());
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const parsedDueDate = parseDate(structuredData.dueDate, defaultDueDate);
    
    // Ensure due date is not before invoice date
    if (parsedDueDate < parsedInvoiceDate) {
      parsedDueDate.setTime(parsedInvoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Prepare invoice data for preview (not saved to database)
    const previewData = {
      invoiceNumber: structuredData.invoiceNumber || `TEMP-${Date.now()}`,
      invoiceDate: parsedInvoiceDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      dueDate: parsedDueDate.toISOString().split('T')[0],
      
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
      notes: structuredData.notes || 'Extracted using AI analysis'
    };

    // Store file temporarily for later saving (when user confirms)
    const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up temp file - we'll re-upload when confirmed
    cleanupFile(filePath);

    const totalDuration = Date.now() - startTime;
    console.log('\n🔍 === PREVIEW COMPLETED SUCCESSFULLY ===');
    console.log(`⏱️  Total Processing Time: ${totalDuration}ms`);
    console.log('===============================================\n');

    // Send preview response with extracted data for validation
    res.status(200).json({
      success: true,
      message: 'Invoice processed successfully - ready for validation',
      data: {
        previewData,
        tempFileId,
        fileInfo: {
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
          grandTotal: structuredData.totals?.grandTotal || 0,
          processingTime: totalDuration
        },
        rawText // Include raw text for reference
      }
    });

  } catch (error) {
    console.error('Preview invoice error:', error);
    
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

module.exports = { previewInvoice };