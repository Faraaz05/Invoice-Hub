# Invoice Hub - AI-Powered Invoice Management System

A comprehensive invoice management system with OCR text extraction, AI-powered data structuring, and role-based approval workflows.

## 🚀 Features

- **AI-Powered OCR**: Automatic text extraction from PDF and image invoices using Tesseract
- **LLM Data Processing**: Structured data extraction using Llama 3.3 70B model via Together AI
- **Role-Based Workflows**: Multi-level approval system (Clerk → Manager → Controller → Admin)
- **Real-time Analytics**: Dashboard with spending insights and departmental breakdowns
- **Modern UI**: Built with React 18, TypeScript, and shadcn/ui components
- **FastAPI Backend**: High-performance Python backend with SQLAlchemy ORM

## 🏗️ Architecture

### Frontend (`ledger-path/`)
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: Zustand for auth, React Query for server state
- **Routing**: React Router v6
- **Charts**: Recharts for analytics visualization

### Backend (`backend/`)
- **Framework**: FastAPI with Python 3.11+
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens with OAuth2
- **OCR**: Tesseract for text extraction
- **AI**: Together AI API with Llama 3.3 70B model
- **File Processing**: Support for PDF, PNG, JPG formats

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Tesseract OCR
- Together AI API key

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Tesseract OCR**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   ```

3. **Configure environment**:
   ```bash
   # Copy and edit configuration
   cp app/config.py.example app/config.py
   # Add your Together AI API key to config.py
   ```

4. **Initialize database**:
   ```bash
   python run.py
   # Database will be created automatically on first run
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd ledger-path
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

## 🚀 Quick Start

1. **Start the backend**:
   ```bash
   cd backend
   python run.py
   ```
   Backend runs on `http://localhost:8000`

2. **Start the frontend**:
   ```bash
   cd ledger-path
   npm run dev
   ```
   Frontend runs on `http://localhost:8080`

3. **Default Admin Login**:
   - Email: `admin@company.com`
   - Password: `admin123`

## 👥 User Roles & Workflows

### Clerk
- Upload new invoices
- View upload status and OCR results
- Submit invoices for verification

### Manager
- Review and approve invoices < $10,000
- View department spending analytics
- Manage vendor information

### Controller
- Approve high-value invoices (> $10,000)
- Access complete financial analytics
- Mark invoices as paid

### Admin
- Full system access
- User management
- System configuration

## 📋 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/admin-login` - Admin login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Invoices
- `POST /invoices/upload` - Upload and process invoice with OCR
- `GET /invoices` - List invoices with filtering
- `GET /invoices/{id}` - Get invoice details
- `PUT /invoices/{id}` - Update invoice
- `POST /invoices/{id}/submit` - Submit for verification
- `POST /invoices/{id}/approve` - Approve invoice
- `POST /invoices/{id}/reject` - Reject invoice
- `POST /invoices/{id}/mark-paid` - Mark as paid

### Analytics
- `GET /analytics` - Comprehensive analytics dashboard
- Department expenses, vendor breakdown, monthly trends

## 🧪 OCR & AI Processing

### OCR Pipeline
1. **File Upload**: Support for PDF, PNG, JPG formats
2. **Text Extraction**: Tesseract OCR with confidence scoring
3. **Data Structuring**: Llama 3.3 70B extracts structured fields
4. **Human Summary**: AI generates readable invoice summary

### Extracted Fields
- Vendor/Seller information (name, address, GSTIN)
- Invoice details (number, date, reference)
- Financial data (amounts, taxes, line items)
- Confidence scores for validation

## 🔧 Configuration

### Backend Configuration (`backend/app/config.py`)
```python
class Settings:
    secret_key: str = "your-secret-key"
    together_api_key: str = "your-together-ai-key"
    database_url: str = "sqlite:///./invoicehub.db"
    cors_origins: List[str] = ["http://localhost:8080"]
```

### Frontend Configuration
- API base URL: `http://localhost:8000` (configurable in `src/api/client.ts`)
- Authentication: JWT tokens stored in localStorage

## 📊 Database Schema

### Users
- ID, email, password hash, role, department
- Role-based permissions and access control

### Invoices
- Complete invoice metadata and financial data
- OCR results and processing status
- Approval workflow tracking

### Invoice Items
- Line item details with SAC codes
- Quantity, rate, and amount calculations

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- CORS protection
- Input validation and sanitization

## 📱 Responsive Design

- Mobile-first responsive layout
- Touch-friendly interface
- Progressive web app capabilities
- Offline functionality (planned)

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd ledger-path
npm run build

# Backend
cd backend
# Configure production settings in config.py
# Use production WSGI server like Gunicorn
```

### Environment Variables
- `TOGETHER_API_KEY`: Your Together AI API key
- `SECRET_KEY`: JWT signing secret
- `DATABASE_URL`: Production database connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Together AI](https://together.ai/) for LLM API access
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for text extraction
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework

## 📞 Support

For support, email support@invoicehub.com or create an issue in this repository.

---

**Invoice Hub** - Streamlining invoice processing with AI-powered automation 🚀
