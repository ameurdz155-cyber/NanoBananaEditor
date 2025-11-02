import { buildJsonHeaders, joinBackendPath } from './apiConfig';

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResult {
  access_token: string;
  token_type: string;
  username: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(joinBackendPath('/auth/login'), {
    method: 'POST',
    headers: buildJsonHeaders(),
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
