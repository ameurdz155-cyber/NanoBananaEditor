# Token Refresh Implementation

## Overview
This document describes the automatic token refresh system implemented to solve the "Remember me" session expiration issue.

## Problem
Users were being logged out after a few minutes despite checking "Remember me" because JWT access tokens have a short expiration time (typically 15-30 minutes).

## Solution
Implemented a comprehensive token refresh system with:
1. **Automatic token refresh on 401 errors** - retries failed requests after refreshing
2. **Proactive token refresh** - refreshes tokens before they expire
3. **Token expiration tracking** - stores and monitors token expiration time

## Components

### 1. Auth Store (`src/store/useAuthStore.ts`)
**Added State:**
- `tokenExpiresAt: number | null` - Timestamp when the current token expires

**Added Methods:**
- `refreshAuthToken(): Promise<boolean>` - Calls the refresh endpoint and updates tokens
- `isTokenExpiringSoon(): boolean` - Returns true if token expires in < 5 minutes

**Updated Methods:**
- `login()` - Now calculates and stores token expiration time
- `register()` - Now calculates and stores token expiration time
- `logout()` - Clears tokenExpiresAt

### 2. Auth Service (`src/services/authService.ts`)
**Added Function:**
```typescript
refreshAccessToken(refreshToken: string): Promise<LoginResult>
```
- Calls `POST /api/v1/auth/refresh` with the refresh token
- Returns new access token, refresh token, and user info

### 3. Fetch Wrapper (`src/services/fetchWithAuth.ts`)
**New utility that wraps `fetch()` with:**

**Proactive Refresh:**
- Checks if token is expiring soon before making request
- Automatically refreshes token if needed
- Updates Authorization header with new token

**Reactive Refresh on 401:**
- Catches 401 Unauthorized responses
- Attempts to refresh the token
- Retries the original request with new token
- Falls back to logout if refresh fails

### 4. Board Service (`src/services/boardService.ts`)
**Updated all API calls to use `fetchWithAuth()` instead of `fetch()`:**
- `createBoard()`
- `getBoards()`
- `getBoard()`
- `updateBoard()`
- `deleteBoard()`
- `addImagesToBoard()`
- `removeImageFromBoard()`

## How It Works

### Scenario 1: Token Expiring Soon (Proactive)
```
1. User makes API request
2. fetchWithAuth checks: isTokenExpiringSoon()
3. If true (< 5 min remaining):
   - Call refreshAuthToken()
   - Update Authorization header
   - Proceed with request
4. Response returned normally
```

### Scenario 2: Token Already Expired (Reactive)
```
1. User makes API request
2. Server returns 401 Unauthorized
3. fetchWithAuth catches 401:
   - Call refreshAuthToken()
   - Update Authorization header
   - Retry original request
4. If refresh succeeds: return successful response
5. If refresh fails: logout user
```

### Scenario 3: Refresh Token Expired
```
1. Access token expires
2. Attempt to refresh using refresh token
3. Refresh token also expired
4. Backend returns 401 on refresh endpoint
5. refreshAuthToken() catches error
6. Calls logout() to clear state
7. User redirected to login page
```

## Configuration

**Token Expiration Buffer:**
- Defined in `isTokenExpiringSoon()`: 5 minutes
- Tokens are refreshed when less than 5 minutes remain

**Token Lifespans (Backend):**
- Access Token: ~15-30 minutes (short-lived)
- Refresh Token: ~7 days (long-lived)

## Benefits

1. **Seamless User Experience:**
   - No unexpected logouts during active sessions
   - Automatic background token refresh

2. **Security:**
   - Still uses short-lived access tokens
   - Only refresh tokens are long-lived
   - Tokens can be revoked on the backend

3. **"Remember Me" Support:**
   - Refresh tokens persist in localStorage
   - Sessions can last up to 7 days (or refresh token expiration)
   - Users stay logged in across browser restarts

4. **Reduced Failed Requests:**
   - Proactive refresh prevents 401 errors
   - Retry logic handles edge cases

## Usage

No changes required in application code. All API calls using `boardService` automatically benefit from token refresh.

For other services, import and use `fetchWithAuth`:

```typescript
import { fetchWithAuth } from './fetchWithAuth';

const response = await fetchWithAuth('/api/v1/some-endpoint', {
  method: 'POST',
  headers: buildJsonHeaders(),
  body: JSON.stringify(data),
});
```

## Testing

To verify the implementation:

1. **Proactive Refresh:**
   - Login and wait until token has < 5 minutes remaining
   - Make any API call (e.g., load boards)
   - Check browser console for "Token expiring soon, refreshing proactively..."
   - Verify request succeeds without 401 error

2. **Reactive Refresh on 401:**
   - Login and manually expire the access token
   - Make an API call
   - Check console for "Received 401, attempting token refresh..."
   - Verify request succeeds after refresh

3. **Session Persistence:**
   - Login with "Remember me"
   - Close and reopen browser
   - Verify user is still logged in
   - Continue using app for extended period

4. **Refresh Token Expiration:**
   - Wait for refresh token to expire (or manually delete it)
   - Try to make API call
   - Verify user is logged out gracefully

## Future Enhancements

1. **Automatic Background Refresh:**
   - Add interval timer to refresh tokens periodically
   - Keep sessions alive even when idle

2. **Token Refresh Queue:**
   - Prevent multiple simultaneous refresh requests
   - Queue requests while refresh is in progress

3. **Refresh Token Rotation:**
   - Backend can issue new refresh tokens on each refresh
   - Implement refresh token rotation for enhanced security

4. **Remember Me Toggle:**
   - Add UI option to control refresh token storage
   - Clear refresh tokens if "Remember me" is unchecked
