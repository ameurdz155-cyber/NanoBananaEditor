# Backend Integration Test Checklist

## 🧪 Testing Guide

After the changes, verify the following functionality to ensure complete backend integration.

---

## 1. Categories Load on App Startup ✅

**Test Steps:**
1. Clear browser cache and localStorage
2. Login to the application
3. Open browser DevTools → Console
4. Look for: `✅ Categories loaded from backend: X`

**Expected Result:**
- Categories load immediately after authentication
- Console shows successful category loading
- No errors in console

**Files Changed:**
- `src/App.tsx` - Added category loading in useEffect when `isAuthenticated` is true

---

## 2. Categories Display in Templates View ✅

**Test Steps:**
1. Navigate to Templates View
2. Check category filter dropdown/buttons
3. Verify categories match those created in admin panel

**Expected Result:**
- All categories created via Category Management appear
- No hardcoded default categories if none exist in backend
- Category names, emojis, and images display correctly

**Files Verified:**
- `src/components/TemplatesView.tsx` - Uses `promptCategories` from store
- `resolvedCategories` memo only uses backend data

---

## 3. Template-Category Relationships ✅

**Test Steps:**
1. Create a new category in Category Management (e.g., "Test Category")
2. Create a new template and assign it to "Test Category"
3. Go to Templates View and filter by "Test Category"
4. Verify the template appears under correct category

**Expected Result:**
- Template appears in correct category
- Category ID references validated by backend
- No broken references or missing categories

**Backend Validation:**
- `gemini_tunnel/routes/templates.py` - `_validate_category_id()` ensures valid references

---

## 4. History Auto-Save ✅

**Test Steps:**
1. Generate an image
2. Check browser DevTools → Network tab
3. Look for POST request to `/api/v1/history`
4. Refresh page
5. Verify history persists

**Expected Result:**
- POST to `/api/v1/history` on every generation
- History panel shows generation after refresh
- All generation data (prompt, settings, image URL) persists

**Files:**
- `src/store/useAppStore.ts` - `addGeneration()` is async and saves to backend
- `gemini_tunnel/routes/history.py` - Backend CRUD endpoints

---

## 5. Admin Category Management Sync ✅

**Test Steps:**
1. Go to Category Management page
2. Create a new category "Design Patterns"
3. Immediately go to Templates View
4. Verify "Design Patterns" appears in category list

**Expected Result:**
- New categories appear immediately in Templates View
- No need to refresh page
- Store updates synchronously

**Files:**
- `src/components/CategoryManagementPage.tsx` - Calls `setPromptCategories()` after creation
- `src/App.tsx` - Initial load populates store

---

## 6. Template Seeding (First Login) ✅

**Test Steps:**
1. Create a new user account (or clear DB for existing user)
2. Login for the first time
3. Go to Templates View
4. Verify default templates exist

**Expected Result:**
- Backend automatically seeds default templates on first fetch
- Default categories created for seeded templates
- All templates have valid category references

**Backend Logic:**
- `gemini_tunnel/routes/templates.py` - `_seed_default_templates()` on empty response
- `_ensure_category()` creates categories if missing

---

## 7. Cross-Session Persistence ✅

**Test Steps:**
1. Create a category "Session Test"
2. Create a template in "Session Test"
3. Generate an image
4. Logout
5. Login again
6. Verify all data persists

**Expected Result:**
- Categories persist across sessions
- Templates persist across sessions
- History persists across sessions
- No data loss on logout/login

---

## 8. Error Handling ✅

**Test Steps:**
1. Disconnect from internet or stop backend server
2. Try to create a category/template
3. Try to generate an image
4. Reconnect/restart backend
5. Retry operations

**Expected Result:**
- User-friendly error messages (not 500 errors)
- Failed operations can be retried
- No silent failures
- Console shows clear error messages

**Error Handling:**
- All API calls have try/catch blocks
- `fetchWithAuth` handles token refresh
- HTTP error codes returned properly

---

## 9. Authentication Flow ✅

**Test Steps:**
1. Logout
2. Try to access Templates View
3. Verify redirect to login
4. Login
5. Verify automatic data loading

