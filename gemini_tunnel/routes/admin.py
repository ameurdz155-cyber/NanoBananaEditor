"""Admin routes for user and system management."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Query, status
from datetime import datetime, timedelta

from models_auth import (
    UserResponse,
    UserListResponse,
    AdminUserCreate,
    AdminUserUpdate,
    AuditLogListResponse,
    AuditLogResponse,
    UserStatsResponse,
    SystemStatsResponse
)
from services.auth_service_db import (
    get_current_admin_user,
    hash_password,
    log_audit
)
from database import db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    current_user=Depends(get_current_admin_user)
):
    """List all users with pagination and filters."""
    # Build where clause
    where_clause = {}
    
    if search:
        where_clause["OR"] = [
            {"email": {"contains": search}},
            {"username": {"contains": search}},
            {"full_name": {"contains": search}}
        ]
    
    if is_active is not None:
        where_clause["is_active"] = is_active
    
    if is_admin is not None:
        where_clause["is_admin"] = is_admin
    
    # Get total count
    total = await db.user.count(where=where_clause)
    
    # Get users
    users = await db.user.find_many(
        where=where_clause,
        skip=(page - 1) * page_size,
        take=page_size,
        order={"created_at": "desc"}
    )
    
    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user=Depends(get_current_admin_user)):
    """Get user by ID."""
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    user_data: AdminUserCreate,
    current_user=Depends(get_current_admin_user)
):
    """Create a new user (admin only)."""
    # Check if user already exists
    existing_user = await db.user.find_first(
        where={
            "OR": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        }
    )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )
    
    # Only superusers can create admin/superuser accounts
    if (user_data.is_admin or user_data.is_superuser) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can create admin accounts"
        )
    
    # Create user
    password_hash = hash_password(user_data.password)
    
    user = await db.user.create(
        data={
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "is_active": True,
            "is_admin": user_data.is_admin,
            "is_superuser": user_data.is_superuser
        }
    )
    
    await log_audit(
        action="admin_user_created",
        user_id=current_user.id,
        resource=f"user:{user.id}",
        details={"email": user.email, "username": user.username},
        ip_address=request.client.host if request.client else None
    )
    
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    request: Request,
    user_id: str,
    user_data: AdminUserUpdate,
    current_user=Depends(get_current_admin_user)
):
    """Update user (admin only)."""
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only superusers can modify admin status
    if (user_data.is_admin is not None or user_data.is_superuser is not None) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can modify admin status"
        )
    
    # Prevent users from removing their own superuser status
    if user_id == current_user.id and user_data.is_superuser is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own superuser status"
        )
    
    # Build update data
    update_data = {}
    
    if user_data.email:
        # Check email uniqueness
        existing = await db.user.find_first(
            where={"email": user_data.email, "id": {"not": user_id}}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        update_data["email"] = user_data.email
    
    if user_data.username:
        # Check username uniqueness
        existing = await db.user.find_first(
            where={"username": user_data.username, "id": {"not": user_id}}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        update_data["username"] = user_data.username
    
    if user_data.full_name is not None:
        update_data["full_name"] = user_data.full_name
    
    if user_data.password:
        update_data["password_hash"] = hash_password(user_data.password)
    
    if user_data.is_active is not None:
        update_data["is_active"] = user_data.is_active
    
    if user_data.is_admin is not None:
        update_data["is_admin"] = user_data.is_admin
    
    if user_data.is_superuser is not None:
        update_data["is_superuser"] = user_data.is_superuser
    
    # Update user
    updated_user = await db.user.update(
        where={"id": user_id},
        data=update_data
    )
    
    await log_audit(
        action="admin_user_updated",
        user_id=current_user.id,
        resource=f"user:{user_id}",
        details=update_data,
        ip_address=request.client.host if request.client else None
    )
    
    return UserResponse.model_validate(updated_user)


@router.delete("/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    current_user=Depends(get_current_admin_user)
):
    """Delete user (admin only)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only superusers can delete admin accounts
    if user.is_admin and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can delete admin accounts"
        )
    
    await db.user.delete(where={"id": user_id})
    
    await log_audit(
        action="admin_user_deleted",
        user_id=current_user.id,
        resource=f"user:{user_id}",
        details={"email": user.email, "username": user.username},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "User deleted successfully"}


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user=Depends(get_current_admin_user)
):
    """Get audit logs (admin only)."""
    where_clause = {}
    
    if action:
        where_clause["action"] = {"contains": action}
    
    if user_id:
        where_clause["user_id"] = user_id
    
    total = await db.auditlog.count(where=where_clause)
    
    logs = await db.auditlog.find_many(
        where=where_clause,
        skip=(page - 1) * page_size,
        take=page_size,
        order={"created_at": "desc"}
    )
    
    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats/users", response_model=UserStatsResponse)
async def get_user_stats(current_user=Depends(get_current_admin_user)):
    """Get user statistics (admin only)."""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    total_users = await db.user.count()
    active_users = await db.user.count(where={"is_active": True})
    admin_users = await db.user.count(where={"is_admin": True})
    users_created_today = await db.user.count(where={"created_at": {"gte": today}})
    users_created_this_week = await db.user.count(where={"created_at": {"gte": week_ago}})
    users_created_this_month = await db.user.count(where={"created_at": {"gte": month_ago}})
    
    return UserStatsResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        users_created_today=users_created_today,
        users_created_this_week=users_created_this_week,
        users_created_this_month=users_created_this_month
    )


@router.get("/stats/system", response_model=SystemStatsResponse)
async def get_system_stats(current_user=Depends(get_current_admin_user)):
    """Get system statistics (admin only)."""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    total_images = await db.generatedimage.count()
    images_today = await db.generatedimage.count(where={"created_at": {"gte": today}})
    images_week = await db.generatedimage.count(where={"created_at": {"gte": week_ago}})
    images_month = await db.generatedimage.count(where={"created_at": {"gte": month_ago}})
    active_sessions = await db.session.count(where={"expires_at": {"gt": now}})
    total_api_keys = await db.apikey.count(where={"is_active": True})
    
    return SystemStatsResponse(
        total_images_generated=total_images,
        images_generated_today=images_today,
        images_generated_this_week=images_week,
        images_generated_this_month=images_month,
        active_sessions=active_sessions,
        total_api_keys=total_api_keys
    )
