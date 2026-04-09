"""Admin API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.models.status_page import StatusPage
from app.core.security import get_current_user

from pydantic import BaseModel

class GrantAdminRequest(BaseModel):
    email: str

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user has admin privileges"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return current_user


# ============================================================================
# ADMIN STATS
# ============================================================================

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Get system-wide statistics for admin dashboard"""
    
    # Get total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    # Get active users (logged in within last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    # Note: We don't have last_login tracking yet, so we'll use created_at as proxy
    active_users_result = await db.execute(
        select(func.count(User.id)).where(
            and_(
                User.is_active == True,
                User.created_at >= thirty_days_ago
            )
        )
    )
    active_users = active_users_result.scalar() or 0
    
    # Get total monitors
    total_monitors_result = await db.execute(select(func.count(Monitor.id)))
    total_monitors = total_monitors_result.scalar() or 0
    
    # Get total heartbeats
    total_heartbeats_result = await db.execute(select(func.count(Heartbeat.id)))
    total_heartbeats = total_heartbeats_result.scalar() or 0
    
    # Get total status pages
    total_status_pages_result = await db.execute(select(func.count(StatusPage.id)))
    total_status_pages = total_status_pages_result.scalar() or 0
    
    # Calculate system uptime (mock for now)
    system_uptime = "15d 7h 23m"  # TODO: Implement actual uptime tracking
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_monitors": total_monitors,
        "total_heartbeats": total_heartbeats,
        "total_status_pages": total_status_pages,
        "system_uptime": system_uptime
    }


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """List all users with pagination and filtering"""
    
    # Build base query
    query = select(User)
    
    # Apply search filter
    if search:
        query = query.where(User.email.ilike(f"%{search}%"))
    
    # Apply sorting
    sort_column = getattr(User, sort_by, User.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Get total count for pagination
    count_query = select(func.count(User.id))
    if search:
        count_query = count_query.where(User.email.ilike(f"%{search}%"))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get monitor and status page counts for each user
    user_data = []
    for user in users:
        # Get monitor count
        monitor_count_result = await db.execute(
            select(func.count(Monitor.id)).where(Monitor.user_id == user.id)
        )
        monitor_count = monitor_count_result.scalar() or 0
        
        # Get status page count
        status_page_count_result = await db.execute(
            select(func.count(StatusPage.id)).where(StatusPage.user_id == user.id)
        )
        status_page_count = status_page_count_result.scalar() or 0
        
        user_data.append({
            "id": str(user.id),
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "monitor_count": monitor_count,
            "status_page_count": status_page_count
        })
    
    return {
        "users": user_data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Activate a user account"""
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    await db.commit()
    
    return {"message": f"User {user.email} activated successfully"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Deactivate a user account"""
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot deactivate admin users")
    
    user.is_active = False
    await db.commit()
    
    return {"message": f"User {user.email} deactivated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Delete a user account and all associated data"""
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await db.delete(user)
    await db.commit()
    
    return {"message": f"User {user.email} deleted successfully"}


# ============================================================================
# ADMIN MANAGEMENT
# ============================================================================

@router.get("/admins")
async def list_admins(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """List all admin users"""
    
    result = await db.execute(
        select(User).where(User.is_admin == True).order_by(User.created_at)
    )
    admins = result.scalars().all()
    
    admin_data = []
    for admin in admins:
        admin_data.append({
            "id": str(admin.id),
            "email": admin.email,
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat(),
            "granted_by": "system" if admin.email == "admin@pingsight.com" else "admin",  # TODO: Track who granted admin
            "granted_at": admin.created_at.isoformat()  # TODO: Track when admin was granted
        })
    
    return {"admins": admin_data}


@router.post("/admins/{user_id}")
async def grant_admin_privileges(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Grant admin privileges to a user"""
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="User is already an admin")
    
    user.is_admin = True
    await db.commit()
    
    return {"message": f"Admin privileges granted to {user.email}"}


@router.post("/admins/by-email")
async def grant_admin_privileges_by_email(
    request: GrantAdminRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Grant admin privileges to a user by email"""
    
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="User is already an admin")
    
    user.is_admin = True
    await db.commit()
    
    return {"message": f"Admin privileges granted to {user.email}"}


@router.delete("/admins/{user_id}")
async def revoke_admin_privileges(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Revoke admin privileges from a user"""
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_admin:
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin privileges")
    
    # Prevent revoking the last admin (basic safety check)
    admin_count_result = await db.execute(select(func.count(User.id)).where(User.is_admin == True))
    admin_count = admin_count_result.scalar() or 0
    
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot revoke privileges from the last admin")
    
    user.is_admin = False
    await db.commit()
    
    return {"message": f"Admin privileges revoked from {user.email}"}


# ============================================================================
# SYSTEM MONITORING
# ============================================================================

@router.get("/system/health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Get system health metrics"""
    
    # Get recent heartbeat activity (last 24 hours)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_heartbeats_result = await db.execute(
        select(func.count(Heartbeat.id)).where(Heartbeat.timestamp >= twenty_four_hours_ago)
    )
    recent_heartbeats = recent_heartbeats_result.scalar() or 0
    
    # Get active monitors
    active_monitors_result = await db.execute(
        select(func.count(Monitor.id)).where(Monitor.is_active == True)
    )
    active_monitors = active_monitors_result.scalar() or 0
    
    # Get monitors with issues
    down_monitors_result = await db.execute(
        select(func.count(Monitor.id)).where(
            and_(
                Monitor.is_active == True,
                Monitor.last_status.in_(["DOWN", "ISSUE"])
            )
        )
    )
    down_monitors = down_monitors_result.scalar() or 0
    
    return {
        "recent_heartbeats_24h": recent_heartbeats,
        "active_monitors": active_monitors,
        "down_monitors": down_monitors,
        "system_status": "healthy" if down_monitors == 0 else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }