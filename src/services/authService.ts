import { joinBackendPath } from './apiConfig';

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResult {
  access_token: string;
  token_type: string;
  username: string;
  plan?: 'free' | 'premium' | 'admin';
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  // Don't send x-api-key header for login - use username/password only
  const response = await fetch(joinBackendPath('/auth/login'), {
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
