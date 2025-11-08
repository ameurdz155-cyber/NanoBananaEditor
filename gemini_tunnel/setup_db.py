"""Database setup and initialization script."""

import asyncio
import sys
from database import connect_db, disconnect_db, create_admin_user


async def init_database():
    """Initialize database with schema and admin user."""
    try:
        print("🚀 Initializing AI POD API Database...")
        print()
        
        # Connect to database
        await connect_db()
        
        # Create admin user
        print("Creating default admin user...")
        await create_admin_user(
            email="admin@aipod.com",
            username="admin",
            password="admin123",
            full_name="System Administrator"
        )
        
        print()
        print("=" * 60)
        print("✅ Database initialization complete!")
        print("=" * 60)
        print()
        print("Default Admin Credentials:")
        print("  Email:    admin@aipod.com")
        print("  Username: admin")
        print("  Password: admin123")
        print()
        print("⚠️  Please change the default password after first login!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(init_database())
