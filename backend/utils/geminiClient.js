const { GoogleGenAI } = require('@google/genai');

class GeminiClient {
  constructor() {
    this.modelName = 'gemini-2.5-flash';
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        // Try OpenRouter before final fallback
        const promptNoKey = this.buildAnalysisPrompt(rawText);
        const orResultNoKey = await this.tryOpenRouter(promptNoKey, rawText, 'No GEMINI_API_KEY found');
        if (orResultNoKey) return orResultNoKey;
        return this.getFallbackResponse(rawText, 'No GEMINI_API_KEY found in environment');
      } else if (apiKey === 'your_gemini_api_key_here') {
        console.log('❌ Default placeholder API key detected');
        // Try OpenRouter before final fallback
        const promptBadKey = this.buildAnalysisPrompt(rawText);
        const orResultBadKey = await this.tryOpenRouter(promptBadKey, rawText, 'Default placeholder API key');
        if (orResultBadKey) return orResultBadKey;
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
      
      console.log(`\n🌐 Making Gemini API request with ${this.modelName}...`);
      
      const requestStartTime = Date.now();
      
      // Initialize Google Gen AI
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Make the API call with retry logic
      let response;
      let attempt = 1;
      
      while (attempt <= this.maxRetries) {
        try {
          console.log(`� API Request attempt ${attempt}/${this.maxRetries}`);
          
          response = await ai.models.generateContent({
            model: this.modelName,
            contents: prompt
          });
          
          break; // Success, exit retry loop
          
        } catch (error) {
          const shouldRetry = attempt < this.maxRetries && 
                             (error.message?.includes('503') || 
                              error.message?.includes('429') || 
                              error.message?.includes('500') ||
                              error.message?.includes('overloaded'));
          
          if (shouldRetry) {
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retry ${attempt}/${this.maxRetries} after ${delay}ms`);
            await this.sleep(delay);
            attempt++;
          } else {
            // If we can't/shouldn't retry Gemini, try OpenRouter fallback immediately
            console.log('🔁 Switching to OpenRouter due to Gemini error:', error.message);
            const orResultMid = await this.tryOpenRouter(prompt, rawText, `Gemini error (no-retry): ${error.message}`);
            if (orResultMid) return orResultMid;
            throw error;
          }
        }
      }

      const requestDuration = Date.now() - requestStartTime;
      console.log(`\n📡 API Response received in ${requestDuration}ms`);
      console.log(`📊 Response received successfully`);
      
      const aiResponseText = response.text;
      
      if (!aiResponseText) {
        console.log('❌ No AI response text found in API response');
        // Attempt OpenRouter before failing
        const orResultEmpty = await this.tryOpenRouter(prompt, rawText, 'Gemini returned empty response');
        if (orResultEmpty) return orResultEmpty;
        throw new Error('Invalid response from Gemini API - no text content');
      }

      console.log(`📏 Response length: ${aiResponseText.length} characters`);
      console.log(`🔤 First 200 chars: ${aiResponseText.substring(0, 200)}...`);

      console.log('\n🔍 Parsing AI response...');
      const result = this.parseAIResponse(aiResponseText);
      
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
      
      // Handle different error types
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        console.log('💡 QUOTA ISSUE: Gemini API quota exceeded');
        console.log('   - Attempting OpenRouter fallback...');
        const prompt = this.buildAnalysisPrompt(rawText);
        const orResult = await this.tryOpenRouter(prompt, rawText, 'Gemini quota exceeded');
        if (orResult) return orResult;
      } else if (error.message?.includes('403') || error.message?.includes('API key not valid')) {
        console.log('💡 PERMISSION ISSUE: API key may be invalid');
        const prompt = this.buildAnalysisPrompt(rawText);
        const orResult = await this.tryOpenRouter(prompt, rawText, 'Gemini API key invalid');
        if (orResult) return orResult;
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log('💡 MODEL ISSUE: Model not found or API not enabled');
        const prompt = this.buildAnalysisPrompt(rawText);
        const orResult = await this.tryOpenRouter(prompt, rawText, 'Gemini model not accessible');
        if (orResult) return orResult;
      } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        console.log('💡 SERVICE ISSUE: Gemini service temporarily unavailable');
        const prompt = this.buildAnalysisPrompt(rawText);
        const orResult = await this.tryOpenRouter(prompt, rawText, 'Gemini service overloaded');
        if (orResult) return orResult;
      }
      
      console.log(`   Stack: ${error.stack}`);
      console.log('\n🔄 Falling back to basic OCR extraction...');
      
      // Return fallback response on error
      return this.getFallbackResponse(rawText, `API request failed: ${error.message}`);
    }
  }

  /**
   * Try OpenRouter as a fallback LLM provider
   * This uses dynamic import to work in CommonJS and ESM environments.
   * @param {string} prompt - The analysis prompt
   * @param {string} rawText - Original OCR text (for fallback if needed)
   * @param {string} reason - Reason for switching to OpenRouter (for logging)
   * @returns {Promise<object|null>} Parsed result or null if OpenRouter not available
   */
  async tryOpenRouter(prompt, rawText, reason = 'fallback') {
    try {
      console.log('\n🚦 Attempting OpenRouter fallback...', `Reason: ${reason}`);
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.log('❌ OPENROUTER_API_KEY not set. Skipping OpenRouter fallback.');
        return null;
      }

      // Dynamic import to support ESM-only SDK in CommonJS project
      const { OpenRouter } = await import('@openrouter/sdk');

      const openRouter = new OpenRouter({
        apiKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost',
          'X-Title': process.env.OPENROUTER_SITE_NAME || 'Invoice Hub',
        },
      });

      const model = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';
      console.log(`🧠 OpenRouter model: ${model}`);

      const completion = await openRouter.chat.send({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false,
      });

      const text = completion?.choices?.[0]?.message?.content;
      if (!text) {
        console.log('❌ OpenRouter returned no content');
        return null;
      }

      console.log('📩 OpenRouter response received. Parsing...');
      const parsed = this.parseAIResponse(text);
      // Mark source as openrouter for visibility
      parsed.source = 'openrouter';
      console.log('✅ OpenRouter fallback successful');
      return parsed;
    } catch (e) {
      console.log('❌ OpenRouter fallback failed:', e.message);
      return null;
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