import logging
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import APIKeyHeader
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User

settings = get_settings()
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use APIKeyHeader instead of OAuth2PasswordBearer for better Swagger UX
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> tuple[str, datetime]:
    """Create access token and return both token and expiry datetime"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt, expire


def should_log_auth_request(path: str) -> bool:
    return path in {"/auth/me", "/users/me"}


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Depends(api_key_header),
    access_token: Optional[str] = Cookie(None, alias=settings.auth_cookie_name),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = None
    has_bearer = bool(authorization and authorization.startswith("Bearer "))
    has_cookie_header = "cookie" in request.headers
    path = request.url.path

    # Try to get token from Authorization header first
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    # Fall back to cookie
    elif access_token:
        token = access_token

    if should_log_auth_request(path):
        logger.info(
            "get_current_user: path=%s cookie_header_present=%s access_cookie_present=%s bearer_present=%s token_source=%s",
            path,
            has_cookie_header,
            access_token is not None,
            has_bearer,
            "bearer" if has_bearer else "cookie" if access_token else "none",
        )

    if not token:
        if not should_log_auth_request(path):
            logger.debug(
                "get_current_user: missing credentials (access_cookie_present=%s bearer_present=%s)",
                access_token is not None,
                has_bearer,
            )
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("get_current_user: JWT missing sub claim for path=%s", path)
            raise credentials_exception
    except jwt.PyJWTError:
        logger.warning("get_current_user: JWT decode failed for path=%s", path)
        raise credentials_exception

    if should_log_auth_request(path):
        logger.info(
            "get_current_user: token extraction succeeded for path=%s source=%s",
            path,
            "bearer" if has_bearer else "cookie",
        )
    else:
        logger.debug(
            "get_current_user: credentials ok (bearer=%s cookie=%s)",
            has_bearer,
            access_token is not None,
        )

    # Get user from database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    # Check if user is deactivated
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    return user


def get_current_user_email(
    authorization: Optional[str] = Depends(api_key_header),
    access_token: Optional[str] = Cookie(None, alias=settings.auth_cookie_name),
) -> str:
    """Lightweight version that only returns email without DB lookup"""

    token: Optional[str] = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    elif access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
