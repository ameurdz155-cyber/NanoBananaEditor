import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG icon for AI Image Studio Pro (art palette design)
const svgIcon = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="200" fill="url(#gradient)"/>
  
  <!-- Art Palette Shape -->
  <g transform="translate(512, 512)">
    <!-- Palette Base -->
    <ellipse cx="0" cy="0" rx="380" ry="320" fill="#2D3748" stroke="#4A5568" stroke-width="12"/>
    
    <!-- Thumb Hole -->
    <ellipse cx="-180" cy="-80" rx="80" ry="100" fill="url(#gradient)"/>
    
    <!-- Paint Spots -->
    <!-- Red -->
    <circle cx="-180" cy="120" r="60" fill="#F56565" opacity="0.9"/>
    <!-- Yellow -->
    <circle cx="-60" cy="140" r="55" fill="#F6E05E" opacity="0.9"/>
    <!-- Green -->
    <circle cx="60" cy="120" r="58" fill="#48BB78" opacity="0.9"/>
    <!-- Blue -->
    <circle cx="180" cy="100" r="62" fill="#4299E1" opacity="0.9"/>
    <!-- Purple -->
    <circle cx="-120" cy="0" r="50" fill="#9F7AEA" opacity="0.9"/>
    <!-- Orange -->
    <circle cx="0" cy="20" r="52" fill="#ED8936" opacity="0.9"/>
    <!-- Pink -->
    <circle cx="120" cy="-20" r="48" fill="#ED64A6" opacity="0.9"/>
    
    <!-- AI Sparkles -->
    <g fill="#FFD700">
      <path d="M -250,-200 l10,20 l20,10 l-20,10 l-10,20 l-10,-20 l-20,-10 l20,-10 z" opacity="0.8"/>
      <path d="M 250,-180 l8,16 l16,8 l-16,8 l-8,16 l-8,-16 l-16,-8 l16,-8 z" opacity="0.7"/>
      <path d="M 200,200 l6,12 l12,6 l-12,6 l-6,12 l-6,-12 l-12,-6 l12,-6 z" opacity="0.6"/>
      <path d="M -200,200 l7,14 l14,7 l-14,7 l-7,14 l-7,-14 l-14,-7 l14,-7 z" opacity="0.7"/>
    </g>
    
    <!-- Brush -->
    <g transform="rotate(45) translate(250, 0)">
      <rect x="-15" y="-200" width="30" height="320" rx="15" fill="#8B4513"/>
      <rect x="-15" y="-200" width="30" height="60" fill="#C0C0C0"/>
      <rect x="-20" y="-260" width="40" height="80" rx="5" fill="#4A5568"/>
      <rect x="-12" y="-250" width="24" height="60" fill="#FFD700" opacity="0.8"/>
    </g>
  </g>
  
  <!-- Gradient Definition -->
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667EEA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764BA2;stop-opacity:1" />
    </linearGradient>
  </defs>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generating icons for AI Image Studio Pro...\n');

  // Ensure directories exist
  const iconDir = path.join(__dirname, '..', 'src-tauri', 'icons');
  await fs.mkdir(iconDir, { recursive: true });

  // First, create the base 1024x1024 PNG from SVG
  const basePngPath = path.join(iconDir, 'icon.png');
  console.log('Creating base 1024x1024 PNG...');
  
  await sharp(Buffer.from(svgIcon))
    .resize(1024, 1024)
    .png()
    .toFile(basePngPath);

  // Generate different sizes for Tauri
  const sizes = [
    { size: 32, name: '32x32.png' },
    { size: 128, name: '128x128.png' },
    { size: 256, name: '128x128@2x.png' },
    { size: 512, name: 'icon.png' }
  ];

  for (const { size, name } of sizes) {
    const outputPath = path.join(iconDir, name);
    console.log(`Generating ${name} (${size}x${size})...`);
    
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
  }

  // Generate Windows ICO file
  console.log('Generating Windows ICO file...');
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  
  for (const size of icoSizes) {
    const buffer = await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toBuffer();
    icoBuffers.push(buffer);
  }

  // For now, we'll use the 256x256 PNG as icon.ico placeholder
  // (Proper ICO generation would require additional libraries)
  await sharp(Buffer.from(svgIcon))
    .resize(256, 256)
    .png()
    .toFile(path.join(iconDir, 'icon.ico'));

  // Generate macOS ICNS placeholder
  console.log('Generating macOS ICNS file placeholder...');
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconDir, 'icon.icns'));

  console.log('\n✅ All icons generated successfully!');
  console.log('📁 Icons saved to:', iconDir);
  console.log('\n💡 Note: For production, you may want to use proper ICO/ICNS converters');
  console.log('   - Windows: Use a tool like png2ico');
  console.log('   - macOS: Use iconutil or a similar tool');
}

// Run the script
generateIcons().catch(console.error);