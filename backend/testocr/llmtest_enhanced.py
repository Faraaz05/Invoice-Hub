import os
import together
import cv2
import pytesseract

# Set environment variable properly
os.environ["TOGETHER_API_KEY"] = "60a27ce30246e35ea13385882f49377a3d3a353c9d2e7b862f0eeb60e6d12eb7"

# Initialize the client
client = together.Together()

def perform_ocr(image_path):
    """Extract text from image using OCR"""
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(thresh)
        return text.strip()
    except Exception as e:
        print(f"Error performing OCR: {e}")
        return None

# Get OCR text from image
image_path = 'sample.jpg'
print(f"Performing OCR on: {image_path}")
ocr_text = perform_ocr(image_path)

if not ocr_text:
    print("Failed to extract text from image. Using sample text...")
    # Fallback to sample text
    ocr_text = """
Spice BAZAAR Pvt Ltd
308, 108, Neelam Building, Worli Sea Face Road, Worli Mumbai, Maharashtra (400018)
Email: random@spbzr.com
GSTIN:- 22BBAW7745YOY
State Name: State Code:- 9
Invoice No:-12384DSJE/2394-890
Invoice Date:- 11-Dec-2020
Invoice for the month of:- Nov-2020
Ref. No. — 144144-144
Lorem Ipsum Pvt Ltd
Building 12, PQR Infotech, Outer Ring Road, Bellandur, Bengaluru — 560103 (Karnataka).
KIND ATTN — Mr. Ramesh 9800990099
GSTIN:- 29XYZCP849101ZH
State Name: Karnataka
State Code:- 29
SNo | Description of Services | SAC Code | Quantity | Rate | Per | Amount
1. Services (Consultation) | 7383 | 4722 | 05.00 | No | 19,510.00
Non-Taxable Amount | 00.00
Taxable Amount | 19,510.00
CGST 09.00 % | 1,225.00
SGST 09.00 % | 1,225.00
Total | 22,000.00
Amount in words:- Twenty Thousand Only
Remarks:-
Company's PAN : XYY2854TTY
"""

print("\nExtracted OCR Text:")
print("-" * 50)
print(ocr_text)
print("-" * 50)

# Ask user for processing type
print("\nChoose processing option:")
print("1. Structured JSON extraction")
print("2. Human-readable summary")
choice = input("Enter your choice (1 or 2): ").strip()

if choice == "2":
    # Generate human-readable summary
    summary_prompt = f"""
Please provide a clear, human-readable summary of this invoice. Include:

1. **Transaction Overview**: Who is invoicing whom and why
2. **Key Details**: Invoice number, date, amount, and purpose
3. **Important Points**: Any notable terms, conditions, or remarks
4. **Financial Summary**: Break down of taxes and total amount

Invoice text:
{ocr_text}

Format the response in clear, conversational language that a business person would easily understand.
"""
    
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[
            {"role": "user", "content": summary_prompt}
        ],
        temperature=0.3,
        max_tokens=1024
    )
    
    print("\n" + "="*60)
    print("INVOICE SUMMARY")
    print("="*60)
    print(response.choices[0].message.content.strip())
    
else:
    # Original structured JSON extraction
    prompt = f"""
Extract structured data in JSON format from this invoice text:

{ocr_text}

Return JSON with fields:
- seller_name, seller_address, seller_email, seller_gstin, buyer_name, buyer_address, buyer_gstin
- invoice_number, invoice_date, invoice_month, reference_number
- items (list of: description, sac_code, quantity, rate, amount)
- tax (cgst, sgst, taxable_amount, total_amount)
- pan_number, amount_in_words
"""

    # Call using updated API method
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1024
    )

    # Print clean output
    print("\n" + "="*60)
    print("STRUCTURED JSON EXTRACTION")
    print("="*60)
    print(response.choices[0].message.content.strip())
