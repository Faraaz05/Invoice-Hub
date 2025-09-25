const axios = require('axios');

class GeminiClient {
  constructor() {
    // Use the working free API endpoint with gemini-2.5-flash
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Analyze invoice text using Gemini AI to extract structured data
   * @param {string} rawText - Raw OCR text from invoice
   * @returns {Promise<{structuredJson: object, summary: string}>}
   */
  async analyzeInvoice(rawText) {
    console.log('\n🤖 === GEMINI AI ANALYSIS START ===');
    const startTime = Date.now();
    
    try {
      // API Key validation
      const apiKey = this.getApiKey();
      console.log('🔑 API Key Check:');
      if (!apiKey) {
        console.log('❌ No GEMINI_API_KEY found in environment');
        return this.getFallbackResponse(rawText, 'No GEMINI_API_KEY found in environment');
      } else if (apiKey === 'your_gemini_api_key_here') {
        console.log('❌ Default placeholder API key detected');
        return this.getFallbackResponse(rawText, 'Default placeholder API key detected');
      } else {
        console.log(`✅ API Key present: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
        console.log(`📏 API Key length: ${apiKey.length} characters`);
      }

      console.log('\n📄 Input Text Analysis:');
      console.log(`📝 Text length: ${rawText.length} characters`);
      console.log(`🔤 First 100 chars: ${rawText.substring(0, 100)}...`);
      console.log(`🔤 Last 100 chars: ...${rawText.slice(-100)}`);
      
      console.log('\n📋 Building analysis prompt...');
      const prompt = this.buildAnalysisPrompt(rawText);
      console.log(`📏 Prompt length: ${prompt.length} characters`);
      
      console.log('\n🌐 Making Gemini API request...');
      const fullUrl = `${this.baseURL}?key=${apiKey}`;
      console.log(`🎯 Full URL: ${fullUrl.substring(0, fullUrl.indexOf('?key=') + 5)}***`);
      console.log(`🔑 API Key length: ${apiKey.length} characters`);
      console.log(`🔑 API Key prefix: ${apiKey.substring(0, 10)}...`);
      console.log('📦 Request payload structure:');
      console.log('   - contents[0].parts[0].text: [PROMPT]');
      
      const requestStartTime = Date.now();
      
      const response = await axios.post(
        fullUrl,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      const requestDuration = Date.now() - requestStartTime;
      console.log(`\n📡 API Response received in ${requestDuration}ms`);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log('📋 Response structure:');
      console.log('   - data:', !!response.data);
      console.log('   - candidates:', response.data?.candidates?.length || 0);
      
      if (response.data?.candidates?.[0]) {
        const candidate = response.data.candidates[0];
        console.log('   - content:', !!candidate.content);
        console.log('   - parts:', candidate.content?.parts?.length || 0);
        console.log('   - finishReason:', candidate.finishReason || 'none');
        
        if (candidate.content?.parts?.[0]?.text) {
          const aiResponseText = candidate.content.parts[0].text;
          console.log(`   - response length: ${aiResponseText.length} characters`);
          console.log(`   - first 200 chars: ${aiResponseText.substring(0, 200)}...`);
        }
      }

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        console.log('❌ No AI response text found in API response');
        console.log('Full response data:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from Gemini API - no text content');
      }

      console.log('\n🔍 Parsing AI response...');
      const result = this.parseAIResponse(aiResponse);
      
      const totalDuration = Date.now() - startTime;
      console.log(`\n✅ Gemini AI analysis completed in ${totalDuration}ms`);
      console.log('🎯 Analysis results:');
      console.log(`   - Structured fields: ${Object.keys(result.structuredJson || {}).length}`);
      console.log(`   - Summary length: ${result.summary?.length || 0} characters`);
      console.log('===============================\n');
      
      return result;

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.log(`\n❌ Gemini AI analysis failed after ${totalDuration}ms`);
      console.log('💥 Error details:');
      console.log(`   Name: ${error.name}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code || 'No code'}`);
      
      if (error.response) {
        console.log(`   HTTP Status: ${error.response.status}`);
        console.log(`   Response data:`, error.response.data);
        
        // Provide specific error messages for common issues
        if (error.response.status === 429) {
          console.log('💡 QUOTA ISSUE: Gemini API quota exceeded');
          console.log('   - Check your API key billing and quota limits');
          console.log('   - Visit: https://ai.google.dev/gemini-api/docs/rate-limits');
          return this.getFallbackResponse(rawText, 'Gemini API quota exceeded - check billing settings');
        } else if (error.response.status === 403) {
          console.log('💡 PERMISSION ISSUE: API key may be invalid or lacks permissions');
          return this.getFallbackResponse(rawText, 'Gemini API key invalid or lacks permissions');
        } else if (error.response.status === 404) {
          console.log('💡 MODEL ISSUE: Model not found or not accessible');
          return this.getFallbackResponse(rawText, 'Gemini model not found or not accessible');
        } else if (error.response.status === 503) {
          console.log('💡 SERVICE ISSUE: Gemini service temporarily unavailable');
          return this.getFallbackResponse(rawText, 'Gemini service temporarily overloaded');
        }
      }
      
      if (error.request) {
        console.log('   Request made but no response received');
        console.log(`   Request URL: ${error.config?.url || 'unknown'}`);
      }
      
      console.log(`   Stack trace: ${error.stack}`);
      console.log('\n🔄 Falling back to basic OCR extraction...');
      
      // Return fallback response on error
      return this.getFallbackResponse(rawText, `API request failed: ${error.message}`);
    }
  }

  /**
   * Build the analysis prompt for Gemini AI
   */
  buildAnalysisPrompt(rawText) {
    return `
You are an expert invoice data extraction AI. Analyze the following OCR text from an invoice and extract structured data that matches the Indian GST invoice format.

OCR TEXT:
${rawText}

Please extract and return the data in the following JSON format. If any field is not found or unclear, use reasonable defaults or "Pending Verification". 

IMPORTANT: For dueDate - ONLY extract if explicitly mentioned in the invoice. If no due date is mentioned, set it to null. Do NOT hallucinate or assume a due date:

{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null if not specified",
  "billedBy": {
    "name": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "India",
    "gstin": "string",
    "email": "string",
    "phone": "string"
  },
  "billedTo": {
    "name": "string",
    "address": "string",
    "city": "string", 
    "state": "string",
    "pincode": "string",
    "country": "India",
    "gstin": "string"
  },
  "items": [
    {
      "description": "string",
      "hsnCode": "string",
      "qty": number,
      "unit": "string",
      "rate": number,
      "gstRate": number,
      "taxableAmount": number,
      "cgst": number,
      "sgst": number,
      "igst": number,
      "total": number
    }
  ],
  "totals": {
    "subTotal": number,
    "discount": number,
    "taxableAmount": number,
    "cgstTotal": number,
    "sgstTotal": number,
    "igstTotal": number,
    "grandTotal": number,
    "totalInWords": "string"
  },
  "paymentTerms": "string",
  "notes": "string",
  "summary": "A human-readable summary of this invoice including vendor, total amount, key items, and any important details."
}

IMPORTANT:
1. Return ONLY valid JSON, no other text
2. Ensure all numbers are actual numbers, not strings
3. Use Indian date format interpretation (DD/MM/YYYY or DD-MM-YYYY)
4. Calculate GST amounts correctly: CGST+SGST = Total GST (for intra-state), IGST for inter-state
5. Ensure grand total matches the sum of taxable amount + total GST
6. The summary should be conversational and informative

If the text is not clearly an invoice, return a JSON with minimal fields and summary explaining the issue.
`;
  }

  /**
   * Parse AI response and extract JSON and summary
   */
  parseAIResponse(aiResponse) {
    console.log('\n🔍 === PARSING AI RESPONSE ===');
    console.log(`📏 Raw response length: ${aiResponse.length} characters`);
    
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = aiResponse.trim();
      console.log('🧹 Original response type:', typeof aiResponse);
      console.log('🧹 After trim length:', cleanResponse.length);
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        console.log('📝 Removing ```json markdown wrapper');
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        console.log('📝 Removing ``` markdown wrapper');
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      console.log('🧹 After markdown removal length:', cleanResponse.length);
      console.log('🔤 Clean response preview (first 300 chars):');
      console.log(cleanResponse.substring(0, 300));
      
      console.log('\n🔍 Attempting JSON parse...');
      const parsed = JSON.parse(cleanResponse);
      console.log('✅ JSON parsing successful!');
      
      // Extract summary and structure
      const summary = parsed.summary || 'AI analysis completed successfully.';
      console.log(`📋 Summary extracted: ${summary.substring(0, 100)}...`);
      
      delete parsed.summary; // Remove summary from structured data
      
      console.log('📊 Structured data keys:', Object.keys(parsed));
      console.log('🎯 Key validation:');
      console.log(`   - invoiceNumber: ${parsed.invoiceNumber ? '✅' : '❌'}`);
      console.log(`   - billedBy: ${parsed.billedBy ? '✅' : '❌'}`);
      console.log(`   - billedTo: ${parsed.billedTo ? '✅' : '❌'}`);
      console.log(`   - items: ${parsed.items?.length || 0} items`);
      console.log(`   - totals: ${parsed.totals ? '✅' : '❌'}`);
      
      console.log('===============================\n');
      
      return {
        success: true,
        source: 'gemini',
        structuredJson: parsed,
        summary: summary
      };

    } catch (parseError) {
      console.log('❌ JSON parsing failed!');
      console.log(`💥 Parse error: ${parseError.message}`);
      console.log('🔍 Attempting to extract JSON from response...');
      
      // Try to extract any JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🎯 Found JSON pattern in response');
        console.log(`📏 Extracted JSON length: ${jsonMatch[0].length}`);
        
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted JSON parsing successful!');
          
          const summary = parsed.summary || 'AI analysis completed with parsing issues.';
          delete parsed.summary;
          
          return {
            success: true,
            source: 'gemini',
            structuredJson: parsed,
            summary: summary
          };
        } catch (extractError) {
          console.log('❌ Extracted JSON parsing also failed:', extractError.message);
        }
      } else {
        console.log('❌ No JSON pattern found in response');
      }
      
      console.log('🔄 Using fallback response due to parsing failure');
      return this.getFallbackResponse('AI parsing failed');
    }
  }

