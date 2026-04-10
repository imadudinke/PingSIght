import logging
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

logger = logging.getLogger(__name__)
settings = get_settings()

frontend_url = settings.frontend_url

# Admin seed emails - these emails will automatically become admins
# Can be configured via ADMIN_SEED_EMAILS environment variable (comma-separated)
ADMIN_EMAILS = set(
    email.strip()
    for email in os.getenv("ADMIN_SEED_EMAILS", "imadudinkeremu@gmail.com").split(",")
    if email.strip()
)

router = APIRouter(prefix="/auth", tags=["auth"])

google_sso = GoogleSSO(
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    redirect_uri=settings.oauth_google_redirect_uri,
    allow_insecure_http=not settings.is_production,
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


def set_auth_cookie(response: Response, token: str) -> None:
    """Cross-site session: production requires Secure=True and SameSite=None."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
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

        # Check if email is blocked
        from app.models.blocked_email import BlockedEmail
        blocked_result = await db.execute(
            select(BlockedEmail).where(BlockedEmail.email == user_info.email)
        )
        if blocked_result.scalar_one_or_none():
            return RedirectResponse(url=f"{frontend_url}/blocked?reason=email_blocked")

        # Find or create user
        result = await db.execute(select(User).where(User.email == user_info.email))
        user = result.scalar_one_or_none()

        if user is None:
            # Check if this email should be an admin
            is_admin = user_info.email in ADMIN_EMAILS
            user = User(email=user_info.email, is_admin=is_admin)
            db.add(user)
            await db.flush()  # user.id available now
        else:
            # Check if user is deactivated
            if not user.is_active:
                return RedirectResponse(url=f"{frontend_url}/blocked?reason=account_deactivated")

            # If user exists but isn't admin yet, check if they should be
            if not user.is_admin and user_info.email in ADMIN_EMAILS:
                user.is_admin = True

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
        logger.info(
            "OAuth callback: issuing Set-Cookie access_token (secure=%s samesite=%s path=%s)",
            settings.is_production,
            "none" if settings.is_production else "lax",
            "/",
        )
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

    # Check if email is blocked
    from app.models.blocked_email import BlockedEmail
    blocked_result = await db.execute(
        select(BlockedEmail).where(BlockedEmail.email == payload.email)
    )
    if blocked_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email address is not allowed to register",
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
        is_admin=payload.email in ADMIN_EMAILS,
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
    # Check if email is blocked
    from app.models.blocked_email import BlockedEmail
    blocked_result = await db.execute(
        select(BlockedEmail).where(BlockedEmail.email == form_data.username)
    )
    if blocked_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email address is blocked",
        )

    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if user is deactivated
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
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
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.is_production,
        httponly=True,
        samesite="none" if settings.is_production else "lax",
    )
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
