#  InvoiceHub

**A comprehensive invoice management system with OCR, AI-powered data extraction, and multi-level approval workflows.**

InvoiceHub is a full-stack web application designed to streamline invoice processing for organizations. It features intelligent document processing with OCR and AI, role-based access control, approval workflows, and comprehensive financial analytics.

---

## Features

### 🤖 Intelligent Invoice Processing
- **OCR Technology**: Automatic text extraction from PDFs and images using Tesseract.js
- **AI-Powered Data Extraction**: Google Gemini AI integration for intelligent invoice data parsing
- **OpenRouter Fallback**: Automatic fallback to OpenRouter API when Gemini is rate-limited
- **Multi-Format Support**: Process PDF, JPG, JPEG, PNG, and TXT files
- **Indian GST Compliance**: Built-in support for GSTIN, PAN, HSN codes, and GST calculations

###  Role-Based Access Control
InvoiceHub supports four distinct user roles with specific permissions:

1. ** Admin**
   - Full system access
   - User management (create, delete users)
   - System-wide oversight

2. ** Finance Controller**
   - Mark approved invoices as paid
   - Access financial analytics
   - Payment processing dashboard
   - Approve invoices

3. ** Manager**
   - Approve/reject invoices for their department
   - View department-specific invoices
   - Access department analytics
   - Track pending approvals

4. ** Clerk**
   - Upload and process invoices
   - Edit invoice details
   - Search and filter invoices
   - Assign invoices to departments

###  Analytics & Reporting
- **Dashboard Statistics**: Real-time invoice counts, values, and trends
- **Department Analytics**: Department-wise spending analysis and trends
- **Financial Analytics**: Comprehensive financial insights and metrics
- **Monthly Comparisons**: Track month-over-month changes

###  Workflow Management
- **Multi-Level Approval**: Department manager approval → Finance controller payment
- **Status Tracking**: Pending → Approved → Paid (or Rejected)
- **Email Notifications**: Automated workflow notifications (configurable)
- **Audit Trail**: Complete tracking of invoice lifecycle with timestamps

###  Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for user passwords
- **Protected Routes**: Frontend and backend route protection
- **Session Management**: Express session handling
- **CORS Configuration**: Configurable cross-origin resource sharing

---

##  Architecture

### Tech Stack

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Processing**: 
  - Multer (file uploads)
  - pdf-parse (PDF text extraction)
  - Tesseract.js (OCR)
- **AI Integration**: 
  - Google Gemini AI (@google/genai)
  - OpenRouter SDK (fallback)
- **Email**: Nodemailer
- **Dev Tools**: Nodemon

#### Frontend
- **Framework**: React 19 with React Router DOM
- **Build Tool**: Vite
- **UI Components**: Custom components with Lucide React icons
- **HTTP Client**: Axios
- **Styling**: CSS modules

### Project Structure

```
Invoice-Hub/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # User authentication & management
│   │   ├── invoiceController.js     # Invoice CRUD operations
│   │   ├── financialAnalyticsController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification & role checks
│   │   └── uploadMiddleware.js      # File upload handling
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   └── Invoice.js               # Invoice schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── financialAnalyticsRoutes.js
│   │   └── healthRoutes.js
│   ├── utils/
│   │   ├── geminiClient.js          # AI integration (Gemini + OpenRouter)
│   │   ├── ocrUtils.js              # OCR processing
│   │   ├── sendEmail.js             # Email notifications
│   │   └── adminSeeder.js           # Admin user creation
│   ├── uploads/                     # File storage directory
│   ├── .env                         # Environment variables
│   ├── server.js                    # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js            # Axios configuration
│   │   │   └── services.js          # API service functions
│   │   ├── components/
│   │   │   ├── Layout.jsx           # App layout with sidebar
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PrivateRoute.jsx     # Route protection
│   │   │   ├── AdminOnlyRoute.jsx   # Admin-only routes
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── InvoiceList.jsx
│   │   │   └── InvoiceOverview.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── AdminDashboard.jsx   # User management
│   │   │   ├── InvoiceUpload.jsx    # Upload & process invoices
│   │   │   ├── InvoiceDetails.jsx   # View/edit invoice
│   │   │   ├── InvoiceSearch.jsx    # Search & filter
│   │   │   ├── PendingApprovals.jsx # Manager approvals
│   │   │   ├── DepartmentInvoices.jsx
│   │   │   ├── DepartmentAnalytics.jsx
│   │   │   ├── FinancialAnalytics.jsx
│   │   │   └── PaymentProcessing.jsx
│   │   ├── styles/                  # CSS files
│   │   ├── utils/
│   │   │   └── auth.js              # Auth utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **MongoDB**: v5.0 or higher (local or MongoDB Atlas)
- **npm**: v9 or higher
- **API Keys**: 
  - Google Gemini API key (required)
  - OpenRouter API key (optional, for fallback)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Invoice-Hub
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # Or create manually
```

