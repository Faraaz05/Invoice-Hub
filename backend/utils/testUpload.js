const fs = require('fs');
const path = require('path');

// Create a sample text file that simulates an invoice
const sampleInvoiceText = `
INVOICE

TechCorp Solutions Pvt Ltd
Plot No. 123, Sector 18
Gurgaon, Haryana - 122015
GSTIN: 06AABCT1332L1ZZ
PAN: AABCT1332L

Invoice No: INV-2024-TEST
Date: 21-Sep-2024
Due Date: 21-Oct-2024

Bill To:
InnovateTech Industries Ltd
Building A-2, IT Park
Electronic City, Bangalore
Karnataka - 560100
GSTIN: 29AACCT5678M1Z8

Description                    HSN     Qty    Rate      Amount
Software Development Services  998314    1   500000    500000
Technical Consultation        998313   30     5000    150000
Project Management Tools      852351    5     5000     25000

                              Subtotal: ₹675,000
                                 IGST: ₹121,500
                            Grand Total: ₹796,500

Total in Words: Seven Lakh Ninety Six Thousand Five Hundred Rupees Only

Payment Terms:
- Payment due within 30 days
- Late payment charges applicable
- All disputes subject to Gurgaon jurisdiction

Bank Details:
Account: TechCorp Solutions Pvt Ltd
Account No: 1234567890123456
IFSC: HDFC0001234
Bank: HDFC Bank

Thank you for your business!
`;

// Create the sample file
const sampleFilePath = path.join(__dirname, '../uploads/invoices/sample-invoice.txt');

try {
  fs.writeFileSync(sampleFilePath, sampleInvoiceText);
  console.log('Sample invoice file created at:', sampleFilePath);
  console.log('File size:', fs.statSync(sampleFilePath).size, 'bytes');
  console.log('\nYou can now test the upload API using this file or any PDF/image invoice.');
} catch (error) {
  console.error('Error creating sample file:', error);
}

// Instructions for testing
console.log(`
=== TESTING INSTRUCTIONS ===

1. Start the server:
   npm start

2. Login to get JWT token:
   POST http://localhost:5000/api/auth/login
   {
     "email": "clerk@invoicehub.com",
     "password": "password123"
   }

3. Upload invoice file:
   POST http://localhost:5000/api/invoices/upload
   Authorization: Bearer <YOUR_JWT_TOKEN>
   Body: form-data
   Key: invoice (file)
   Value: Select any PDF or image file

4. Check the response for:
   - Extracted text in invoice.rawText
   - File path in invoice.filePath
   - OCR extraction method and metadata

5. View uploaded files at:
   http://localhost:5000/uploads/invoices/<filename>

Sample files to test with:
- Any PDF invoice
- Any image (JPG/PNG) of an invoice
- The generated sample-invoice.txt file

The system will:
✓ Extract text from PDFs using pdf-parse
✓ Extract text from images using Tesseract OCR
✓ Validate if the text contains invoice keywords
✓ Store the raw text in the database
✓ Create a minimal invoice record for verification
`);