  /**
   * Fallback response when AI is not available or fails
   */
  getFallbackResponse(rawText, fallbackReason = 'AI analysis failed') {
    console.log('🔄 Using fallback invoice data extraction');
    console.log(`⚠️  Fallback reason: ${fallbackReason}`);
    
    return {
      success: false,
      source: 'fallback',
      fallbackReason: fallbackReason,
      structuredJson: {
        invoiceNumber: this.extractInvoiceNumber(rawText) || 'Pending Verification',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billedBy: {
          name: 'Pending Verification',
          address: 'Pending Verification',
          city: 'Pending',
          state: 'Pending',
          pincode: '000000',
          country: 'India',
          gstin: 'Pending Verification'
        },
        billedTo: {
          name: 'Pending Verification', 
          address: 'Pending Verification',
          city: 'Pending',
          state: 'Pending',
          pincode: '000000',
          country: 'India',
          gstin: 'Pending Verification'
        },
        items: [{
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
          subTotal: 0,
          discount: 0,
          taxableAmount: 0,
          cgstTotal: 0,
          sgstTotal: 0,
          igstTotal: 0,
          grandTotal: this.extractTotalAmount(rawText) || 0,
          totalInWords: 'Pending Verification'
        },
        paymentTerms: 'As per agreement',
        notes: 'OCR extracted data - requires manual verification'
      },
      summary: `Invoice processed with OCR. ${rawText.length > 100 ? 'Extracted ' + rawText.length + ' characters of text.' : ''} Manual verification and data entry required for accurate information.`
    };
  }

  /**
   * Simple regex-based extraction for fallback
   */
  extractInvoiceNumber(text) {
    const patterns = [
      /invoice\s*(?:#|no\.?|number)?\s*:?\s*([a-z0-9\-\/]+)/i,
      /inv\s*(?:#|no\.?)?\s*:?\s*([a-z0-9\-\/]+)/i,
      /bill\s*(?:#|no\.?)?\s*:?\s*([a-z0-9\-\/]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  extractTotalAmount(text) {
    const patterns = [
      /total\s*:?\s*₹?\s*([\d,]+(?:\.\d{2})?)/i,
      /grand\s*total\s*:?\s*₹?\s*([\d,]+(?:\.\d{2})?)/i,
      /amount\s*:?\s*₹?\s*([\d,]+(?:\.\d{2})?)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }
}

// Export singleton instance
const geminiClient = new GeminiClient();

module.exports = {
  analyzeInvoice: (rawText) => geminiClient.analyzeInvoice(rawText)
};