**Expected Result:**
- Unauthenticated users redirected to login
- After login, categories/history/boards auto-load
- JWT token in Authorization header
- Token refresh on 401 errors

**Files:**
- `src/services/fetchWithAuth.ts` - Token management
- Backend uses `Depends(get_current_user)` on all endpoints

---

## 10. Performance Check ✅

**Test Steps:**
1. Open DevTools → Network tab
2. Login to application
3. Count API requests on startup
4. Verify no duplicate or unnecessary requests

**Expected Result:**
- Single request to `/api/v1/categories` on startup
- Single request to `/api/v1/history` on startup
- Single request to `/api/v1/boards` on startup
- Single request to `/api/v1/templates` when opening Templates View
- No redundant fetches

**Optimization:**
- `hasFetchedTemplatesRef.current` prevents duplicate template fetches
- useEffect dependencies properly set

---

## 🎯 Quick Smoke Test

Run this minimal test to verify basic functionality:

1. ✅ Login → Categories load (check console)
2. ✅ Go to Category Management → Create "Smoke Test" category
3. ✅ Go to Templates View → "Smoke Test" appears in filters
4. ✅ Create template in "Smoke Test" category
5. ✅ Generate an image
6. ✅ Check History Panel → Generation appears
7. ✅ Refresh page → All data persists
8. ✅ Logout → Login → All data still exists

**If all steps pass, backend integration is complete! ✅**

---

## 🐛 Common Issues & Fixes

### Issue: Categories don't appear in Templates View
**Fix**: Check browser console for errors, verify `/api/v1/categories` returns 200, ensure `isAuthenticated` is true

### Issue: Templates show "undefined" category
**Fix**: Backend validation in `_validate_category_id()` should prevent this. If it happens, check template `categoryId` matches existing category `id`

### Issue: History doesn't persist
**Fix**: Check Network tab for POST to `/api/v1/history`, verify backend returns 201, check authentication token is valid

### Issue: Default templates don't appear for new users
**Fix**: Backend `_seed_default_templates()` runs on empty response. Verify `DEFAULT_TEMPLATES` array exists in `templates.py`

### Issue: 500 error on history endpoints
**Fix**: Already fixed - ensure `current_user: Dict[str, Any]` (not `UserResponse`) and use `.get("id")` or `.get("sub")`

---

## 📊 Database Schema Verification

### Categories Table:
```json
{
  "id": "cat-xxxxxxxxxxxx",
  "name": "string",
  "description": "string | null",
  "emoji": "string",
  "image": "string | null",
  "isDefault": false,
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "userId": "user-id"
}
```

### Templates Table:
```json
{
  "id": "tpl-xxxxxxxxxxxx",
  "name": "string",
  "description": "string | null",
  "positivePrompt": "string",
  "negativePrompt": "string | null",
  "categoryId": "cat-xxxxxxxxxxxx | null",
  "emoji": "string | null",
  "image": "string | null",
  "isDefault": false,
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "userId": "user-id"
}
```

### History Table:
```json
{
  "id": "hist-xxxxxxxxxxxx",
  "timestamp": 1234567890,
  "prompt": "string",
  "negativePrompt": "string",
  "imageUrl": "string",
  "settings": {
    "model": "string",
    "aspectRatio": "string",
    "iterations": 1
  },
  "userId": "user-id"
}
```

---

## ✅ Final Verification

Run this SQL-like query concept on TinyDB to verify data:

```python
# In backend console or test script
from database import get_table
from tinydb import Query

# Check categories exist for user
categories = get_table("categories")
Cat = Query()
user_categories = categories.search(Cat.userId == "test-user-id")
print(f"Categories: {len(user_categories)}")

# Check templates reference valid categories
templates = get_table("templates")
Tpl = Query()
user_templates = templates.search(Tpl.userId == "test-user-id")
for tpl in user_templates:
    if tpl.get("categoryId"):
        cat = categories.get((Cat.id == tpl["categoryId"]) & (Cat.userId == "test-user-id"))
        if not cat:
            print(f"❌ Template {tpl['name']} has invalid categoryId: {tpl['categoryId']}")
        else:
            print(f"✅ Template {tpl['name']} → Category {cat['name']}")
```

---

**All tests passing = Full backend integration complete! 🎉**
