# 🔐 Authentication System Setup Guide

This guide covers the setup and usage of the AI POD API authentication system with database persistence.

## 📋 Prerequisites

- Python 3.8+
- pip package manager
- Google Cloud credentials (for image generation features)

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
cd gemini_tunnel
pip install -r requirements.txt
```

This installs:
- **Prisma**: ORM for database management
- **passlib[bcrypt]**: Password hashing
- **python-jose[cryptography]**: JWT token generation
- **python-multipart**: Form data parsing

### 2. Generate Prisma Client

```bash
prisma generate
```

This creates the Python client from `schema.prisma`.

### 3. Create Database

```bash
prisma db push
```

This creates the SQLite database with all tables:
- `User` - User accounts
- `ApiKey` - API keys for programmatic access
- `Session` - Active user sessions
- `GeneratedImage` - Image generation history
- `AuditLog` - Admin action audit trail

### 4. Initialize Database with Admin User

```bash
python setup_db.py
```

This creates the default admin account:
- **Email**: admin@aipod.com
- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change the default password after first login!

## 🏃 Running the Application

### Start the Server

```bash
uvicorn main_refactored:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Base URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🔑 Authentication System Overview

### User Roles

1. **Regular User** (`is_admin=False`)
   - Register and login
   - Generate images
   - Manage own API keys
   - View own sessions

2. **Admin** (`is_admin=True`)
   - All regular user permissions
   - View all users
   - Update non-admin users
   - View audit logs
   - Access statistics

3. **Superuser** (`is_superuser=True`)
   - All admin permissions
   - Create/update/delete admin accounts
   - Full system control

### Authentication Methods

#### 1. JWT Bearer Tokens (Recommended for Web/Mobile Apps)

**Registration:**
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "myusername",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Login:**
```bash
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=myusername&password=SecurePass123!
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Using Access Token:**
```bash
GET /auth/me
Authorization: Bearer eyJhbGc...
```

**Refresh Token:**
```bash
POST /auth/refresh
Authorization: Bearer eyJhbGc... (refresh token)
```

#### 2. API Keys (Recommended for Scripts/Integrations)

**Create API Key:**
```bash
POST /auth/api-keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Integration Key",
  "expires_in_days": 90
}
```

**Response:**
```json
{
  "id": "uuid",
  "key": "sk_live_abc123...",
  "name": "My Integration Key",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

⚠️ **Important**: Save the API key immediately - it won't be shown again!

**Using API Key:**
```bash
POST /generate/gemini
X-API-Key: sk_live_abc123...
Content-Type: application/json

{
  "prompt": "A beautiful sunset"
}
```

## 🛠️ API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with credentials | No |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| GET | `/auth/me` | Get current user info | Access Token |
| GET | `/auth/sessions` | List active sessions | Access Token |
| DELETE | `/auth/sessions/{id}` | Revoke session | Access Token |
| POST | `/auth/api-keys` | Create API key | Access Token |
| GET | `/auth/api-keys` | List API keys | Access Token |
| DELETE | `/auth/api-keys/{id}` | Revoke API key | Access Token |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | List all users | Admin |
| GET | `/admin/users/{id}` | Get user details | Admin |
| POST | `/admin/users` | Create user | Admin |
| PATCH | `/admin/users/{id}` | Update user | Admin |
| DELETE | `/admin/users/{id}` | Delete user | Admin |
| GET | `/admin/audit-logs` | View audit trail | Admin |
| GET | `/admin/stats/users` | User statistics | Admin |
| GET | `/admin/stats/system` | System statistics | Admin |

### Image Generation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate/gemini` | Generate images with Gemini | Yes |
| POST | `/edit/gemini` | Edit images with Gemini | Yes |
| POST | `/upscale` | Upscale images | Yes |
| POST | `/inpaint` | Inpaint images | Yes |

## 📊 Database Schema

### User Table
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  password_hash String
  full_name     String?
  is_admin      Boolean   @default(false)
  is_superuser  Boolean   @default(false)
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
}
```

### ApiKey Table
```prisma
model ApiKey {
  id         String    @id @default(uuid())
  user_id    String
  key_hash   String    @unique
  name       String
  is_active  Boolean   @default(true)
  expires_at DateTime?
  created_at DateTime  @default(now())
}
```

### Session Table
```prisma
model Session {
  id         String    @id @default(uuid())
  user_id    String
  token_hash String    @unique
  ip_address String?
  user_agent String?
  expires_at DateTime
  created_at DateTime  @default(now())
}
```

## 🔒 Security Features

1. **Password Hashing**: Bcrypt with automatic salt generation
2. **JWT Tokens**: 
   - Access tokens expire in 1 hour
   - Refresh tokens expire in 7 days
   - HS256 algorithm with secret key
3. **API Keys**: 
   - SHA-256 hashed storage
   - Optional expiration dates
   - Prefix identification (sk_live_)
4. **Session Management**: 
   - Tracks IP address and user agent
   - Automatic expiration
   - Manual revocation support
5. **Audit Logging**: All admin actions logged with timestamp and details
6. **Rate Limiting**: (TODO) Implement rate limiting per user/API key

## 🧪 Testing

### Test User Registration
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=Test123!"
```

### Test Image Generation
```bash
curl -X POST http://localhost:8000/generate/gemini \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains"
  }'
```

## 🐛 Troubleshooting

### Issue: "Import 'prisma' could not be resolved"

**Solution**: Run `prisma generate` to create the Python client.

### Issue: "Table not found" errors

**Solution**: Run `prisma db push` to create database tables.

### Issue: "Invalid credentials"

**Solution**: 
- Verify username/email and password
- Check if user account is active (`is_active=True`)
- Try registering a new account

### Issue: "Token expired"

**Solution**: Use the refresh token to get a new access token via `/auth/refresh`.

### Issue: "Permission denied"

**Solution**: 
- Admin endpoints require `is_admin=True`
- Superuser actions require `is_superuser=True`
- Check user permissions via `/auth/me`

## 📚 Environment Variables

Add these to your `.env` file:

```env
# JWT Settings
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=file:./dev.db

# Google Cloud (existing)
API_KEY=your-gemini-api-key
PROJECT_ID=your-project-id
LOCATION=us-central1
```

## 🔄 Migration from Legacy Auth

If you were using the legacy `/auth/token` endpoint:

1. The new endpoints are `/auth/login` and `/auth/register`
2. Token format remains compatible (JWT Bearer)
3. Sessions and API keys are new features
4. Old tokens won't work - users must re-authenticate

## 📖 Additional Resources

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [Prisma Python Documentation](https://prisma-client-py.readthedocs.io/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error logs in terminal output
3. Verify database schema with `prisma studio`
4. Check audit logs via `/admin/audit-logs` (admin only)
