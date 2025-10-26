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

      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        return { valid: false, error: 'API quota exceeded. Please check your usage limits.' };
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
  referenceImages?: string[]; // base64 array
  temperature?: number;
  seed?: number;
}

export interface EditRequest {
  instruction: string;
  originalImage: string; // base64
  referenceImages?: string[]; // base64 array
  maskImage?: string; // base64
  temperature?: number;
  seed?: number;
}

export interface SegmentationRequest {
  image: string; // base64
  query: string; // "the object at pixel (x,y)" or "the red car"
}

export class GeminiService {
  async generateImage(request: GenerationRequest): Promise<string[]> {
    try {
      const contents: any[] = [{ text: request.prompt }];
      
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

      const response = await getGenAI().models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
      });

      const images: string[] = [];

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(part.inlineData.data);
        }
      }

      return images;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  async editImage(request: EditRequest): Promise<string[]> {
    try {
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

      const response = await getGenAI().models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
      });

      const images: string[] = [];

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(part.inlineData.data);
        }
      }

      return images;
    } catch (error) {
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
      ? "\n\nIMPORTANT: Apply changes ONLY where the mask image shows white pixels (value 255). Leave all other areas completely unchanged. Respect the mask boundaries precisely and maintain seamless blending at the edges."
      : "";

    return `Edit this image according to the following instruction: ${request.instruction}

Maintain the original image's lighting, perspective, and overall composition. Make the changes look natural and seamlessly integrated.${maskInstruction}

Preserve image quality and ensure the edit looks professional and realistic.`;
  }
}

export const geminiService = new GeminiService();

// Text helper: improve a user prompt for image generation
export async function improvePromptText(prompt: string): Promise<string> {
  try {
    const contents = [
      { text: `Improve the following image generation prompt by making it more descriptive, cinematic, and specific while preserving any placeholders like [subject]. Return only the improved prompt text without extra commentary.\n\nOriginal Prompt:\n${prompt}` }
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