**Configure Backend Environment Variables** (`.env`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/invoicedb
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/invoicedb

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=invoice-hub-session-secret-change-this

# Admin User (created on first run)
ADMIN_EMAIL=admin@invoicehub.com
ADMIN_PASSWORD=admin123

# AI Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter Fallback (Optional)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_SITE_URL=https://your-site.example
OPENROUTER_SITE_NAME=Invoice Hub

# Email Configuration (Optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Application Settings
FRONTEND_URL=http://localhost:5173
HIGH_VALUE_THRESHOLD=500000
```

**Get API Keys**:
- **Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenRouter**: [OpenRouter Dashboard](https://openrouter.ai/)

```bash
# Start the backend server
npm start

# Server will run on http://localhost:5000
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Frontend will run on http://localhost:5173
```

#### 4. Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Login with default admin credentials:
   - **Email**: `admin@invoicehub.com`
   - **Password**: `admin123`
3. **Important**: Change the admin password after first login!

---

##  User Guide

### For Admins

**User Management**:
1. Navigate to "User Management" from the sidebar
2. Click "Create User" to add new users
3. Fill in user details:
   - Name, email, password
   - Role (Admin, Controller, Manager, Clerk)
   - Department (required for Managers)
4. Delete users using the trash icon (cannot delete yourself)

### For Clerks

**Upload Invoices**:
1. Go to "Upload Invoice"
2. Select department from dropdown
3. Choose file (PDF, JPG, JPEG, PNG, or TXT)
4. Click "Upload and Process"
5. Review AI-extracted data
6. Edit if necessary
7. Confirm and save

**Search Invoices**:
- Use "Invoice Search" to find and filter invoices
- Edit invoices by clicking on them
- View detailed information

### For Managers

**Approve Invoices**:
1. Navigate to "Pending Approvals"
2. Review invoices assigned to your department
3. View invoice details
4. Approve or reject with comments
5. Track department analytics

### For Controllers

**Process Payments**:
1. Go to "Payment Processing"
2. Review approved invoices
3. Mark as paid with:
   - Payment date
   - Payment reference/transaction ID
4. View financial analytics

---

##  API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Include JWT token in headers:
```http
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Create user (admin only)
- `GET /auth/profile` - Get current user profile
- `GET /auth/users` - Get all users (admin only)
- `DELETE /auth/users/:id` - Delete user (admin only)
- `GET /auth/managers` - Get managers by department

#### Invoices
- `GET /invoices` - List invoices (with filters & pagination)
- `GET /invoices/:id` - Get invoice details
- `POST /invoices/upload` - Upload and process invoice
- `POST /invoices/preview` - Preview without saving
- `POST /invoices/save-confirmed` - Save confirmed invoice
- `PUT /invoices/:id` - Update invoice
- `POST /invoices/:id/approve-reject` - Approve/reject invoice
- `POST /invoices/:id/mark-paid` - Mark as paid
- `GET /invoices/:id/file` - Download original file
- `GET /invoices/dashboard/stats` - Dashboard statistics

#### Analytics
- `GET /financial-analytics` - Financial analytics data

#### Health
- `GET /health` - Server health check

**For detailed API documentation, see**: [`backend/README.md`](./backend/README.md)

---

## 🧪 Testing

### Manual Testing

**Test API Endpoints**:
```bash
cd backend
# Open test-api.html in browser for interactive API testing
```

**Test Authentication Flow**:
1. Login as different roles
2. Verify access to role-specific pages
3. Test unauthorized access attempts

**Test Invoice Processing**:
1. Upload sample invoices
2. Verify OCR extraction
3. Check AI data parsing
4. Test approval workflow

### Sample Test Invoices
Place sample invoice PDFs in `backend/uploads/invoices/` for testing

---

## 🔧 Configuration

### Departments
Supported departments (configured in models):
- Sales
- Marketing
- Operations
- Finance
- HR
- IT
- Procurement
- Legal

To add/modify departments, update:
- `backend/models/User.js`
- `backend/models/Invoice.js`

### File Upload Limits
Configure in `backend/middleware/uploadMiddleware.js`:
- Max file size: 10MB (default)
- Allowed formats: PDF, JPG, JPEG, PNG, TXT

### AI Model Configuration
- **Gemini Model**: `gemini-2.5-flash` (configured in `geminiClient.js`)
- **OpenRouter Model**: Set via `OPENROUTER_MODEL` env variable
- **Retry Logic**: 3 attempts with exponential backoff

---

##  Development

### Backend Development
```bash
cd backend
npm start  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production

**Backend**:
```bash
cd backend
# Set NODE_ENV=production in .env
# Update MONGO_URI to production database
# Update JWT_SECRET and SESSION_SECRET
# Enable HTTPS and set secure cookies
```

**Frontend**:
```bash
cd frontend
npm run build  # Creates optimized production build in dist/
npm run preview  # Preview production build locally
```

### Environment-Specific Configuration

**Development**:
- CORS allows all origins
- Detailed logging enabled
- Email notifications disabled (logged to console)

**Production** (recommended changes):
- Configure specific CORS origins
- Set `NODE_ENV=production`
- Enable HTTPS
- Set `secure: true` for cookies
- Use production MongoDB instance
- Enable email notifications
- Update JWT_SECRET and SESSION_SECRET
- Set up proper logging (e.g., Winston, Morgan)

---

## Data Models

### User Schema
```javascript
{
  name: String,           // Required, max 100 chars
  email: String,          // Required, unique, valid email
  passwordHash: String,   // bcrypt hashed
  role: String,           // admin, clerk, manager, controller
  department: String,     // Required for managers
  createdAt: Date,
  updatedAt: Date
}
```

### Invoice Schema
```javascript
{
  invoiceNumber: String,  // Required, unique
  invoiceDate: Date,
  billedBy: {
    name: String,
    address: String,
    GSTIN: String,       // 15 chars, GST format
    PAN: String,         // 10 chars, PAN format
    state: String,
    country: String
  },
  billedTo: { /* same as billedBy */ },
  items: [{
    description: String,
    hsn: String,         // 2-8 digits
    qty: Number,
    gstRate: Number,     // 0-100%
    taxableAmount: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    total: Number
  }],
  totals: {
    subTotal: Number,
    totalTax: Number,
    grandTotal: Number
  },
  status: String,        // pending, approved, rejected, paid
  department: String,
  assignedManager: ObjectId,
  uploadedBy: ObjectId,
  approver: ObjectId,
  approvalDate: Date,
  approvalComments: String,
  paymentDate: Date,
  paymentReference: String,
  paidBy: ObjectId,
  fileName: String,
  fileData: Buffer,      // Binary file storage
  fileType: String,
  fileSize: Number,
  ocrExtractedText: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

##  Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  Troubleshooting

### Common Issues

**Backend won't start**:
- Check MongoDB is running: `mongod --version`
- Verify MONGO_URI in .env
- Check port 5000 is not in use

**Frontend can't connect to backend**:
- Verify backend is running on port 5000
- Check CORS configuration
- Verify API base URL in `frontend/src/api/client.js`

**AI extraction not working**:
- Verify GEMINI_API_KEY is set correctly
- Check API quota limits
- Verify OpenRouter fallback configuration
- Check backend logs for API errors

**OCR extraction fails**:
- Ensure uploaded file is valid (PDF/image)
- Check file size (max 10MB)
- Verify Tesseract.js is installed

**Login fails**:
- Verify MongoDB connection
- Check admin user was created (check backend logs on startup)
- Clear browser cookies/localStorage

### Debug Mode

Enable detailed logging:
```javascript
// In backend/server.js - already enabled in development
// Check console output for request/response details
```

---

## License

This project is licensed under the ISC License.

---

##  Author

**InvoiceHub Development Team**

---

##  Acknowledgments

- **Google Gemini AI** - Intelligent document processing
- **OpenRouter** - AI fallback provider
- **Tesseract.js** - OCR capabilities
- **MongoDB** - Database
- **React** - Frontend framework
- **Express.js** - Backend framework
- **Lucide React** - Beautiful icons

---

##  Support

For issues and questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review backend logs
3. Check browser console for frontend errors
4. Verify environment variables

---

##  Roadmap

Potential future enhancements:
- [ ] Multi-language support
- [ ] Advanced reporting and exports (Excel, CSV)
- [ ] Invoice templates
- [ ] Automated reminders
- [ ] Integration with accounting software
- [ ] Mobile app
- [ ] Bulk upload processing
- [ ] Advanced analytics dashboard
- [ ] Custom approval workflows
- [ ] Document version control

---
