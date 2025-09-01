from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceFilter,
    InvoiceAnalytics, DepartmentExpense, VendorExpense, MonthlyExpense
)

def create_invoice(db: Session, invoice_data: InvoiceCreate, filename: str = None, 
                  ocr_text: str = None, summary: str = None, 
                  raw_json: Dict[str, Any] = None) -> Invoice:
    """Create a new invoice with OCR data"""
    
    # Create invoice object
    db_invoice = Invoice(
        filename=filename,
        seller_name=invoice_data.seller_name,
        seller_address=invoice_data.seller_address,
        seller_email=invoice_data.seller_email,
        seller_gstin=invoice_data.seller_gstin,
        buyer_name=invoice_data.buyer_name,
        buyer_address=invoice_data.buyer_address,
        buyer_gstin=invoice_data.buyer_gstin,
        invoice_number=invoice_data.invoice_number,
        invoice_date=invoice_data.invoice_date,
        invoice_month=invoice_data.invoice_month,
        reference_number=invoice_data.reference_number,
        total_amount=invoice_data.total_amount,
        taxable_amount=invoice_data.taxable_amount,
        cgst=invoice_data.cgst,
        sgst=invoice_data.sgst,
        pan_number=invoice_data.pan_number,
        amount_in_words=invoice_data.amount_in_words,
        department=invoice_data.department,
        raw_json=raw_json,
        summary=summary,
        ocr_text=ocr_text,
        status=InvoiceStatus.DRAFT
    )
    
    db.add(db_invoice)
    db.flush()  # Get the ID without committing
    
    # Add invoice items
    for item_data in invoice_data.items:
        db_item = InvoiceItem(
            invoice_id=db_invoice.id,
            description=item_data.description,
            sac_code=item_data.sac_code,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=item_data.amount
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoice_by_id(db: Session, invoice_id: int) -> Optional[Invoice]:
    """Get invoice by ID"""
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()

def get_invoices(db: Session, skip: int = 0, limit: int = 100, 
                filters: InvoiceFilter = None) -> List[Invoice]:
    """Get invoices with filtering"""
    query = db.query(Invoice)
    
    if filters:
        if filters.status:
            query = query.filter(Invoice.status == filters.status)
        
        if filters.department:
            query = query.filter(Invoice.department == filters.department)
        
        if filters.seller_name:
            query = query.filter(Invoice.seller_name.ilike(f"%{filters.seller_name}%"))
        
        if filters.invoice_number:
            query = query.filter(Invoice.invoice_number.ilike(f"%{filters.invoice_number}%"))
        
        if filters.date_from:
            query = query.filter(Invoice.invoice_date >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(Invoice.invoice_date <= filters.date_to)
        
        if filters.min_amount:
            query = query.filter(Invoice.total_amount >= filters.min_amount)
        
        if filters.max_amount:
            query = query.filter(Invoice.total_amount <= filters.max_amount)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Invoice.seller_name.ilike(search_term),
                    Invoice.invoice_number.ilike(search_term),
                    Invoice.buyer_name.ilike(search_term),
                    Invoice.summary.ilike(search_term)
                )
            )
    
    return query.order_by(Invoice.processed_date.desc()).offset(skip).limit(limit).all()

def count_invoices(db: Session, filters: InvoiceFilter = None) -> int:
    """Count invoices with filtering"""
    query = db.query(Invoice)
    
    if filters:
        if filters.status:
            query = query.filter(Invoice.status == filters.status)
        
        if filters.department:
            query = query.filter(Invoice.department == filters.department)
        
        if filters.seller_name:
            query = query.filter(Invoice.seller_name.ilike(f"%{filters.seller_name}%"))
        
        if filters.invoice_number:
            query = query.filter(Invoice.invoice_number.ilike(f"%{filters.invoice_number}%"))
        
        if filters.date_from:
            query = query.filter(Invoice.invoice_date >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(Invoice.invoice_date <= filters.date_to)
        
        if filters.min_amount:
            query = query.filter(Invoice.total_amount >= filters.min_amount)
        
        if filters.max_amount:
            query = query.filter(Invoice.total_amount <= filters.max_amount)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Invoice.seller_name.ilike(search_term),
                    Invoice.invoice_number.ilike(search_term),
                    Invoice.buyer_name.ilike(search_term),
                    Invoice.summary.ilike(search_term)
                )
            )
    
    return query.count()

