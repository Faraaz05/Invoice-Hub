from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import math

from app.database import get_db
from app.schemas.invoice import (
    InvoiceResponse, InvoiceCreate, InvoiceUpdate, InvoiceFilter,
    InvoicePaginatedResponse, InvoiceAnalytics, OCRResponse, InvoiceUploadResponse
)
from app.services.invoice import (
    create_invoice, get_invoice_by_id, get_invoices, count_invoices,
    update_invoice, delete_invoice, submit_for_verification,
    approve_invoice, reject_invoice, mark_as_paid, get_invoice_analytics
)
from app.services.ocr_nlp import ocr_nlp_service
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    department: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process invoice with OCR and NLP
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process with OCR and NLP
        ocr_result = ocr_nlp_service.process_invoice(file_content, generate_summary=True)
        
        if not ocr_result["success"]:
            return InvoiceUploadResponse(
                invoice_id=0,
                ocr_result=OCRResponse(**ocr_result),
                message="OCR processing failed, but you can still create invoice manually"
            )
        
        # Extract data for invoice creation
        extracted_data = ocr_result["extracted_data"]
        
        # Create invoice items from extracted data
        items = []
        if extracted_data and "items" in extracted_data:
            for item in extracted_data["items"]:
                items.append({
                    "description": item.get("description", ""),
                    "sac_code": item.get("sac_code", ""),
                    "quantity": item.get("quantity", 1.0),
                    "rate": item.get("rate", 0.0),
                    "amount": item.get("amount", 0.0)
                })
        
        # Create invoice data
        tax_data = extracted_data.get("tax", {}) if extracted_data else {}
        
        invoice_data = InvoiceCreate(
            seller_name=extracted_data.get("seller_name") if extracted_data else None,
            seller_address=extracted_data.get("seller_address") if extracted_data else None,
            seller_email=extracted_data.get("seller_email") if extracted_data else None,
            seller_gstin=extracted_data.get("seller_gstin") if extracted_data else None,
            buyer_name=extracted_data.get("buyer_name") if extracted_data else None,
            buyer_address=extracted_data.get("buyer_address") if extracted_data else None,
            buyer_gstin=extracted_data.get("buyer_gstin") if extracted_data else None,
            invoice_number=extracted_data.get("invoice_number") if extracted_data else None,
            invoice_date=extracted_data.get("invoice_date") if extracted_data else None,
            invoice_month=extracted_data.get("invoice_month") if extracted_data else None,
            reference_number=extracted_data.get("reference_number") if extracted_data else None,
            total_amount=tax_data.get("total_amount", 0.0),
            taxable_amount=tax_data.get("taxable_amount", 0.0),
            cgst=tax_data.get("cgst", 0.0),
            sgst=tax_data.get("sgst", 0.0),
            pan_number=extracted_data.get("pan_number") if extracted_data else None,
            amount_in_words=extracted_data.get("amount_in_words") if extracted_data else None,
            department=department,
            items=items
        )
        
        # Save to database
        db_invoice = create_invoice(
            db=db,
            invoice_data=invoice_data,
            filename=file.filename,
            ocr_text=ocr_result["ocr_text"],
            summary=ocr_result["summary"],
            raw_json=extracted_data
        )
        
        return InvoiceUploadResponse(
            invoice_id=db_invoice.id,
            ocr_result=OCRResponse(**ocr_result),
            message="Invoice uploaded and processed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process invoice: {str(e)}"
        )

@router.get("", response_model=InvoicePaginatedResponse)
async def get_invoices_list(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    seller_name: Optional[str] = Query(None),
    invoice_number: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of invoices with filtering"""
    
    skip = (page - 1) * size
    
    filters = InvoiceFilter(
        status=status,
        department=department,
        seller_name=seller_name,
        invoice_number=invoice_number,
        search=search
    )
    
    # Get invoices and total count
    invoices = get_invoices(db, skip=skip, limit=size, filters=filters)
    total = count_invoices(db, filters=filters)
    total_pages = math.ceil(total / size)
    
    return InvoicePaginatedResponse(
        invoices=[InvoiceResponse.from_orm(invoice) for invoice in invoices],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get invoice by ID"""
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice_endpoint(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update invoice"""
    invoice = update_invoice(db, invoice_id, invoice_update)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.delete("/{invoice_id}")
async def delete_invoice_endpoint(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete invoice"""
    success = delete_invoice(db, invoice_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return {"message": "Invoice deleted successfully"}

@router.post("/{invoice_id}/submit", response_model=InvoiceResponse)
async def submit_invoice_for_verification(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit invoice for verification"""
    invoice = submit_for_verification(db, invoice_id, current_user.id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.post("/{invoice_id}/approve", response_model=InvoiceResponse)
async def approve_invoice_endpoint(
    invoice_id: int,
    comments: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve invoice (Manager/Controller only)"""
    # Check if user can approve invoices
    if current_user.role not in ['manager', 'controller', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve invoices"
        )
    
    invoice = approve_invoice(db, invoice_id, current_user.id, comments)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.post("/{invoice_id}/reject", response_model=InvoiceResponse)
async def reject_invoice_endpoint(
    invoice_id: int,
    comments: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject invoice (Manager/Controller only)"""
    # Check if user can approve invoices
    if current_user.role not in ['manager', 'controller', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reject invoices"
        )
    
    if not comments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comments are required when rejecting an invoice"
        )
    
    invoice = reject_invoice(db, invoice_id, current_user.id, comments)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.post("/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_invoice_as_paid(
    invoice_id: int,
    payment_method: str,
    transaction_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark invoice as paid (Controller only)"""
    # Check if user can mark invoices as paid
    if current_user.role not in ['controller', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark invoices as paid"
        )
    
    from datetime import datetime
    invoice = mark_as_paid(db, invoice_id, datetime.utcnow(), payment_method, transaction_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.from_orm(invoice)

@router.get("/analytics/dashboard", response_model=InvoiceAnalytics)
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for dashboard (Controller/Admin only)"""
    if current_user.role not in ['controller', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view analytics"
        )
    
    return get_invoice_analytics(db)
