const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');

// Extract text from PDF file
const extractTextFromPDF = async (filePath) => {
  try {
    console.log('Extracting text from PDF:', filePath);
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    const extractedText = data.text.trim();
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('PDF appears to be empty or contains mostly images. Consider using image OCR.');
    }
    
    console.log(`PDF text extraction successful. Length: ${extractedText.length} characters`);
    return {
      text: extractedText,
      pages: data.numpages,
      info: data.info
    };
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Extract text from image file using Tesseract OCR
const extractTextFromImage = async (filePath) => {
  try {
    console.log('Extracting text from image using OCR:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Image file not found');
    }
    
    // Perform OCR with Tesseract
    const { data } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Validate OCR result
    if (!data) {
      throw new Error('OCR failed to return any data');
    }
    
    if (!data.text) {
      console.warn('OCR returned data but no text property found');
    }
    
    const extractedText = (data.text || '').trim();
    
    if (!extractedText || extractedText.length < 5) {
      console.warn('OCR extracted very little text. Image quality might be poor.');
    }
    
    console.log(`Image OCR successful. Length: ${extractedText.length} characters`);
    console.log(`Confidence: ${data.confidence ? data.confidence.toFixed(2) : 'N/A'}%`);
    
    return {
      text: extractedText,
      confidence: data.confidence || 0,
      words: (data.words && Array.isArray(data.words)) ? data.words.length : 0,
      blocks: (data.blocks && Array.isArray(data.blocks)) ? data.blocks.length : 0
    };
    
  } catch (error) {
    console.error('Image OCR error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

// Main function to extract text based on file type
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    const isPDF = mimeType === 'application/pdf' || fileExtension === '.pdf';
    const isImage = mimeType.startsWith('image/') || 
                   ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'].includes(fileExtension);
    
    let extractionResult;
    
    if (isPDF) {
      extractionResult = await extractTextFromPDF(filePath);
      return {
        extractedText: extractionResult.text,
        extractionMethod: 'pdf-parse',
        metadata: {
          pages: extractionResult.pages,
          pdfInfo: extractionResult.info
        }
      };
    } else if (isImage) {
      extractionResult = await extractTextFromImage(filePath);
      return {
        extractedText: extractionResult.text,
        extractionMethod: 'tesseract-ocr',
        metadata: {
          confidence: extractionResult.confidence,
          words: extractionResult.words,
          blocks: extractionResult.blocks
        }
      };
    } else {
      throw new Error('Unsupported file type. Only PDF and image files are supported.');
    }
    
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Function to clean and preprocess extracted text
const preprocessExtractedText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Reduce multiple line breaks
    .replace(/\s{2,}/g, ' ')  // Reduce multiple spaces
    .trim();
};

// Function to validate if extracted text looks like an invoice
const validateInvoiceText = (text) => {
  if (!text || text.length < 50) {
    return {
      isValid: false,
      reason: 'Text too short to be a valid invoice'
    };
  }
  
  const invoiceKeywords = [
    'invoice', 'bill', 'receipt', 'payment', 'amount', 'total', 'tax', 'gst',
    'subtotal', 'due', 'date', 'number', 'qty', 'quantity', 'price', 'item',
    'description', 'gstin', 'pan', 'address', 'rupees', '₹', 'rs.'
  ];
  
  const textLower = text.toLowerCase();
  const foundKeywords = invoiceKeywords.filter(keyword => 
    textLower.includes(keyword)
  );
  
  if (foundKeywords.length < 3) {
    return {
      isValid: false,
      reason: 'Text does not appear to be an invoice (missing key terms)',
      foundKeywords
    };
  }
  
  return {
    isValid: true,
    foundKeywords,
    confidence: (foundKeywords.length / invoiceKeywords.length) * 100
  };
};

module.exports = {
  extractTextFromFile,
  extractTextFromPDF,
  extractTextFromImage,
  preprocessExtractedText,
  validateInvoiceText
};