def update_invoice(db: Session, invoice_id: int, invoice_update: InvoiceUpdate) -> Optional[Invoice]:
    """Update invoice"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return None
    
    update_data = invoice_update.dict(exclude_unset=True)
    items_data = update_data.pop("items", None)
    
    # Update invoice fields
    for field, value in update_data.items():
        setattr(db_invoice, field, value)
    
    # Update items if provided
    if items_data is not None:
        # Remove existing items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete()
        
        # Add new items
        for item_data in items_data:
            db_item = InvoiceItem(
                invoice_id=invoice_id,
                description=item_data.description,
                sac_code=item_data.sac_code,
                quantity=item_data.quantity,
                rate=item_data.rate,
                amount=item_data.amount
            )
            db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def delete_invoice(db: Session, invoice_id: int) -> bool:
    """Delete invoice"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return False
    
    db.delete(db_invoice)
    db.commit()
    return True

def submit_for_verification(db: Session, invoice_id: int, user_id: int) -> Optional[Invoice]:
    """Submit invoice for verification"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return None
    
    db_invoice.status = InvoiceStatus.VERIFICATION
    db_invoice.assigned_to = user_id
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def approve_invoice(db: Session, invoice_id: int, user_id: int, comments: str = None) -> Optional[Invoice]:
    """Approve invoice"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return None
    
    db_invoice.status = InvoiceStatus.APPROVED
    db_invoice.approved_by = user_id
    if comments:
        db_invoice.comments = comments
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def reject_invoice(db: Session, invoice_id: int, user_id: int, comments: str) -> Optional[Invoice]:
    """Reject invoice"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return None
    
    db_invoice.status = InvoiceStatus.REJECTED
    db_invoice.approved_by = user_id
    db_invoice.comments = comments
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def mark_as_paid(db: Session, invoice_id: int, payment_date: datetime, 
                payment_method: str, transaction_id: str = None) -> Optional[Invoice]:
    """Mark invoice as paid"""
    db_invoice = get_invoice_by_id(db, invoice_id)
    if not db_invoice:
        return None
    
    db_invoice.status = InvoiceStatus.PAID
    db_invoice.payment_date = payment_date
    db_invoice.payment_method = payment_method
    db_invoice.transaction_id = transaction_id
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoice_analytics(db: Session) -> InvoiceAnalytics:
    """Get invoice analytics for dashboard"""
    
    # Basic counts
    total_invoices = db.query(Invoice).count()
    pending_approvals = db.query(Invoice).filter(
        Invoice.status.in_([InvoiceStatus.VERIFICATION, InvoiceStatus.PENDING_APPROVAL])
    ).count()
    
    # Total amount
    total_amount_result = db.query(func.sum(Invoice.total_amount)).scalar()
    total_amount = total_amount_result or 0.0
    
    # This month amount
    current_month = datetime.now().month
    current_year = datetime.now().year
    this_month_result = db.query(func.sum(Invoice.total_amount)).filter(
        and_(
            extract('month', Invoice.processed_date) == current_month,
            extract('year', Invoice.processed_date) == current_year
        )
    ).scalar()
    this_month_amount = this_month_result or 0.0
    
    # Department expenses
    dept_expenses = db.query(
        Invoice.department,
        func.sum(Invoice.total_amount).label('total'),
        func.count(Invoice.id).label('count')
    ).filter(Invoice.department.isnot(None)).group_by(Invoice.department).all()
    
    department_expenses = [
        DepartmentExpense(
            department=dept.department,
            total_amount=dept.total,
            invoice_count=dept.count
        )
        for dept in dept_expenses
    ]
    
    # Vendor expenses
    vendor_expenses_query = db.query(
        Invoice.seller_name,
        func.sum(Invoice.total_amount).label('total'),
        func.count(Invoice.id).label('count')
    ).filter(Invoice.seller_name.isnot(None)).group_by(Invoice.seller_name).limit(10).all()
    
    vendor_expenses = [
        VendorExpense(
            vendor_name=vendor.seller_name,
            total_amount=vendor.total,
            invoice_count=vendor.count
        )
        for vendor in vendor_expenses_query
    ]
    
    # Monthly expenses (last 6 months)
    monthly_expenses_query = db.query(
        extract('month', Invoice.processed_date).label('month'),
        extract('year', Invoice.processed_date).label('year'),
        func.sum(Invoice.total_amount).label('total'),
        func.count(Invoice.id).label('count')
    ).group_by('month', 'year').order_by('year', 'month').limit(6).all()
    
    monthly_expenses = [
        MonthlyExpense(
            month=f"{int(month.year)}-{int(month.month):02d}",
            total_amount=month.total,
            invoice_count=month.count
        )
        for month in monthly_expenses_query
    ]
    
    return InvoiceAnalytics(
        total_invoices=total_invoices,
        total_amount=total_amount,
        pending_approvals=pending_approvals,
        this_month_amount=this_month_amount,
        department_expenses=department_expenses,
        vendor_expenses=vendor_expenses,
        monthly_expenses=monthly_expenses
    )
