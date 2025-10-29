import { GoogleGenAI } from '@google/genai';

// Get API key from localStorage or environment variable
const getApiKey = () => {
  const storedKey = localStorage.getItem('gemini_api_key');
  return storedKey || import.meta.env.VITE_GEMINI_API_KEY || '';
};

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Please configure your Gemini API key in Settings');
  }
  // Create new instance with the API key
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Validate API key by making a simple test request
export const validateApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { valid: false, error: 'No API key configured. Please add your Gemini API key.' };
    }

    if (!apiKey.startsWith('AIza')) {
      return { valid: false, error: 'Invalid API key format. Gemini API keys should start with "AIza".' };
    }

    // Try to create a client and make a simple test request
    try {
      const testAI = new GoogleGenAI({ apiKey });

      // Make a simple test request to validate the key
      const response = await testAI.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: "Generate a simple test: say 'API key is working'",
      });

      // Check if we got a valid response
      if (response && response.candidates && response.candidates.length > 0) {
        // Reset the genAI instance with the new key if valid
        genAI = new GoogleGenAI({ apiKey });
        return { valid: true };
      }

      return { valid: false, error: 'Received empty response from API. Please check your API key.' };
    } catch (apiError: any) {
      console.error('API validation error:', apiError);

      // Parse error messages for better user feedback
      const errorMessage = apiError?.message || apiError?.error?.message || '';

      if (errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.includes('API key not valid') ||
          errorMessage.includes('401') ||
          apiError?.status === 401) {
        return { valid: false, error: 'Invalid API key. Please check your Gemini API key.' };
      }

      if (errorMessage.includes('PERMISSION_DENIED') ||
          errorMessage.includes('403') ||
          apiError?.status === 403) {
        return { valid: false, error: 'API key lacks permissions. Enable the Generative Language API in Google Cloud Console.' };
      }

      if (errorMessage.includes('quota') || errorMessage.includes('429') || apiError?.status === 429) {
        return { valid: false, error: 'API quota exceeded. Please check your usage limits or try again later.' };
      }

      if (errorMessage.includes('model')) {
        return { valid: false, error: 'Model not available. Please ensure your API key has access to Gemini 2.5 Flash Image model.' };
      }

      return { valid: false, error: `API Error: ${errorMessage.substring(0, 100)}` };
    }
  } catch (error: any) {
    console.error('API key validation error:', error);
    return { valid: false, error: 'Network error. Please check your internet connection.' };
  }
};

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  referenceImages?: string[]; // base64 array
  temperature?: number;
  seed?: number;
  signal?: AbortSignal; // Add abort signal support
}

export interface EditRequest {
  instruction: string;
  originalImage: string; // base64
  referenceImages?: string[]; // base64 array
  maskImage?: string; // base64
  temperature?: number;
  seed?: number;
  signal?: AbortSignal; // Add abort signal support
}

export interface SegmentationRequest {
  image: string; // base64
  query: string; // "the object at pixel (x,y)" or "the red car"
}

