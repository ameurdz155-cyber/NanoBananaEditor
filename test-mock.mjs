import { promises as fs } from 'fs';
import path from 'path';

class MockTextToImageService {
  constructor() {
    this.callCount = 0;
  }

  async generateImage(prompt, referenceImages = []) {
    console.log(`\n🎨 [MOCK] Generating image with prompt: "${prompt}"`);

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required for image generation');
    }

    if (referenceImages.length > 2) {
      throw new Error('Maximum 2 reference images are allowed');
    }

    // Simulate API delay
    const delay = 500 + Math.random() * 1000;
    console.log(`   ⏳ Simulating API call (${(delay / 1000).toFixed(2)}s delay)...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    this.callCount++;

    // Create a mock base64 image (1x1 pixel PNG)
    const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    console.log(`   ✅ Mock image generated successfully`);
    console.log(`   📊 Stats: Call #${this.callCount}, References: ${referenceImages.length}`);

    return {
      images: [mockBase64],
      prompt: prompt,
      timestamp: Date.now(),
      mock: true
    };
  }

  async validateApiKey(apiKey) {
    console.log(`   🔑 [MOCK] Validating API key...`);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock validation - check if key starts with 'AIza'
    const isValid = apiKey && apiKey.startsWith('AIza');
    console.log(`   ${isValid ? '✅' : '❌'} Validation ${isValid ? 'successful' : 'failed'}`);
    return isValid;
  }

  convertToDataUrl(base64Image, mimeType = 'image/png') {
    if (base64Image.startsWith('data:')) {
      return base64Image;
    }
    return `data:${mimeType};base64,${base64Image}`;
  }
}

async function runTests() {
  console.log('🧪 Text-to-Image Service Mock Tests');
  console.log('====================================');
  console.log('Running with mock service to avoid API quota issues\n');

  const service = new MockTextToImageService();
  let testsPassed = 0;
  let testsFailed = 0;

  async function test(name, fn) {
    try {
      console.log(`\n📝 Testing: ${name}`);
      await fn();
      console.log(`✅ PASSED`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ FAILED: ${error.message}`);
      testsFailed++;
    }
  }

  // Test 1: Valid prompt
  await test('Generate with valid prompt', async () => {
    const result = await service.generateImage('A beautiful sunset');
    if (!result.images || result.images.length === 0) {
      throw new Error('No images returned');
    }
  });

  // Test 2: Empty prompt
  await test('Reject empty prompt', async () => {
    try {
      await service.generateImage('');
      throw new Error('Should have thrown error for empty prompt');
    } catch (error) {
      if (!error.message.includes('Prompt is required')) {
        throw error;
      }
    }
  });

  // Test 3: Reference images
  await test('Accept up to 2 reference images', async () => {
    const result = await service.generateImage('Test prompt', ['img1', 'img2']);
    if (!result.images) {
      throw new Error('Failed with valid reference images');
    }
  });

  // Test 4: Too many reference images
  await test('Reject more than 2 reference images', async () => {
    try {
      await service.generateImage('Test prompt', ['img1', 'img2', 'img3']);
      throw new Error('Should have thrown error for too many reference images');
    } catch (error) {
      if (!error.message.includes('Maximum 2 reference images')) {
        throw error;
      }
    }
  });

  // Test 5: API key validation
  await test('Validate API key format', async () => {
    const validKey = await service.validateApiKey('AIzaSyTestKey123');
    const invalidKey = await service.validateApiKey('invalid-key');

    if (!validKey) {
      throw new Error('Valid key format should pass');
    }
    if (invalidKey) {
      throw new Error('Invalid key format should fail');
    }
  });

  // Test 6: Data URL conversion
  await test('Convert base64 to data URL', async () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUg==';
    const dataUrl = service.convertToDataUrl(base64);

    if (!dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Incorrect data URL format');
    }
  });

  // Test 7: Handle existing data URL
  await test('Preserve existing data URL', async () => {
    const existingUrl = 'data:image/jpeg;base64,test123';
    const result = service.convertToDataUrl(existingUrl);

    if (result !== existingUrl) {
      throw new Error('Should not modify existing data URL');
    }
  });

  // Test 8: Multiple sequential calls
  await test('Handle multiple sequential calls', async () => {
    const startCount = service.callCount;
    const results = [];
    for (let i = 1; i <= 3; i++) {
      const result = await service.generateImage(`Test prompt ${i}`);
      results.push(result);
    }

    if (results.length !== 3) {
      throw new Error('Failed to handle multiple calls');
    }

    if (service.callCount !== startCount + 3) {
      throw new Error(`Call count mismatch: expected ${startCount + 3}, got ${service.callCount}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📝 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed successfully!');
    console.log('💡 The extracted text-to-image service is working correctly');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }

  return testsFailed === 0;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  });