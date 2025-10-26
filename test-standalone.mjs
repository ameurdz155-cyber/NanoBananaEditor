import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

class TextToImageTester {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('API key is required. Set VITE_GEMINI_API_KEY in .env file');
    }
    this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateImage(prompt, referenceImages = []) {
    try {
      console.log(`\n🎨 Generating image with prompt: "${prompt}"`);

      const contents = [{ text: prompt }];

      if (referenceImages.length > 0) {
        console.log(`   Using ${referenceImages.length} reference image(s)`);
        referenceImages.forEach(base64 => {
          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: base64,
            },
          });
        });
      }

      const startTime = Date.now();
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
      });

      const elapsed = Date.now() - startTime;
      console.log(`   ⏱️ Generation took ${(elapsed / 1000).toFixed(2)} seconds`);

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates returned from API');
      }

      const images = [];
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(part.inlineData.data);
        }
      }

      if (images.length === 0) {
        throw new Error('No images in response');
      }

      console.log(`   ✅ Generated ${images.length} image(s)`);
      return images;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      throw error;
    }
  }

  async saveImage(base64Data, filename) {
    const outputDir = path.join(process.cwd(), 'test-output');
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filePath, buffer);

    console.log(`   💾 Saved to: ${filePath}`);
    return filePath;
  }
}

async function runTests() {
  console.log('🧪 Text-to-Image Service Test Runner');
  console.log('====================================\n');

  try {
    const tester = new TextToImageTester();

    // Test 1: Simple prompt
    console.log('📝 Test 1: Simple prompt');
    const images1 = await tester.generateImage(
      'A minimalist geometric pattern with triangles and circles in blue and orange colors'
    );
    await tester.saveImage(images1[0], 'test1-simple.png');

    // Test 2: Detailed prompt
    console.log('\n📝 Test 2: Detailed prompt');
    const images2 = await tester.generateImage(
      'A serene Japanese garden with a wooden bridge over a koi pond, cherry blossoms in bloom, ' +
      'soft morning light filtering through the trees, photorealistic style'
    );
    await tester.saveImage(images2[0], 'test2-detailed.png');

    // Test 3: Abstract concept
    console.log('\n📝 Test 3: Abstract concept');
    const images3 = await tester.generateImage(
      'The concept of time represented as a flowing river with clock elements, surreal art style'
    );
    await tester.saveImage(images3[0], 'test3-abstract.png');

    console.log('\n✅ All tests completed successfully!');
    console.log('📂 Check the test-output directory for generated images');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);