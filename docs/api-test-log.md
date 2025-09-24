# API Endpoint Smoke Test - 2025-09-21T09:06:03.440Z

Base URL: http://localhost:5000

## GET /api/health
- ok: true
- status: 200
- body: ```json
{
  "status": "ok"
}
```


## POST /api/auth/login
- ok: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Y3YjgyMDY4ZjdlYjQyYTM4MjJlMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODQ0NTU2MywiZXhwIjoxNzU5MDUwMzYzfQ.PsjN8igySxYLgcYbqDEU6p_WQ1DRxriTZov_jeLqGl4
- status: 200
- body: ```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "68cf7b82068f7eb42a3822e3",
    "name": "System Administrator",
    "email": "admin@invoicehub.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Y3YjgyMDY4ZjdlYjQyYTM4MjJlMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODQ0NTU2MywiZXhwIjoxNzU5MDUwMzYzfQ.PsjN8igySxYLgcYbqDEU6p_WQ1DRxriTZov_jeLqGl4"
  }
}
```


## GET /api/invoices (no token)
- ok: true
- status: 401
- body: ```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```


## GET /api/invoices (with token)
- ok: true
- status: 200
- body: ```json
{
  "success": true,
  "data": {
    "invoices": [],
    "pagination": {
      "current": 1,
      "pages": 0,
      "total": 0,
      "limit": 10
    }
  }
}
```


## POST /api/invoices/preview
- ok: false
- error: AxiosError: Request failed with status code 400
- body: ```json
{
  "success": false,
  "message": "Invalid file type. Only PDF and image files are allowed."
}
```


## GET http://localhost:5000/uploads/invoices/sample-invoice.txt
- ok: true
- status: 200
- bodyPreview: ```

INVOICE

TechCorp Solutions Pvt Ltd
Plot No. 123, Sector 18
Gurgaon, Haryana - 122015
GSTIN: 06AABCT1332L1ZZ
PAN: AABCT1332L

Invoice No: INV-2024-TEST
Date: 21-Sep-2024
Due Date: 21-Oct-2024

Bill T
```


## POST approve-reject on fake id
- ok: true
- status: 404
- body: ```json
{
  "success": false,
  "message": "Invoice not found"
}
```

