import { joinBackendPath } from './apiConfig';

interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login?: string;
}

interface LoginResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(joinBackendPath('/api/v1/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Unable to sign in. Please check your credentials.';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // ignore JSON parse errors and fall back to default message
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data as LoginResult;
}

export async function registerRequest(payload: RegisterPayload): Promise<UserResponse> {
  const response = await fetch(joinBackendPath('/api/v1/auth/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Unable to register. Please try again.';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data as UserResponse;
}

export async function fetchCurrentUser(token: string): Promise<UserResponse> {
  const response = await fetch(joinBackendPath('/api/v1/auth/me'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = 'Authentication required.';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data as UserResponse;
}
