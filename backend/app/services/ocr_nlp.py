import cv2
import pytesseract
import numpy as np
import json
import os
from typing import Optional, Dict, Any, Tuple
import together
from PIL import Image
import io
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class OCRNLPService:
    def __init__(self):
        """Initialize the OCR and NLP service"""
        api_key = settings.together_api_key
        if not api_key:
            raise ValueError("TOGETHER_API_KEY is required in settings")
        
        self.client = together.Together(api_key=api_key)
        self.model_name = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    
    def perform_ocr(self, file_bytes: bytes) -> Optional[str]:
        """
        Extract text from uploaded image using OCR
        
        Args:
            file_bytes: Image file as bytes
            
        Returns:
            Extracted text or None if failed
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(file_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                logger.error("Failed to decode image")
                return None
            
            # Convert to grayscale and apply thresholding for better OCR
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(thresh)
            return text.strip()
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            return None
    
    def extract_structured_data(self, ocr_text: str) -> Optional[Dict[str, Any]]:
        """
        Extract structured JSON data from OCR text using LLM
        
        Args:
            ocr_text: Raw text extracted from OCR
            
        Returns:
            Structured data dictionary or None if failed
        """
        prompt = f"""
Extract structured data in JSON format from this invoice text:

{ocr_text}

Return ONLY a valid JSON object with these exact fields:
{{
    "seller_name": "",
    "seller_address": "",
    "seller_email": "",
    "seller_gstin": "",
    "buyer_name": "",
    "buyer_address": "",
    "buyer_gstin": "",
    "invoice_number": "",
    "invoice_date": "",
    "invoice_month": "",
    "reference_number": "",
    "items": [
        {{
            "description": "",
            "sac_code": "",
            "quantity": 0,
            "rate": 0.0,
            "amount": 0.0
        }}
    ],
    "tax": {{
        "cgst": 0.0,
        "sgst": 0.0,
        "taxable_amount": 0.0,
        "total_amount": 0.0
    }},
    "pan_number": "",
    "amount_in_words": ""
}}

Extract values accurately from the text. If a field is not found, leave it empty or zero.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1024
            )
            
            result = response.choices[0].message.content.strip()
            
            # Clean up the response to extract JSON
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1]
            
            # Parse and validate JSON
            structured_data = json.loads(result)
            return structured_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM response: {e}")
            return None
        except Exception as e:
            logger.error(f"Structured data extraction failed: {e}")
            return None
    
    def generate_summary(self, ocr_text: str) -> Optional[str]:
        """
        Generate human-readable summary of the invoice
        
        Args:
            ocr_text: Raw text extracted from OCR
            
        Returns:
            Human-readable summary or None if failed
        """
        summary_prompt = f"""
Provide a clear, professional summary of this invoice in 3-4 sentences. Include:
- Who is billing whom
- The service/product provided
- The total amount and key financial details
- The date and purpose

Invoice text:
{ocr_text}

Keep it concise and business-focused. Write in a professional tone suitable for business approval workflows.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": summary_prompt}],
                temperature=0.3,
                max_tokens=256
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return None
    
    def process_invoice(self, file_bytes: bytes, generate_summary: bool = True) -> Dict[str, Any]:
        """
        Complete invoice processing pipeline: OCR + NLP extraction + Summary
        
        Args:
            file_bytes: Image file as bytes
            generate_summary: Whether to generate human-readable summary
            
        Returns:
            Complete processing result with OCR text, structured data, and summary
        """
        result = {
            "success": False,
            "ocr_text": None,
            "extracted_data": None,
            "summary": None,
            "confidence_score": None,
            "error": None
        }
        
        try:
            # Step 1: Perform OCR
            logger.info("Starting OCR processing...")
            ocr_text = self.perform_ocr(file_bytes)
            
            if not ocr_text:
                result["error"] = "Failed to extract text from image"
                return result
            
            result["ocr_text"] = ocr_text
            
            # Step 2: Extract structured data
            logger.info("Extracting structured data...")
            structured_data = self.extract_structured_data(ocr_text)
            
            if not structured_data:
                result["error"] = "Failed to extract structured data"
                return result
            
            result["extracted_data"] = structured_data
            
            # Step 3: Generate summary if requested
            if generate_summary:
                logger.info("Generating summary...")
                summary = self.generate_summary(ocr_text)
                result["summary"] = summary
            
            # Calculate confidence score based on extracted fields
            confidence = self._calculate_confidence(structured_data)
            result["confidence_score"] = confidence
            
            result["success"] = True
            logger.info("Invoice processing completed successfully")
            
        except Exception as e:
            logger.error(f"Invoice processing failed: {e}")
            result["error"] = str(e)
        
        return result
    
    def _calculate_confidence(self, structured_data: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on extracted data completeness
        
        Args:
            structured_data: Extracted structured data
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        try:
            # Key fields that should be extracted for high confidence
            key_fields = [
                "seller_name", "buyer_name", "invoice_number", 
                "invoice_date", "total_amount"
            ]
            
            filled_fields = 0
            total_fields = len(key_fields)
            
            for field in key_fields:
                if field == "total_amount":
                    # Check if total amount is in tax section
                    tax_data = structured_data.get("tax", {})
                    if tax_data.get("total_amount", 0) > 0:
                        filled_fields += 1
                else:
                    value = structured_data.get(field, "")
                    if value and str(value).strip():
                        filled_fields += 1
            
            # Check if items are extracted
            items = structured_data.get("items", [])
            if items and len(items) > 0:
                filled_fields += 1
                total_fields += 1
            
            confidence = filled_fields / total_fields if total_fields > 0 else 0.0
            return round(confidence, 2)
            
        except Exception as e:
            logger.error(f"Confidence calculation failed: {e}")
            return 0.0

# Global service instance
ocr_nlp_service = OCRNLPService()
