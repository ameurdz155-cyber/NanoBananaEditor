# 🚀 Quick Start Guide - AI POD API with Authentication

## ✅ Setup Complete!

Your AI POD API is now running with full authentication system at **http://localhost:8000**

### 📍 Important URLs
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### 🔑 Default Admin Credentials
```
Email:    admin@aipod.com
Username: admin
Password: admin123
```
⚠️ **Change this password immediately after first login!**

---

## 🧪 Quick Test Commands

### 1. Test Health Endpoint
```powershell
curl http://localhost:8000/health
```

### 2. Register a New User
```powershell
curl -X POST http://localhost:8000/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

### 3. Login
```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=testuser&password=Test123!"
```

**Save the `access_token` from the response!**

### 4. Get Current User Info
```powershell
# Replace YOUR_TOKEN with the access_token from login
curl -X GET http://localhost:8000/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Create API Key
```powershell
curl -X POST http://localhost:8000/auth/api-keys `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "My API Key",
    "expires_days": 90
  }'
```

### 6. Generate Image (with Bearer Token)
```powershell
curl -X POST http://localhost:8000/generate/gemini `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "prompt": "A beautiful sunset over mountains"
  }'
```

### 7. Generate Image (with API Key)
```powershell
# Replace YOUR_API_KEY with the key from step 5
curl -X POST http://localhost:8000/generate/gemini `
  -H "X-API-Key: YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "prompt": "A beautiful sunset over mountains"
  }'
```

---

## 🔐 Admin Commands

Login as admin first to get admin token:
```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=admin&password=admin123"
```

### List All Users
```powershell
curl -X GET "http://localhost:8000/admin/users?page=1&page_size=10" `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View User Statistics
```powershell
curl -X GET http://localhost:8000/admin/stats/users `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View System Statistics
```powershell
curl -X GET http://localhost:8000/admin/stats/system `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Audit Logs
```powershell
curl -X GET "http://localhost:8000/admin/audit-logs?page=1&page_size=20" `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Create New User (Admin Only)
```powershell
curl -X POST http://localhost:8000/admin/users `
  -H "Authorization: Bearer ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePass123!",
    "full_name": "New User",
    "is_admin": false
  }'
```

---

## 📊 Database Information

- **Type**: SQLite
- **Location**: `./gemini_tunnel/ai_pod.db`
- **Schema**: 5 tables (User, ApiKey, Session, GeneratedImage, AuditLog)

### View Database (Optional)
```powershell
# Install Prisma Studio (if not installed)
npm install -g prisma

# Open database viewer
cd gemini_tunnel
prisma studio
```

---

## 🛠️ Useful Commands

### Restart Server
```powershell
cd C:\Users\med\Desktop\mabrouk_dev\Projects\Desktop\AI_POD\gemini_tunnel
uvicorn main_refactored:app --reload --host 0.0.0.0 --port 8000
```

### Reset Database (⚠️ Deletes all data!)
```powershell
cd gemini_tunnel
Remove-Item ai_pod.db
prisma db push
python setup_db.py
```

### View Server Logs
The server logs are displayed in the terminal where uvicorn is running.

---

## 📖 API Endpoints Overview

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with credentials |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| GET | `/auth/sessions` | List user sessions |
| DELETE | `/auth/sessions/{id}` | Revoke session |
| POST | `/auth/api-keys` | Create API key |
| GET | `/auth/api-keys` | List API keys |
| DELETE | `/auth/api-keys/{id}` | Revoke API key |

### Admin Endpoints (Requires Admin Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/{id}` | Get user details |
| POST | `/admin/users` | Create user |
| PATCH | `/admin/users/{id}` | Update user |
| DELETE | `/admin/users/{id}` | Delete user |
| GET | `/admin/audit-logs` | View audit logs |
| GET | `/admin/stats/users` | User statistics |
| GET | `/admin/stats/system` | System statistics |

### Image Generation Endpoints (Requires Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/gemini` | Generate images |
| POST | `/edit/gemini` | Edit images |
| POST | `/upscale` | Upscale images |
| POST | `/inpaint` | Inpaint images |

---

## 🐛 Troubleshooting

### "401 Unauthorized" Error
- Check if token is valid and not expired
- Ensure Bearer token format: `Authorization: Bearer YOUR_TOKEN`
- Try refreshing the token using `/auth/refresh`

### "403 Forbidden" Error
- Endpoint requires admin privileges
- Login with admin account or ask admin for permissions

### "Module not found" Error
- Ensure you're in the correct directory: `gemini_tunnel/`
- Check all dependencies are installed: `pip install -r requirements.txt`

### Database Connection Error
- Verify `ai_pod.db` exists in gemini_tunnel directory
- Run `prisma db push` to recreate database

---

## 📚 Next Steps

1. ✅ **Change Admin Password**
   - Login as admin
   - Use `/admin/users/{admin_id}` PATCH endpoint

2. ✅ **Test All Endpoints**
   - Visit http://localhost:8000/docs
   - Use interactive API documentation

3. ✅ **Create Regular Users**
   - Test registration flow
   - Verify email/username uniqueness

4. ✅ **Generate API Keys**
   - Create keys for programmatic access
   - Test with different applications

5. ✅ **Monitor System**
   - Check audit logs regularly
   - Review user statistics
   - Monitor system performance

---

## 🎉 Success!

Your AI POD API is fully operational with:
- ✅ JWT-based authentication
- ✅ API key support
- ✅ Session management
- ✅ Admin panel
- ✅ Audit logging
- ✅ User statistics
- ✅ SQLite database

For detailed documentation, see `AUTH_SETUP.md`
