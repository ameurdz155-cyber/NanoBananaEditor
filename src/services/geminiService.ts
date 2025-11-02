import {
  buildJsonHeaders,
  joinBackendPath,
  getStoredBackendUrl,
} from './apiConfig';

interface BackendImagePayload {
  mime_type: string;
  b64_data: string;
}

interface BackendGenerateResponse {
  model: string;
  images: BackendImagePayload[];
}

interface BackendPromptResponse {
  prompt: string;
}

interface BackendErrorBody {
  detail?: string;
  message?: string;
}

const DEFAULT_ERROR_MESSAGE = 'Image service request failed. Please try again.';

const toDataArray = (images: BackendImagePayload[]): string[] => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image) => typeof image?.b64_data === 'string' && image.b64_data.length > 0)
    .map((image) => image.b64_data);
};

const handleResponse = async (response: Response) => {
  if (response.ok) {
    return response.json();
  }

  let errorMessage = DEFAULT_ERROR_MESSAGE;
  try {
    const body = (await response.json()) as BackendErrorBody;
    if (body?.detail) {
      errorMessage = body.detail;
    } else if (body?.message) {
      errorMessage = body.message;
    }
  } catch {
    // ignore JSON parse failure and use fallback message
  }

  throw new Error(errorMessage);
};

export const validateApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  try {
    const response = await fetch(joinBackendPath('/health'), {
      method: 'GET',
      headers: buildJsonHeaders(),
    });
    if (!response.ok) {
      throw new Error('Service unavailable');
    }
    return { valid: true };
  } catch (error) {
    console.error('Image backend validation failed:', error);
    return {
      valid: false,
      error: 'Unable to reach the image service. Please ensure the FastAPI backend is running.',
    };
  }
};

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number;
  aspectRatio?: string;
  width?: number;
  height?: number;
  signal?: AbortSignal;
  iterationIndex?: number;
  totalIterations?: number;
  referenceCount?: number;
  modelType: 'gemini' | 'imagen';
  modelName: string;
  numImages?: number;
}

export interface EditRequest {
  instruction: string;
  originalImage: string;
  referenceImages?: string[];
  maskImage?: string;
  temperature?: number;
  seed?: number;
  signal?: AbortSignal;
}

export interface SegmentationRequest {
  image: string;
  query: string;
}

class GeminiService {
  async generateImage(request: GenerationRequest): Promise<string[]> {
    const endpoint = request.modelType === 'imagen' ? '/generate/imagen' : '/generate/gemini';

    const payload: Record<string, unknown> = {
      prompt: request.prompt,
      negative_prompt: request.negativePrompt || undefined,
      reference_images: request.referenceImages && request.referenceImages.length > 0 ? request.referenceImages : undefined,
      temperature: typeof request.temperature === 'number' ? request.temperature : undefined,
      seed: typeof request.seed === 'number' ? request.seed : undefined,
      aspect_ratio: request.aspectRatio || undefined,
      width: request.width || undefined,
      height: request.height || undefined,
      num_images: request.numImages ?? 1,
    };

    if (request.modelName?.trim()) {
      payload.model = request.modelName.trim();
    }

    const response = await fetch(joinBackendPath(endpoint), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
      signal: request.signal,
    });

    const data = (await handleResponse(response)) as BackendGenerateResponse;
    return toDataArray(data.images);
  }

  async editImage(request: EditRequest): Promise<string[]> {
    const payload = {
      instruction: request.instruction,
      original_image: request.originalImage,
      reference_images: request.referenceImages && request.referenceImages.length > 0 ? request.referenceImages : undefined,
      mask_image: request.maskImage || undefined,
      temperature: typeof request.temperature === 'number' ? request.temperature : undefined,
      seed: typeof request.seed === 'number' ? request.seed : undefined,
    };

  const response = await fetch(joinBackendPath('/edit/gemini'), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
      signal: request.signal,
    });

    const data = (await handleResponse(response)) as BackendGenerateResponse;
    return toDataArray(data.images);
  }

  async segmentImage(request: SegmentationRequest): Promise<any> {
    const payload = {
      image: request.image,
      query: request.query,
    };

  const response = await fetch(joinBackendPath('/segment/gemini'), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
      signal: undefined,
    });

    return handleResponse(response);
  }
}

export const geminiService = new GeminiService();

export async function improvePromptText(prompt: string, language: 'en' | 'zh' = 'en'): Promise<string> {
  const payload = { prompt, language };

  const response = await fetch(joinBackendPath('/prompt/improve'), {
    method: 'POST',
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await handleResponse(response)) as BackendPromptResponse;
  return data.prompt?.trim() || prompt;
}

export async function listImagenModels(): Promise<string[]> {
  try {
    const response = await fetch(joinBackendPath('/models/imagen'), {
      method: 'GET',
      headers: buildJsonHeaders(),
    });
    const data = (await handleResponse(response)) as { models?: string[] };
    const models = Array.isArray(data.models)
      ? data.models
          .filter((entry) => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [];
    if (!models.includes('imagen-3.0-002')) {
      models.push('imagen-3.0-002');
    }
    return models;
  } catch (error) {
    console.error('Failed to fetch Imagen models:', error);
    return [];
  }
}

export const getBackendBaseUrl = () => getStoredBackendUrl();