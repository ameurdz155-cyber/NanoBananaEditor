import { GoogleGenAI } from '@google/genai';

export interface TextToImageRequest {
  prompt: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number;
  apiKey?: string;
}

export interface TextToImageResponse {
  images: string[];
  prompt: string;
  timestamp: number;
  error?: string;
}

export class TextToImageService {
  private genAI: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash-image-preview';

  private getApiKey(providedKey?: string): string {
    const key = providedKey ||
                localStorage.getItem('gemini_api_key') ||
                import.meta.env.VITE_GEMINI_API_KEY ||
                '';

    if (!key) {
      throw new Error('No API key provided. Please configure your Gemini API key.');
    }

    return key;
  }

  private getClient(apiKey?: string): GoogleGenAI {
    const key = this.getApiKey(apiKey);

    if (!this.genAI || apiKey) {
      this.genAI = new GoogleGenAI({ apiKey: key });
    }

    return this.genAI;
  }

  async generateImage(request: TextToImageRequest): Promise<TextToImageResponse> {
    try {
      const startTime = Date.now();

      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required for image generation');
      }

      const contents: any[] = [{ text: request.prompt }];

      if (request.referenceImages && request.referenceImages.length > 0) {
        if (request.referenceImages.length > 2) {
          throw new Error('Maximum 2 reference images are allowed');
        }

        request.referenceImages.forEach(image => {
          const base64Data = image.includes('base64,')
            ? image.split('base64,')[1]
            : image;

          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          });
        });
      }

      const client = this.getClient(request.apiKey);
      const response = await client.models.generateContent({
        model: this.modelName,
        contents,
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No image generated. Please try again with a different prompt.');
      }

      const images: string[] = [];
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(part.inlineData.data);
        }
      }

      if (images.length === 0) {
        throw new Error('No images were returned from the API');
      }

      return {
        images,
        prompt: request.prompt,
        timestamp: startTime,
      };
    } catch (error: any) {
      console.error('Text-to-image generation error:', error);

      let errorMessage = 'Failed to generate image. ';

      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage += 'Invalid API key.';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage += 'API key lacks permissions.';
      } else if (error.message?.includes('RATE_LIMIT')) {
        errorMessage += 'Rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      return {
        images: [],
        prompt: request.prompt,
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  async validateApiKey(apiKey?: string): Promise<boolean> {
    try {
      const key = this.getApiKey(apiKey);
      const testClient = new GoogleGenAI({ apiKey: key });

      const response = await testClient.models.generateContent({
        model: this.modelName,
        contents: 'test',
      });

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  convertToDataUrl(base64Image: string, mimeType: string = 'image/png'): string {
    if (base64Image.startsWith('data:')) {
      return base64Image;
    }
    return `data:${mimeType};base64,${base64Image}`;
  }

  async convertImageToBase64(imageUrl: string): Promise<string> {
    try {
      if (imageUrl.includes('base64,')) {
        return imageUrl.split('base64,')[1];
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split('base64,')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }
}

export const textToImageService = new TextToImageService();