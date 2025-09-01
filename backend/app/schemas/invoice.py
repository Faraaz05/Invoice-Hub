from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    VERIFICATION = "verification"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    OVERDUE = "overdue"

class InvoiceItemBase(BaseModel):
    description: str
    sac_code: Optional[str] = None
    quantity: float = 1.0
    rate: float = 0.0
    amount: float = 0.0

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int
    
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    seller_name: Optional[str] = None
    seller_address: Optional[str] = None
    seller_email: Optional[str] = None
    seller_gstin: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_address: Optional[str] = None
    buyer_gstin: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    invoice_month: Optional[str] = None
    reference_number: Optional[str] = None
    total_amount: float = 0.0
    taxable_amount: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    pan_number: Optional[str] = None
    amount_in_words: Optional[str] = None
    department: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []

class InvoiceUpdate(BaseModel):
    seller_name: Optional[str] = None
    seller_address: Optional[str] = None
    seller_email: Optional[str] = None
    seller_gstin: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_address: Optional[str] = None
    buyer_gstin: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    invoice_month: Optional[str] = None
    reference_number: Optional[str] = None
    total_amount: Optional[float] = None
    taxable_amount: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    pan_number: Optional[str] = None
    amount_in_words: Optional[str] = None
    department: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    comments: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None

class InvoiceResponse(InvoiceBase):
    id: int
    filename: Optional[str] = None
    processed_date: datetime
    status: InvoiceStatus
    summary: Optional[str] = None
    assigned_to: Optional[int] = None
    approved_by: Optional[int] = None
    comments: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    
    class Config:
        from_attributes = True

# OCR Processing schemas
class OCRRequest(BaseModel):
    file_url: Optional[str] = None
    extract_summary: bool = True

class OCRResponse(BaseModel):
    success: bool
    ocr_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    confidence_score: Optional[float] = None
    error: Optional[str] = None

class InvoiceUploadResponse(BaseModel):
    invoice_id: int
    ocr_result: OCRResponse
    message: str

# Query and Filter schemas
class InvoiceFilter(BaseModel):
    status: Optional[InvoiceStatus] = None
    department: Optional[str] = None
    seller_name: Optional[str] = None
    invoice_number: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search: Optional[str] = None

class InvoicePaginatedResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    size: int
    total_pages: int

# Analytics schemas
class DepartmentExpense(BaseModel):
    department: str
    total_amount: float
    invoice_count: int

class VendorExpense(BaseModel):
    vendor_name: str
    total_amount: float
    invoice_count: int

class MonthlyExpense(BaseModel):
    month: str
    total_amount: float
    invoice_count: int

class InvoiceAnalytics(BaseModel):
    total_invoices: int
    total_amount: float
    pending_approvals: int
    this_month_amount: float
    department_expenses: List[DepartmentExpense]
    vendor_expenses: List[VendorExpense]
    monthly_expenses: List[MonthlyExpense]
