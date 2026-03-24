from dotenv import load_dotenv
from fastapi import FastAPI, Depends

# Load environment variables first
load_dotenv()

from .api.auth import router as auth_router
from .core.security import get_current_user
from .core.config import get_settings
from .models.user import User

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="A FastAPI-based monitoring application",
    version="0.1.0"
)

# Include routers
app.include_router(auth_router, tags=["authentication"])


@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "pingSight API is running"}

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