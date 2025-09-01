import streamlit as st
import sqlite3
import json
import cv2
import pytesseract
import os
import together
from datetime import datetime
import pandas as pd
from io import BytesIO
import base64
import numpy as np

# Set page config
st.set_page_config(
    page_title="Invoice Processor Pro",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    
    .feature-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
        margin: 1rem 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #1f77b4;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .json-container {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .summary-container {
        background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class InvoiceProcessor:
    def __init__(self):
        self.api_key = "60a27ce30246e35ea13385882f49377a3d3a353c9d2e7b862f0eeb60e6d12eb7"
        os.environ["TOGETHER_API_KEY"] = self.api_key
        self.client = together.Together()
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for storing invoice data"""
        conn = sqlite3.connect('invoices.db')
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            seller_name TEXT,
            seller_address TEXT,
            seller_email TEXT,
            seller_gstin TEXT,
            buyer_name TEXT,
            buyer_address TEXT,
            buyer_gstin TEXT,
            invoice_number TEXT,
            invoice_date TEXT,
            invoice_month TEXT,
            reference_number TEXT,
            total_amount REAL,
            taxable_amount REAL,
            cgst REAL,
            sgst REAL,
            pan_number TEXT,
            amount_in_words TEXT,
            raw_json TEXT,
            summary TEXT,
            ocr_text TEXT
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            description TEXT,
            sac_code TEXT,
            quantity REAL,
            rate REAL,
            amount REAL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def perform_ocr(self, image_file):
        """Extract text from uploaded image using OCR"""
        try:
            # Convert uploaded file to opencv format
            file_bytes = np.asarray(bytearray(image_file.read()), dtype=np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            text = pytesseract.image_to_string(thresh)
            return text.strip()
        except Exception as e:
            st.error(f"Error performing OCR: {e}")
            return None
    
    def extract_structured_data(self, ocr_text):
        """Extract structured JSON data from OCR text"""
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
"""
        
        try:
            response = self.client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
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
            
            return json.loads(result)
        except Exception as e:
            st.error(f"Error extracting structured data: {e}")
            return None
    
    def generate_summary(self, ocr_text):
        """Generate human-readable summary"""
        summary_prompt = f"""
Provide a clear, professional summary of this invoice in 3-4 sentences. Include:
- Who is billing whom
- The service/product provided
- The total amount and key financial details
- The date and purpose

Invoice text:
{ocr_text}

Keep it concise and business-focused.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                messages=[{"role": "user", "content": summary_prompt}],
                temperature=0.3,
                max_tokens=256
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            st.error(f"Error generating summary: {e}")
            return None
    
    def save_to_database(self, filename, structured_data, summary, ocr_text):
        """Save processed invoice data to database"""
        conn = sqlite3.connect('invoices.db')
        cursor = conn.cursor()
        
        try:
            # Insert main invoice data
            cursor.execute('''
            INSERT INTO invoices (
                filename, seller_name, seller_address, seller_email, seller_gstin,
                buyer_name, buyer_address, buyer_gstin, invoice_number, invoice_date,
                invoice_month, reference_number, total_amount, taxable_amount,
                cgst, sgst, pan_number, amount_in_words, raw_json, summary, ocr_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                filename,
                structured_data.get('seller_name', ''),
                structured_data.get('seller_address', ''),
                structured_data.get('seller_email', ''),
                structured_data.get('seller_gstin', ''),
                structured_data.get('buyer_name', ''),
                structured_data.get('buyer_address', ''),
                structured_data.get('buyer_gstin', ''),
                structured_data.get('invoice_number', ''),
                structured_data.get('invoice_date', ''),
                structured_data.get('invoice_month', ''),
                structured_data.get('reference_number', ''),
                structured_data.get('tax', {}).get('total_amount', 0),
                structured_data.get('tax', {}).get('taxable_amount', 0),
                structured_data.get('tax', {}).get('cgst', 0),
                structured_data.get('tax', {}).get('sgst', 0),
                structured_data.get('pan_number', ''),
                structured_data.get('amount_in_words', ''),
                json.dumps(structured_data),
                summary,
                ocr_text
            ))
            
            invoice_id = cursor.lastrowid
            
            # Insert items
            items = structured_data.get('items', [])
            for item in items:
                cursor.execute('''
                INSERT INTO invoice_items (
                    invoice_id, description, sac_code, quantity, rate, amount
                ) VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    invoice_id,
                    item.get('description', ''),
                    item.get('sac_code', ''),
                    item.get('quantity', 0),
                    item.get('rate', 0),
                    item.get('amount', 0)
                ))
            
            conn.commit()
            return invoice_id
        except Exception as e:
            st.error(f"Error saving to database: {e}")
            return None
        finally:
            conn.close()
    
    def query_database(self, query_type="all"):
        """Query the database for invoice data"""
        conn = sqlite3.connect('invoices.db')
        
        if query_type == "all":
            df = pd.read_sql_query('''
            SELECT id, filename, processed_date, seller_name, buyer_name, 
                   invoice_number, invoice_date, total_amount
            FROM invoices ORDER BY processed_date DESC
            ''', conn)
        elif query_type == "summary":
            df = pd.read_sql_query('''
            SELECT COUNT(*) as total_invoices,
                   SUM(total_amount) as total_value,
                   AVG(total_amount) as avg_value,
                   MAX(total_amount) as max_value
            FROM invoices
            ''', conn)
        
        conn.close()
        return df

# Initialize the processor
@st.cache_resource
def get_processor():
    return InvoiceProcessor()

processor = get_processor()

# Main App
def main():
    st.markdown('<h1 class="main-header">📄 Invoice Processor Pro</h1>', unsafe_allow_html=True)
    
    # Sidebar
    st.sidebar.title("🔧 Navigation")
    page = st.sidebar.selectbox("Choose a page", ["📤 Upload & Process", "📊 Database Query", "📈 Analytics"])
    
    if page == "📤 Upload & Process":
        upload_page()
    elif page == "📊 Database Query":
        query_page()
    elif page == "📈 Analytics":
        analytics_page()

def upload_page():
    st.markdown('<div class="feature-card"><h2>🚀 Upload and Process Invoice</h2><p>Upload an invoice image to extract structured data and generate summaries</p></div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("📎 Upload Invoice Image")
        uploaded_file = st.file_uploader(
            "Choose an invoice image...",
            type=['png', 'jpg', 'jpeg'],
            help="Upload a clear image of your invoice"
        )
        
        if uploaded_file is not None:
            st.image(uploaded_file, caption="Uploaded Invoice", use_column_width=True)
            
            if st.button("🔍 Process Invoice", type="primary"):
                with st.spinner("Processing invoice..."):
                    # Perform OCR
                    ocr_text = processor.perform_ocr(uploaded_file)
                    
                    if ocr_text:
                        st.success("✅ OCR completed successfully!")
                        
                        # Extract structured data
                        structured_data = processor.extract_structured_data(ocr_text)
                        
                        # Generate summary
                        summary = processor.generate_summary(ocr_text)
                        
                        if structured_data and summary:
                            # Save to database
                            invoice_id = processor.save_to_database(
                                uploaded_file.name, 
                                structured_data, 
                                summary, 
                                ocr_text
                            )
                            
                            if invoice_id:
                                st.success(f"✅ Invoice saved to database with ID: {invoice_id}")
                                
                                # Store in session state for display
                                st.session_state['processed_data'] = {
                                    'structured_data': structured_data,
                                    'summary': summary,
                                    'ocr_text': ocr_text
                                }
    
    with col2:
        st.subheader("📋 Processing Results")
        
        if 'processed_data' in st.session_state:
            data = st.session_state['processed_data']
            
            # Summary
            st.markdown(f'''
            <div class="summary-container">
                <h3>📝 Invoice Summary</h3>
                <p>{data['summary']}</p>
            </div>
            ''', unsafe_allow_html=True)
            
            # Structured Data
            st.subheader("🔧 Structured Data")
            with st.expander("View JSON Data", expanded=False):
                st.json(data['structured_data'])
            
            # Key Metrics
            tax_data = data['structured_data'].get('tax', {})
            col3, col4 = st.columns(2)
            
            with col3:
                st.metric("💰 Total Amount", f"₹{tax_data.get('total_amount', 0):,.2f}")
                st.metric("📊 CGST", f"₹{tax_data.get('cgst', 0):,.2f}")
            
            with col4:
                st.metric("📈 Taxable Amount", f"₹{tax_data.get('taxable_amount', 0):,.2f}")
                st.metric("📊 SGST", f"₹{tax_data.get('sgst', 0):,.2f}")
            
            # OCR Text
            with st.expander("View Raw OCR Text", expanded=False):
                st.text_area("Extracted Text", data['ocr_text'], height=200)

def query_page():
    st.markdown('<div class="feature-card"><h2>🔍 Database Query</h2><p>Search and filter your processed invoices</p></div>', unsafe_allow_html=True)
    
    # Query options
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.subheader("📋 All Invoices")
    
    with col2:
        if st.button("🔄 Refresh Data"):
            st.rerun()
    
    # Get all invoices
    df = processor.query_database("all")
    
    if not df.empty:
        # Display data with formatting
        st.dataframe(
            df,
            use_container_width=True,
            column_config={
                "total_amount": st.column_config.NumberColumn(
                    "Total Amount",
                    format="₹%.2f"
                ),
                "processed_date": st.column_config.DatetimeColumn(
                    "Processed Date",
                    format="DD/MM/YYYY HH:mm"
                )
            }
        )
        
        # Download option
        csv = df.to_csv(index=False)
        st.download_button(
            label="📥 Download CSV",
            data=csv,
            file_name=f"invoices_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
    else:
        st.info("📭 No invoices found in database. Upload some invoices to get started!")

def analytics_page():
    st.markdown('<div class="feature-card"><h2>📈 Analytics Dashboard</h2><p>Insights and statistics from your invoice data</p></div>', unsafe_allow_html=True)
    
    # Get summary statistics
    summary_df = processor.query_database("summary")
    
    if not summary_df.empty:
        stats = summary_df.iloc[0]
        
        # Display metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("📄 Total Invoices", int(stats['total_invoices']))
        
        with col2:
            st.metric("💰 Total Value", f"₹{stats['total_value']:,.2f}")
        
        with col3:
            st.metric("📊 Average Value", f"₹{stats['avg_value']:,.2f}")
        
        with col4:
            st.metric("🎯 Highest Value", f"₹{stats['max_value']:,.2f}")
        
        # Get detailed data for charts
        detailed_df = processor.query_database("all")
        
        if not detailed_df.empty:
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("📈 Invoice Values")
                st.bar_chart(detailed_df.set_index('invoice_number')['total_amount'])
            
            with col2:
                st.subheader("🕒 Processing Timeline")
                detailed_df['processed_date'] = pd.to_datetime(detailed_df['processed_date'])
                daily_counts = detailed_df.groupby(detailed_df['processed_date'].dt.date).size()
                st.line_chart(daily_counts)
    else:
        st.info("📭 No data available for analytics. Process some invoices first!")

if __name__ == "__main__":
    main()
