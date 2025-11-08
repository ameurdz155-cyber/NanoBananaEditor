"""Database configuration and connection management with TinyDB."""

import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from tinydb import TinyDB, Query, where
from tinydb.table import Document
from dotenv import load_dotenv

load_dotenv()

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "ai_pod.json")

# Global database instance
db: Optional[TinyDB] = None


def get_db() -> TinyDB:
    """Get database instance."""
    global db
    if db is None:
        db = TinyDB(DB_PATH, indent=2)
    return db


async def connect_db():
    """Initialize database connection."""
    global db
    db = TinyDB(DB_PATH, indent=2)
    print("✅ Database connected")


async def disconnect_db():
    """Close database connection."""
    global db
    if db:
        db.close()
        db = None
    print("✅ Database disconnected")


def get_table(table_name: str):
    """Get a table from database."""
    database = get_db()
    return database.table(table_name)


async def init_db():
    """Initialize database and create tables."""
    await connect_db()
    # TinyDB creates tables automatically when first used
    print("✅ Database initialized")


async def create_admin_user(
    email: str = "admin@aipod.com",
    username: str = "admin",
    password: str = "admin123",
    full_name: str = "System Administrator"
) -> Dict[str, Any]:
    """Create default admin user if not exists."""
    from services.auth_service_db import hash_password
    
    users_table = get_table("users")
    User = Query()
    
    # Check if admin exists
    existing = users_table.search(
        (User.email == email) | (User.username == username)
    )
    
    if existing:
        print(f"ℹ️  Admin user already exists: {existing[0]['email']}")
        return existing[0]
    
    # Create admin user
    password_hash = hash_password(password)
    now = datetime.utcnow().isoformat()
    
    admin = {
        "id": str(uuid.uuid4()),
        "email": email,
        "username": username,
        "password_hash": password_hash,
        "full_name": full_name,
        "is_active": True,
        "is_admin": True,
        "is_superuser": True,
        "created_at": now,
        "updated_at": now,
        "last_login": None
    }
    
    users_table.insert(admin)
    
    print(f"✅ Admin user created: {admin['email']}")
    print(f"   Username: {username}")
    print(f"   Password: {password}")
    return admin
