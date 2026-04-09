import os
from typing import Annotated

from fastapi import APIRouter, Request, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_sso.sso.google import GoogleSSO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.user import User
from app.models.social_account import SocialAccount
from app.core.security import create_access_token, get_current_user, verify_password, hash_password
from app.core.config import get_settings

settings = get_settings()

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
is_production = os.getenv("ENV") == "production"

router = APIRouter(prefix="/auth", tags=["auth"])

google_sso = GoogleSSO(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback"),
    allow_insecure_http=not is_production,
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=3600 * 24,
        path="/",
    )


@router.get("/login")
async def auth_init():
    try:
        with google_sso:
            return await google_sso.get_login_redirect()
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/?error=oauth_unavailable")


@router.get("/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        with google_sso:
            user_info = await google_sso.verify_and_process(request)

        # Find or create user
        result = await db.execute(select(User).where(User.email == user_info.email))
        user = result.scalar_one_or_none()

        if user is None:
            user = User(email=user_info.email)
            db.add(user)
            await db.flush()  # user.id available now

        # Find or create social account link
        social_result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.provider == "google",
                SocialAccount.provider_account_id == user_info.id,
            )
        )
        social_account = social_result.scalar_one_or_none()

        if social_account is None:
            db.add(
                SocialAccount(
                    user_id=user.id,
                    provider="google",
                    provider_account_id=user_info.id,
                    email=user_info.email,
                )
            )

        await db.commit()

        # Create token for THIS user (not existing_user/new_user)
        access_token, _expires_at = create_access_token(data={"sub": user.email})

        response = RedirectResponse(url=f"{frontend_url}/auth/callback")
        set_auth_cookie(response, access_token)
        return response

    except SQLAlchemyError:
        await db.rollback()
        return RedirectResponse(url=f"{frontend_url}/?error=database_error")
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/?error=auth_failed")


@router.post("/register")
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
    }


@router.post("/login/password")
async def password_login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token, _expires_at = create_access_token(data={"sub": user.email})
    response = JSONResponse(
        {
            "id": str(user.id),
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
        }
    )
    set_auth_cookie(response, access_token)
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie(key="access_token", path="/")
    return response


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat(),
    }