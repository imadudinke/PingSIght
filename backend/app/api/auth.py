import os
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_sso.sso.google import GoogleSSO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_db
from app.models.user import User
from app.models.social_account import SocialAccount
from app.core.security import create_access_token, get_current_user
from app.core.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])

google_sso = GoogleSSO(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    redirect_uri="http://localhost:8000/auth/callback",
    allow_insecure_http=True  # ONLY for local testing (localhost)
)


@router.get("/login")
async def auth_init():
    with google_sso:
        return await google_sso.get_login_redirect()


@router.get("/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        with google_sso:
            user_info = await google_sso.verify_and_process(request)
        
        # Check if user exists by email
        result = await db.execute(select(User).where(User.email == user_info.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # User exists, check if they have a Google social account
            social_result = await db.execute(
                select(SocialAccount).where(
                    SocialAccount.user_id == existing_user.id,
                    SocialAccount.provider == "google",
                    SocialAccount.provider_account_id == user_info.id
                )
            )
            social_account = social_result.scalar_one_or_none()
            
            if not social_account:
                # Create social account for existing user
                new_social_account = SocialAccount(
                    user_id=existing_user.id,
                    provider="google",
                    provider_account_id=user_info.id,
                    email=user_info.email
                )
                db.add(new_social_account)
                await db.commit()
            
            # Generate access token
            access_token, expires_at = create_access_token(data={"sub": existing_user.email})
            
            return {
                "message": "Login Successful!",
                "access_token": access_token,
                "token_type": "bearer",
                "expires_at": expires_at.isoformat(),
                "expires_in": settings.access_token_expire_minutes * 60,  # seconds
                "user_details": {
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "display_name": user_info.display_name,
                    "picture": user_info.picture
                }
            }
        else:
            # Create new user
            new_user = User(email=user_info.email)
            db.add(new_user)
            await db.flush()  # Get the user ID
            
            # Create social account for new user
            new_social_account = SocialAccount(
                user_id=new_user.id,
                provider="google",
                provider_account_id=user_info.id,
                email=user_info.email
            )
            db.add(new_social_account)
            await db.commit()
            
            # Generate access token for new user
            access_token, expires_at = create_access_token(data={"sub": new_user.email})
            
            return {
                "message": "Registration and Login Successful!",
                "access_token": access_token,
                "token_type": "bearer",
                "expires_at": expires_at.isoformat(),
                "expires_in": settings.access_token_expire_minutes * 60,  # seconds
                "user_details": {
                    "id": str(new_user.id),
                    "email": new_user.email,
                    "display_name": user_info.display_name,
                    "picture": user_info.picture
                }
            }
    
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Authentication failed")


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat()
    }


@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Example protected route that requires authentication"""
    return {
        "message": f"Hello {current_user.email}, this is a private secret!",
        "user_id": str(current_user.id)
    }

@router.post("/token")
async def create_token_for_testing(email: str, db: AsyncSession = Depends(get_db)):
    """Development endpoint to create tokens for testing (remove in production)"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token, expires_at = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": expires_at.isoformat(),
        "expires_in": settings.access_token_expire_minutes * 60  # seconds
    }