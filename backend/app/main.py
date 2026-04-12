import os
import logging
from datetime import datetime

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .api.auth import router as auth_router
from .api.monitors import router as monitors_router
from .api.heartbeats import router as heartbeats_router
from .api.status import router as status_router
from .api.notifications import router as notifications_router
from .api.status_pages import router as status_pages_router
from .api.export import router as export_router
from .api.admin import router as admin_router
from .core.security import get_current_user
from .core.config import get_settings
from .models.user import User
from .worker.scheduler import monitor_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title=settings.app_name,
    description="A FastAPI-based monitoring application with JWT authentication",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "Authentication endpoints - Login with Google OAuth to get JWT token",
        },
        {
            "name": "monitors",
            "description": "Monitor management endpoints - Requires JWT authentication",
        },
    ],
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# allow_credentials=True requires explicit origins (never "*")
allowed_origins = list(settings.cors_origins_list)
# Ensure the configured frontend (e.g. Vercel) is always allowed when using credentialed requests
if settings.frontend_url:
    fu = settings.frontend_url.rstrip("/")
    if fu and fu not in allowed_origins:
        allowed_origins.append(fu)
if not allowed_origins:
    logger.warning("⚠️ [CORS] CORS_ORIGINS is empty; cross-origin requests may be blocked")
if "*" in allowed_origins:
    raise ValueError("❌ [CORS] CORS_ORIGINS cannot contain '*' when allow_credentials=True")

logger.info("✅ [CORS] allow_origins=%s allow_credentials=True", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def debug_auth_middleware(request: Request, call_next):
    """
    Production-safe debugging:
    - Never logs token values
    - Logs whether cookie exists + basic request info
    """
    path = request.url.path

    # Only log auth-related endpoints to avoid noise
    if path in ("/auth/me", "/auth/callback", "/auth/login", "/auth/logout") or path.startswith("/auth/"):
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        host = request.headers.get("host")

        has_cookie_header = "cookie" in request.headers
        # If your cookie name differs, change it here:
        has_access_cookie = "access_token" in request.cookies
        cookie_names = list(request.cookies.keys())

        logger.warning(
            "🕵️ [AUTH_DEBUG] %s %s | origin=%r referer=%r host=%r | has_cookie_header=%s has_access_token_cookie=%s cookie_names=%s",
            request.method,
            path,
            origin,
            referer,
            host,
            has_cookie_header,
            has_access_cookie,
            cookie_names,
        )

    response = await call_next(request)

    # Log Set-Cookie presence for callback responses (do NOT log cookie value)
    if request.url.path == "/auth/callback":
        set_cookie = response.headers.get("set-cookie")
        logger.warning("🍪 [AUTH_DEBUG] /auth/callback set-cookie-present=%s", bool(set_cookie))

        # Log cookie flags without logging the token value
        if set_cookie:
            flags = {
                "Secure": "Secure" in set_cookie,
                "HttpOnly": "HttpOnly" in set_cookie,
                "SameSite=None": ("SameSite=None" in set_cookie) or ("samesite=None" in set_cookie),
                "SameSite=Lax": ("SameSite=Lax" in set_cookie) or ("samesite=Lax" in set_cookie),
            }
            logger.warning("🔐 [AUTH_DEBUG] /auth/callback cookie_flags=%s", flags)

    return response

# Include routers
app.include_router(auth_router, tags=["authentication"])
app.include_router(monitors_router, tags=["monitors"])
app.include_router(heartbeats_router, prefix="/api", tags=["heartbeats"])
app.include_router(status_router, tags=["status"])
app.include_router(notifications_router, prefix="/api", tags=["notifications"])
app.include_router(status_pages_router, prefix="/api", tags=["status_pages"])
app.include_router(export_router, prefix="/api", tags=["export"])
app.include_router(admin_router, prefix="/api", tags=["admin"])


@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    try:
        logger.info("🚀 Starting pingSight API...")

        logger.warning(
            "🧾 [BOOT_CONFIG] os_ENVIRONMENT=%r settings.environment=%r frontend_url=%r cors_origins=%r",
            os.getenv("ENVIRONMENT"),
            settings.environment,
            settings.frontend_url,
            settings.cors_origins_list,
        )

        # Start the monitor scheduler
        monitor_scheduler.start()
        logger.info("⏱️ Monitor scheduler initialized successfully")

        # Trigger initial monitor schedule refresh
        await monitor_scheduler.refresh_monitor_schedules()
        logger.info("✅ Initial monitor schedules loaded")

    except Exception as e:
        logger.error("💥 Error during startup: %s", str(e))
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    try:
        logger.info("🧹 Shutting down pingSight API...")

        # Shutdown the scheduler
        monitor_scheduler.shutdown()
        logger.info("✅ Monitor scheduler shut down successfully")

    except Exception as e:
        logger.error("💥 Error during shutdown: %s", str(e))


@app.get("/health")
async def health_check():
    """Extended health check including scheduler status."""
    scheduler_status = monitor_scheduler.get_job_status()
    return {
        "status": "ok",
        "message": "pingSight API is running",
        "scheduler": scheduler_status,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "pingSight API is running",
        "docs": "/docs",
        "authentication": {
            "step1": "Visit /auth/login to authenticate with Google",
            "step2": "Copy the access_token from the response",
            "step3": "In Swagger docs, click 'Authorize' and enter: Bearer <your_token>",
            "step4": "Now you can access protected endpoints like /monitors/",
        },
    }


@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Alternative endpoint to get current user (same as /auth/me)"""
    return {
        "message": f"Hello {current_user.email}, this is a private secret!",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
        },
    }