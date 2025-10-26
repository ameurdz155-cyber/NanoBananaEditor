import { textToImageService, TextToImageRequest } from './textToImageService';

async function runTests() {
  console.log('🧪 Starting Text-to-Image Service Tests\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const apiKey = localStorage.getItem('gemini_api_key') ||
                 process.env.VITE_GEMINI_API_KEY ||
                 '';

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error: any) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}\n`);
      testsFailed++;
    }
  }

  await test('Should throw error when no prompt is provided', async () => {
    const request: TextToImageRequest = {
      prompt: '',
      apiKey
    };

    const result = await textToImageService.generateImage(request);
    if (!result.error || !result.error.includes('Prompt is required')) {
      throw new Error('Expected error for empty prompt');
    }
  });

  await test('Should throw error when no API key is available', async () => {
    const request: TextToImageRequest = {
      prompt: 'A beautiful sunset'
    };

    const savedKey = localStorage.getItem('gemini_api_key');
    localStorage.removeItem('gemini_api_key');

    const result = await textToImageService.generateImage(request);

    if (savedKey) {
      localStorage.setItem('gemini_api_key', savedKey);
    }

    if (!result.error || !result.error.includes('No API key')) {
      throw new Error('Expected error for missing API key');
    }
  });

  await test('Should validate API key format', async () => {
    const isValid = await textToImageService.validateApiKey('invalid-key-123');
    if (isValid) {
      throw new Error('Invalid API key should not validate');
    }
  });

  await test('Should convert base64 to data URL correctly', async () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const dataUrl = textToImageService.convertToDataUrl(base64);

    if (!dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Data URL format is incorrect');
    }
  });

  await test('Should handle data URL that is already formatted', async () => {
    const existingDataUrl = 'data:image/png;base64,test123';
    const result = textToImageService.convertToDataUrl(existingDataUrl);

    if (result !== existingDataUrl) {
      throw new Error('Should not modify already formatted data URL');
    }
  });

  await test('Should reject more than 2 reference images', async () => {
    const request: TextToImageRequest = {
      prompt: 'A sunset',
      referenceImages: ['img1', 'img2', 'img3'],
      apiKey
    };

    const result = await textToImageService.generateImage(request);
    if (!result.error || !result.error.includes('Maximum 2 reference images')) {
      throw new Error('Should reject more than 2 reference images');
    }
  });

  if (apiKey) {
    console.log('\n📝 Running integration test with real API...');

    await test('Should generate image with valid prompt and API key', async () => {
      const request: TextToImageRequest = {
        prompt: 'A simple geometric shape on a white background',
        apiKey
      };

      const result = await textToImageService.generateImage(request);

      if (result.error) {
        throw new Error(`API returned error: ${result.error}`);
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images generated');
      }

      if (!result.timestamp || result.timestamp <= 0) {
        throw new Error('Invalid timestamp');
      }

      console.log(`   Generated ${result.images.length} image(s)`);
    });

    await test('Should validate correct API key', async () => {
      const isValid = await textToImageService.validateApiKey(apiKey);
      if (!isValid) {
        throw new Error('Valid API key should validate successfully');
      }
    });
  } else {
    console.log('\n⚠️  Skipping integration tests (no API key configured)');
  }

  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${testsPassed}`);
  console.log(`   Failed: ${testsFailed}`);
  console.log(`   Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    return false;
  } else {
    console.log('\n✅ All tests passed!');
    return true;
  }
}

if (typeof window !== 'undefined') {
  (window as any).runTextToImageTests = runTests;
  console.log('Text-to-Image tests loaded. Run with: window.runTextToImageTests()');
}

export { runTests };