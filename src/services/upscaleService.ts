import { buildJsonHeaders, joinBackendPath } from './apiConfig';

type ImagePayload = {
  mime_type: string;
  b64_data: string;
};

export interface UpscaleRequest {
  image: string;
  scale: number;
  model: string;
}

export interface UpscaleResponse {
  model: string;
  scale: number;
  image: ImagePayload;
}

const UPSCALE_ENDPOINT = '/upscale';

export async function upscaleImage(
  request: UpscaleRequest,
  signal?: AbortSignal,
): Promise<UpscaleResponse> {
  const response = await fetch(joinBackendPath(UPSCALE_ENDPOINT), {
    method: 'POST',
    headers: buildJsonHeaders(),
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let message = 'Failed to upscale image. Please try again.';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Ignore parsing issues and fall back to default message
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return payload as UpscaleResponse;
}
