from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.schemas import UserLogin, AdminLogin, Token, UserResponse
from app.services import authenticate_user, create_access_token
from app.api.dependencies import get_current_active_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """User login endpoint"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/admin-login", response_model=Token)
async def admin_login(
    credentials: AdminLogin,
    db: Session = Depends(get_db)
):
    """Admin login endpoint"""
    # Check if it's the system admin
    if (credentials.email == settings.admin_email and 
        credentials.password == settings.admin_password):
        
        # Find or create admin user in database
        from app.services import get_user_by_email, create_admin_user
        admin_user = get_user_by_email(db, settings.admin_email)
        if not admin_user:
            admin_user = create_admin_user(
                db, 
                settings.admin_email, 
                settings.admin_password, 
                settings.admin_name
            )
    else:
        # Regular authentication for other admin users
        admin_user = authenticate_user(db, credentials.email, credentials.password)
        if not admin_user or admin_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials"
            )
    
    if not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive admin user"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": admin_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(admin_user)
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)"""
    return {"message": "Successfully logged out"}
