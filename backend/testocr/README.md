# 📄 Invoice Processor Pro

A sleek, modern web application for processing invoices using OCR and AI with a queryable database backend.

## ✨ Features

### 🚀 Core Functionality
- **OCR Processing**: Automatically extract text from invoice images
- **AI-Powered Extraction**: Structure data using LLM (Llama 3.3)
- **Smart Summaries**: Generate human-readable invoice summaries
- **Database Storage**: Save all processed data in SQLite database
- **Interactive UI**: Clean, modern Streamlit interface

### 📊 Three Main Pages

#### 1. 📤 Upload & Process
- Upload invoice images (PNG, JPG, JPEG)
- Real-time OCR processing
- Structured JSON data extraction
- Human-readable summaries
- Automatic database storage

#### 2. 📊 Database Query
- View all processed invoices
- Search and filter functionality
- Export data to CSV
- Real-time data refresh

#### 3. 📈 Analytics Dashboard
- Invoice statistics and metrics
- Value distribution charts
- Processing timeline
- Business insights

## 🛠️ Installation & Setup

### Quick Start
```bash
# Run the launcher (recommended)
./launch_app.sh
```

### Manual Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
streamlit run invoice_app.py
```

## 📋 Requirements

- Python 3.8+
- Tesseract OCR installed on system
- Internet connection (for AI processing)

### System Dependencies (Ubuntu/Debian)
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install libtesseract-dev
```

### System Dependencies (macOS)
```bash
brew install tesseract
```

## 🎯 Usage

1. **Start the Application**
   - Run `./launch_app.sh` or `streamlit run invoice_app.py`
   - Open your browser to `http://localhost:8501`

2. **Process Invoices**
   - Go to "Upload & Process" page
   - Upload an invoice image
   - Click "Process Invoice"
   - View extracted data and summary

3. **Query Database**
   - Go to "Database Query" page
   - View all processed invoices
   - Export data as needed

4. **View Analytics**
   - Go to "Analytics Dashboard"
   - View statistics and trends
   - Monitor processing metrics

## 💾 Database Schema

### Invoices Table
- Basic invoice information
- Seller and buyer details
- Financial data
- Raw JSON and OCR text

### Invoice Items Table
- Line item details
- Quantities and amounts
- Linked to main invoice

## 🔧 Configuration

The application uses these settings:
- **API Key**: Together AI API for LLM processing
- **Database**: SQLite (`invoices.db`)
- **OCR Engine**: Tesseract
- **UI Framework**: Streamlit

## 🎨 UI Features

- **Modern Design**: Gradient backgrounds and clean styling
- **Responsive Layout**: Works on desktop and tablet
- **Interactive Elements**: Real-time processing feedback
- **Data Visualization**: Charts and metrics
- **Export Functionality**: CSV downloads

## 📁 File Structure

```
TROCRTEST/
├── invoice_app.py          # Main Streamlit application
├── requirements.txt        # Python dependencies
├── launch_app.sh          # Quick launcher script
├── README.md              # This file
├── invoices.db            # SQLite database (created automatically)
├── llmtest.py             # Original LLM processing script
├── trocr_test.py          # Original OCR script
└── sample.jpg             # Sample invoice image
```

## 🚀 Advanced Features

- **Batch Processing**: Process multiple invoices
- **Data Validation**: Verify extracted information
- **Custom Queries**: SQL-like filtering
- **Export Options**: Multiple format support
- **Mobile Responsive**: Works on all devices

## 🔍 Troubleshooting

### Common Issues

1. **Tesseract Not Found**
   ```bash
   # Install tesseract
   sudo apt-get install tesseract-ocr
   ```

2. **Module Not Found**
   ```bash
   # Activate virtual environment
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **API Connection Issues**
   - Check internet connection
   - Verify API key in code

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all dependencies are installed
3. Ensure proper API configuration

---

**Built with ❤️ using Streamlit, OpenCV, and Together AI**
