# InvoiceHub Backend API Documentation

## Overview

InvoiceHub is a comprehensive invoice management system with OCR capabilities, multi-level approval workflows, and role-based access control. The backend provides RESTful APIs for managing users, invoices, and business workflows.

## Base URL
```
http://localhost:5000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## User Roles & Permissions

- **Admin**: Full system access, can create users
- **Controller**: Can mark invoices as paid, approve invoices
- **Manager**: Can approve/reject invoices
- **Clerk**: Can upload and edit invoices

## API Endpoints

### Health Check

#### GET /api/health
Check if the API server is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/login
User login endpoint.

**Request Body:**
```json
{
  "email": "admin@invoicehub.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user_id",
    "name": "Admin User",
    "email": "admin@invoicehub.com",
    "role": "admin",
    "token": "jwt_token_here"
  }
}
```

### POST /api/auth/register
Register a new user (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "clerk",
  "department": "Sales"
}
```

**Note:** `department` field is required when `role` is "manager".

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "clerk",
    "department": "Sales",
    "token": "jwt_token_here"
  }
}
```

### GET /api/auth/profile
Get current user profile.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "clerk",
    "department": "Sales",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/auth/managers
Get all managers grouped by department.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "managers": {
      "Sales": [
        {
          "id": "manager_id_1",
          "name": "Sarah Johnson",
          "email": "sarah@example.com"
        }
      ],
      "Finance": [
        {
          "id": "manager_id_2",
          "name": "Lisa Chen",
          "email": "lisa@example.com"
        }
      ]
    },
    "departments": ["Finance", "Sales"]
  }
}
```

---

## Invoice Endpoints

### GET /api/invoices/dashboard/stats
Get dashboard statistics.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInvoices": 150,
    "pendingApproval": 25,
    "approved": 100,
    "rejected": 15,
    "paid": 85,
    "totalValue": 1250000.50,
    "pendingValue": 125000.25,
    "monthlyStats": {
      "currentMonth": {
        "count": 12,
        "value": 85000.00
      },
      "lastMonth": {
        "count": 18,
        "value": 125000.00
      }
    }
  }
}
```

### POST /api/invoices/upload
Upload and process an invoice file with OCR.

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- invoice: (file) - PDF, JPG, JPEG, PNG, or TXT file
- department: (string) - Department to assign the invoice to (Sales, Marketing, Operations, Finance, HR, IT, Procurement, Legal)
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice uploaded and processed successfully",
  "data": {
    "_id": "invoice_id",
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-01-15T00:00:00.000Z",
    "billedBy": {
      "name": "Vendor Company Ltd",
      "address": "123 Business Street, City, State",
      "GSTIN": "12ABCDE1234F1Z5",
      "PAN": "ABCDE1234F",
      "state": "State Name",
      "country": "India"
    },
    "billedTo": {
      "name": "Your Company Ltd",
      "address": "456 Office Avenue, City, State",
      "GSTIN": "98ZYXWV7890U1T2",
      "PAN": "ZYXWV7890U",
      "state": "State Name",
      "country": "India"
    },
    "items": [
      {
        "description": "Product/Service Description",
        "hsn": "1234",
        "qty": 2,
        "gstRate": 18,
        "taxableAmount": 1000.00,
        "cgst": 90.00,
        "sgst": 90.00,
        "igst": 0,
        "total": 1180.00
      }
    ],
    "totals": {
      "subTotal": 1000.00,
      "totalTax": 180.00,
      "grandTotal": 1180.00
    },
    "status": "pending",
    "uploadedBy": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/invoices/preview
Preview invoice processing without saving to database.

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- invoice: (file) - PDF, JPG, JPEG, PNG, or TXT file
```

**Response:** Same structure as upload endpoint, but not saved to database.

### POST /api/invoices/save-confirmed
Save a confirmed invoice after preview/validation.

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15T00:00:00.000Z",
  "billedBy": {
    "name": "Vendor Company Ltd",
    "address": "123 Business Street, City, State",
    "GSTIN": "12ABCDE1234F1Z5",
    "PAN": "ABCDE1234F",
    "state": "State Name",
    "country": "India"
  },
  "billedTo": {
    "name": "Your Company Ltd",
    "address": "456 Office Avenue, City, State",
    "GSTIN": "98ZYXWV7890U1T2",
    "PAN": "ZYXWV7890U",
    "state": "State Name",
    "country": "India"
  },
  "items": [
    {
      "description": "Product/Service Description",
      "hsn": "1234",
      "qty": 2,
      "gstRate": 18,
      "taxableAmount": 1000.00,
      "cgst": 90.00,
      "sgst": 90.00,
      "igst": 0,
      "total": 1180.00
    }
  ],
  "totals": {
    "subTotal": 1000.00,
    "totalTax": 180.00,
    "grandTotal": 1180.00
  }
}
```

### GET /api/invoices
Get all invoices with filtering and pagination.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (pending, approved, rejected, paid)
- `startDate` (string): Start date filter (ISO format)
- `endDate` (string): End date filter (ISO format)
- `vendor` (string): Filter by vendor name (case-insensitive)
- `sortBy` (string): Sort field (default: invoiceDate)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Example:**
```
GET /api/invoices?page=1&limit=5&status=pending&vendor=Acme
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "invoice_id",
        "invoiceNumber": "INV-2024-001",
        "invoiceDate": "2024-01-15T00:00:00.000Z",
        "billedBy": { /* billing details */ },
        "totals": { /* totals */ },
        "status": "pending",
        "uploadedBy": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "clerk"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 25,
      "limit": 5
    }
  }
}
```

### GET /api/invoices/:id
Get a specific invoice by ID.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "invoice_id",
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-01-15T00:00:00.000Z",
    "billedBy": { /* full billing details */ },
    "billedTo": { /* full billing details */ },
    "items": [ /* full item details */ ],
    "totals": { /* full totals */ },
    "status": "pending",
    "uploadedBy": { /* user details */ },
    "approver": { /* approver details if assigned */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/invoices/:id
Update an invoice (Clerk+ role required).

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "invoiceNumber": "INV-2024-001-UPDATED",
  "items": [
    {
      "description": "Updated description",
      "qty": 3,
      "taxableAmount": 1500.00
    }
  ]
}
```