export class GeminiService {
  async generateImage(request: GenerationRequest): Promise<string[]> {
    try {
      // Check if request was aborted before starting
      if (request.signal?.aborted) {
        throw new DOMException('Request was cancelled', 'AbortError');
      }

      // Combine prompt with negative prompt if provided
      let fullPrompt = request.prompt;
      if (request.negativePrompt && request.negativePrompt.trim()) {
        fullPrompt = `${request.prompt}\n\nNegative prompt: ${request.negativePrompt}`;
      }
      
      const contents: any[] = [{ text: fullPrompt }];
      
      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach(image => {
          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: image,
            },
          });
        });
      }

      // Create a promise that rejects when abort signal is triggered
      const abortPromise = new Promise((_, reject) => {
        if (request.signal) {
          request.signal.addEventListener('abort', () => {
            reject(new DOMException('Request was cancelled', 'AbortError'));
          });
        }
      });

      // Race between the API call and the abort signal
      const apiPromise = getGenAI().models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
      });

      const response: any = request.signal 
        ? await Promise.race([apiPromise, abortPromise])
        : await apiPromise;

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response from API. Please try again.');
      }

      const images: string[] = [];

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }

      if (images.length === 0) {
        throw new Error('No images were generated. The model may have returned only text.');
      }

      return images;
    } catch (error: any) {
      // Re-throw AbortError without modification
      if (error.name === 'AbortError') {
        throw error;
      }
      
      console.error('❌ Error generating image:', error);
      if (error.message.includes('429')) {
        throw new Error('API quota exceeded. Please check your usage limits or try again later.');
      }
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  async editImage(request: EditRequest): Promise<string[]> {
    try {
      // Check if request was aborted before starting
      if (request.signal?.aborted) {
        throw new DOMException('Request was cancelled', 'AbortError');
      }

      const contents = [
        { text: this.buildEditPrompt(request) },
        {
          inlineData: {
            mimeType: "image/png",
            data: request.originalImage,
          },
        },
      ];

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach(image => {
          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: image,
            },
          });
        });
      }

      if (request.maskImage) {
        contents.push({
          inlineData: {
            mimeType: "image/png",
            data: request.maskImage,
          },
        });
      }

      // Create a promise that rejects when abort signal is triggered
      const abortPromise = new Promise((_, reject) => {
        if (request.signal) {
          request.signal.addEventListener('abort', () => {
            reject(new DOMException('Request was cancelled', 'AbortError'));
          });
        }
      });

      // Race between the API call and the abort signal
      const apiPromise = getGenAI().models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
      });

      const response: any = request.signal 
        ? await Promise.race([apiPromise, abortPromise])
        : await apiPromise;

      const images: string[] = [];

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(part.inlineData.data);
        }
      }

      return images;
    } catch (error: any) {
      // Re-throw AbortError without modification
      if (error.name === 'AbortError') {
        throw error;
      }
      
      console.error('Error editing image:', error);
      throw new Error('Failed to edit image. Please try again.');
    }
  }

  async segmentImage(request: SegmentationRequest): Promise<any> {
    try {
      const prompt = [
        { text: `Analyze this image and create a segmentation mask for: ${request.query}

Return a JSON object with this exact structure:
{
  "masks": [
    {
      "label": "description of the segmented object",
      "box_2d": [x, y, width, height],
      "mask": "base64-encoded binary mask image"
    }
  ]
}

Only segment the specific object or region requested. The mask should be a binary PNG where white pixels (255) indicate the selected region and black pixels (0) indicate the background.` },
        {
          inlineData: {
            mimeType: "image/png",
            data: request.image,
          },
        },
      ];

      const response = await getGenAI().models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: prompt,
      });

      const responseText = response.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error segmenting image:', error);
      throw new Error('Failed to segment image. Please try again.');
    }
  }

  private buildEditPrompt(request: EditRequest): string {
    const maskInstruction = request.maskImage 
      ? "\n\n⚠️ CRITICAL MASK INSTRUCTION: A mask image has been provided showing the EXACT regions to edit. Apply the requested changes ONLY within the white areas (value 255) of the mask. The black areas (value 0) of the mask MUST remain completely untouched and unchanged. Respect the mask boundaries with pixel-perfect precision and ensure seamless, natural blending at the edges where masked and unmasked areas meet."
      : "";

    return `Edit this image according to the following instruction: ${request.instruction}

Maintain the original image's lighting, perspective, and overall composition. Make the changes look natural and seamlessly integrated.${maskInstruction}

Preserve image quality and ensure the edit looks professional and realistic.`;
  }
}

export const geminiService = new GeminiService();

// Text helper: improve a user prompt for image generation
export async function improvePromptText(prompt: string, language: 'en' | 'zh' = 'en'): Promise<string> {
  try {
    const instructionText = language === 'zh' 
      ? `改进以下图像生成提示词，使其更具描述性、更有电影感和更具体，同时保留任何占位符（如 [主题]）。只返回改进后的提示词文本，不要添加额外的评论。\n\n原始提示词:\n${prompt}`
      : `Improve the following image generation prompt by making it more descriptive, cinematic, and specific while preserving any placeholders like [subject]. Return only the improved prompt text without extra commentary.\n\nOriginal Prompt:\n${prompt}`;

    const contents = [
      { text: instructionText }
    ];

    const response = await getGenAI().models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents,
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) return prompt;

    // Find first text part
    const part = candidate.content.parts.find((p: any) => p.text)?.text;
    return (part || '').trim() || prompt;
  } catch (error) {
    console.error('Error improving prompt text:', error);
    throw new Error('Failed to improve prompt.');
  }
}