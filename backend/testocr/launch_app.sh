#!/bin/bash

# Invoice Processor Pro Launcher
echo "🚀 Starting Invoice Processor Pro..."
echo "📄 A sleek UI for invoice processing with OCR and AI"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Setting up virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "📋 Installing dependencies..."
pip install -r requirements.txt

# Launch the app
echo "🌐 Launching Streamlit app..."
echo "📱 The app will open in your default browser"
echo "🔧 Use Ctrl+C to stop the application"
echo ""

streamlit run invoice_app.py --server.port 8501 --server.address localhost