### POST /api/invoices/:id/approve-reject
Approve or reject an invoice (Manager+ role required).

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approved",
  "comments": "Invoice approved for payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice approved successfully",
  "data": {
    "_id": "invoice_id",
    "status": "approved",
    "approver": "manager_user_id",
    "approvalDate": "2024-01-01T00:00:00.000Z",
    "approvalComments": "Invoice approved for payment"
  }
}
```

### POST /api/invoices/:id/mark-paid
Mark an invoice as paid (Controller+ role required).

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentDate": "2024-01-01",
  "paymentReference": "TXN-123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice marked as paid successfully",
  "data": {
    "_id": "invoice_id",
    "status": "paid",
    "paymentDate": "2024-01-01T00:00:00.000Z",
    "paymentReference": "TXN-123456789",
    "paidBy": "controller_user_id"
  }
}
```

### GET /api/invoices/:id/file
Download the original invoice file.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
- Content-Type: Original file MIME type
- Content-Disposition: attachment; filename="invoice-filename"
- Body: Binary file data

---

## Data Models

### User Model
```json
{
  "_id": "ObjectId",
  "name": "string (required, max 100 chars)",
  "email": "string (required, unique, valid email)",
  "passwordHash": "string (required)",
  "role": "enum: [admin, clerk, manager, controller]",
  "department": "enum: [Sales, Marketing, Operations, Finance, HR, IT, Procurement, Legal] (required for managers)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Invoice Model
```json
{
  "_id": "ObjectId",
  "invoiceNumber": "string (required, unique)",
  "invoiceDate": "Date (required)",
  "billedBy": {
    "name": "string (required, max 200 chars)",
    "address": "string (required, max 500 chars)",
    "GSTIN": "string (15 chars, GST format)",
    "PAN": "string (10 chars, PAN format)",
    "state": "string (required, max 100 chars)",
    "country": "string (required, default: India)"
  },
  "billedTo": {
    // Same structure as billedBy
  },
  "items": [
    {
      "description": "string (required, max 300 chars)",
      "hsn": "string (2-8 digits)",
      "qty": "number (required, min 0)",
      "gstRate": "number (required, 0-100)",
      "taxableAmount": "number (required, min 0)",
      "cgst": "number (default 0, min 0)",
      "sgst": "number (default 0, min 0)",
      "igst": "number (default 0, min 0)",
      "total": "number (required, min 0)"
    }
  ],
  "totals": {
    "subTotal": "number (required, min 0)",
    "totalTax": "number (required, min 0)",
    "grandTotal": "number (required, min 0)"
  },
  "status": "enum: [pending, approved, rejected, paid]",
  "department": "enum: [Sales, Marketing, Operations, Finance, HR, IT, Procurement, Legal]",
  "assignedManager": "ObjectId (ref: User)",
  "uploadedBy": "ObjectId (ref: User)",
  "approver": "ObjectId (ref: User)",
  "approvalDate": "Date",
  "approvalComments": "string (max 500 chars)",
  "paymentDate": "Date",
  "paymentReference": "string (max 100 chars)",
  "paidBy": "ObjectId (ref: User)",
  "fileName": "string",
  "fileData": "Buffer (binary file data)",
  "fileType": "string",
  "fileSize": "number",
  "ocrExtractedText": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional detailed error information"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

## Getting Started

### Default Admin User
The system creates a default admin user on startup:
- **Email**: `admin@invoicehub.com`
- **Password**: `admin123`
- **Role**: `admin`

### Testing the API

1. Start the server:
   ```bash
   cd backend
   npm start
   ```

2. Open `test-api.html` in your browser to test all endpoints interactively.

3. Or use curl/Postman with the base URL: `http://localhost:5000`

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoicehub
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
GEMINI_API_KEY=your-gemini-api-key
```

## Features

- **OCR Processing**: Automatic text extraction from PDF and image files
- **AI Analysis**: Google Gemini integration for intelligent data extraction
- **Role-based Access**: Multi-level user permissions
- **Approval Workflow**: Manager approval and controller payment marking
- **File Storage**: Secure file storage in MongoDB
- **Dashboard Analytics**: Real-time statistics and insights
- **Email Notifications**: Automated workflow notifications
- **Audit Trail**: Complete tracking of invoice lifecycle

## Technical Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Processing**: Multer, Tesseract OCR
- **AI Integration**: Google Gemini API
- **Email**: Nodemailer
- **File Formats**: PDF, JPG, JPEG, PNG, TXT