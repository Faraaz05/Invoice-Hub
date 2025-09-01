from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
import enum
from .user import Base

class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    VERIFICATION = "verification"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    OVERDUE = "overdue"

class Invoice(Base):
    __tablename__ = "invoices"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=True)
    processed_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default=InvoiceStatus.DRAFT)
    
    # Vendor/Seller information
    seller_name = Column(String)
    seller_address = Column(Text)
    seller_email = Column(String)
    seller_gstin = Column(String)
    
    # Buyer information
    buyer_name = Column(String)
    buyer_address = Column(Text)
    buyer_gstin = Column(String)
    
    # Invoice details
    invoice_number = Column(String, index=True)
    invoice_date = Column(String)
    invoice_month = Column(String)
    reference_number = Column(String)
    
    # Financial details
    total_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    
    # Additional information
    pan_number = Column(String)
    amount_in_words = Column(Text)
    
    # Processing data
    raw_json = Column(JSON)  # Store the complete extracted JSON
    summary = Column(Text)   # Human-readable summary
    ocr_text = Column(Text)  # Raw OCR extracted text
    
    # Workflow fields
    department = Column(String)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    comments = Column(Text)
    
    # Payment information
    payment_date = Column(DateTime, nullable=True)
    payment_method = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    
    # Relationships
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    approved_user = relationship("User", foreign_keys=[approved_by])

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    
    # Item details
    description = Column(Text)
    sac_code = Column(String)
    quantity = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    
    # Relationship
    invoice = relationship("Invoice", back_populates="items")
