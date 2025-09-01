from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.routes import auth, admin, invoices
from app.models import user, invoice  # Import all models
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InvoiceHub API",
    description="Enterprise Invoice Management System with OCR and NLP",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(invoices.router)

@app.get("/")
async def root():
    return {"message": "InvoiceHub API - Enterprise Invoice Management System"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "InvoiceHub API is running"}
