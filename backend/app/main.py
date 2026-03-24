from dotenv import load_dotenv
from fastapi import FastAPI, Depends

# Load environment variables first
load_dotenv()

from .api.auth import router as auth_router
from .api.monitors import router as monitors_router
from .core.security import get_current_user
from .core.config import get_settings
from .models.user import User

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="A FastAPI-based monitoring application with JWT authentication",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "Authentication endpoints - Login with Google OAuth to get JWT token"
        },
        {
            "name": "monitors", 
            "description": "Monitor management endpoints - Requires JWT authentication"
        }
    ]
)

# Include routers
app.include_router(auth_router, tags=["authentication"])
app.include_router(monitors_router, tags=["monitors"])


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
            "step4": "Now you can access protected endpoints like /monitors/"
        }
    }

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Alternative endpoint to get current user (same as /auth/me)"""
    return {
        "message": f"Hello {current_user.email}, this is a private secret!",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat()
        }
    }