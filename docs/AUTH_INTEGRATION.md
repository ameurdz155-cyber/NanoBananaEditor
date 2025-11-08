# Authentication Integration Guide

## Overview
This document describes the full authentication system integration between the frontend and backend, including login and registration functionality.

## Backend Changes

### 1. Enabled Database Authentication Router
**File:** `gemini_tunnel/main_refactored.py`

- Uncommented `auth_db_router` to enable database-backed authentication
- Uncommented `admin_router` for admin functionality
- Set proper URL prefixes:
  - Legacy auth: `/api/v1/auth/legacy`
  - New database auth: `/api/v1/auth`
  - Admin routes: `/api/v1/admin`

### 2. Fixed TinyDB Integration
**File:** `gemini_tunnel/routes/auth_db.py`

Converted all Prisma database calls to TinyDB:
- `POST /api/v1/auth/register` - Register new users
- `POST /api/v1/auth/login` - Login with username/email and password
- `POST /api/v1/auth/refresh` - Refresh access tokens
- `GET /api/v1/auth/me` - Get current user info
- `GET /api/v1/auth/sessions` - List user sessions
- `DELETE /api/v1/auth/sessions/{id}` - Revoke sessions
- `POST /api/v1/auth/api-keys` - Create API keys
- `GET /api/v1/auth/api-keys` - List API keys
- `DELETE /api/v1/auth/api-keys/{id}` - Revoke API keys

### 3. Authentication Service
**File:** `gemini_tunnel/services/auth_service_db.py`

Features:
- Password hashing with bcrypt
- JWT token generation (access + refresh tokens)
- User authentication
- Session management
- API key management
- Audit logging

### 4. Database Setup
**File:** `gemini_tunnel/database.py`

- TinyDB integration
- Auto-creates tables on first use
- Includes admin user creation function

**File:** `gemini_tunnel/setup_db.py`

Initialize database with default admin user:
```bash
cd gemini_tunnel
python setup_db.py
```

Default credentials:
- Email: `admin@aipod.com`
- Username: `admin`
- Password: `admin123`

## Frontend Changes

### 1. Updated Auth Service
**File:** `src/services/authService.ts`

Added:
- `loginRequest()` - Updated to use `/api/v1/auth/login`
- `registerRequest()` - New function for user registration

Returns full user object with:
- `id`, `email`, `username`, `full_name`
- `is_admin`, `is_superuser`, `is_active`
- JWT tokens (access + refresh)

### 2. Enhanced Auth Store
**File:** `src/store/useAuthStore.ts`

Updated state:
- Added `refreshToken` storage
- Enhanced `user` object with full details
- `isPremiumUser` now based on `is_admin` or `is_superuser`

New methods:
- `register()` - Register new user and auto-login

### 3. Registration Page Component
**File:** `src/components/RegistrationPage.tsx`

Features:
- Email, username, full name, password fields
- Password confirmation validation
- Client-side validation (min length, matching passwords)
- Error handling with backend error messages
- Navigation back to login
- Consistent UI matching LoginPage design

### 4. Updated Login Page
**File:** `src/components/LoginPage.tsx`

- Added "Sign up" button linking to registration
- Updated default credentials hint

### 5. App Integration
**File:** `src/App.tsx`

- Added state to toggle between login and registration views
- Conditional rendering based on auth state

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "John Doe" (optional)
}
```

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "full_name": "John Doe",
  "is_active": true,
  "is_admin": false,
  "is_superuser": false,
  "created_at": "2025-01-01T00:00:00",
  "last_login": null
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "admin@aipod.com",
    "username": "admin",
    "full_name": "System Administrator",
    "is_active": true,
    "is_admin": true,
    "is_superuser": true,
    "created_at": "2025-01-01T00:00:00",
    "last_login": "2025-01-01T00:00:00"
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

## Testing

### 1. Start Backend
```bash
cd gemini_tunnel
uvicorn main_refactored:app --reload
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Login
1. Open app in browser
2. Use default credentials: `admin` / `admin123`
3. Verify successful login and token storage

### 4. Test Registration
1. Click "Sign up" on login page
2. Fill in registration form:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `test123456`
3. Submit and verify auto-login
4. Check that new user is stored in `gemini_tunnel/ai_pod.json`

### 5. Test Token Persistence
1. Login successfully
2. Refresh page
3. Verify user remains authenticated

## Security Features

1. **Password Security**
   - Bcrypt hashing with automatic salting
   - Passwords truncated to 72 bytes for bcrypt compatibility

2. **JWT Tokens**
   - Access tokens expire in 30 minutes
   - Refresh tokens expire in 7 days
   - Tokens include user ID and type claims

3. **Session Management**
   - IP address and user agent tracking
   - Session expiration
   - Manual session revocation

4. **API Key Support**
   - Long-lived API keys for programmatic access
   - Key expiration support
   - Activity tracking

5. **Audit Logging**
   - All authentication events logged
   - User registration, login, logout tracked
   - Resource access logging

## Database Schema

### Users Table
- `id`: UUID
- `email`: Unique email address
- `username`: Unique username
- `password_hash`: Bcrypt hashed password
- `full_name`: Optional full name
- `is_active`: Account status
- `is_admin`: Admin privileges
- `is_superuser`: Superuser privileges
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `last_login`: Last login timestamp

### Sessions Table
- `id`: UUID
- `user_id`: Foreign key to users
- `token_hash`: Hashed session token
- `ip_address`: Client IP
- `user_agent`: Client user agent
- `expires_at`: Expiration timestamp
- `created_at`: Timestamp
- `last_activity`: Last activity timestamp

### API Keys Table
- `id`: UUID
- `user_id`: Foreign key to users
- `key_hash`: Hashed API key
- `name`: Key name/description
- `is_active`: Key status
- `expires_at`: Optional expiration
- `last_used`: Last usage timestamp
- `created_at`: Timestamp

### Audit Logs Table
- `id`: UUID
- `user_id`: Foreign key to users (optional)
- `action`: Action performed
- `resource`: Resource affected
- `details`: Additional details
- `ip_address`: Client IP
- `created_at`: Timestamp

## Troubleshooting

### Issue: Login fails with "Invalid username or password"
- Verify database is initialized: `python setup_db.py`
- Check credentials match default: `admin` / `admin123`
- Verify backend is running on correct port

### Issue: Registration fails with "Email already registered"
- Check if user already exists in database
- Use different email address

### Issue: Token not persisting
- Check browser localStorage for `ai-pod-auth` key
- Clear browser cache and retry
- Check for CORS issues in browser console

### Issue: API connection errors
- Verify backend URL in `src/services/apiConfig.ts`
- Check backend is running: `http://localhost:8000/health`
- Verify CORS settings in backend

## Next Steps

1. **Password Reset**
   - Implement forgot password flow
   - Email verification system

2. **OAuth Integration**
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth

3. **Two-Factor Authentication**
   - TOTP support
   - SMS verification

4. **User Profile Management**
   - Update profile endpoint
   - Avatar upload
   - Preferences storage

5. **Admin Dashboard**
   - User management interface
   - Activity monitoring
   - System statistics
