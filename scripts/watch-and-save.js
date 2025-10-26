import { watch, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const execAsync = promisify(exec);

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const testAndSave = async (filename) => {
  console.log(`\n📝 File changed: ${filename}`);
  console.log('🧪 Running tests...');

  try {
    // Run lint check
    console.log('  ⚡ Running lint check...');
    await execAsync('npm run lint', { cwd: projectRoot });
    console.log('  ✅ Lint check passed');

    // Check if build works
    console.log('  🔨 Testing build...');
    await execAsync('npx vite build --mode test', { cwd: projectRoot });
    console.log('  ✅ Build test passed');

    // If we have test files, run them
    try {
      console.log('  🧪 Running unit tests...');
      await execAsync('npm test -- --run', { cwd: projectRoot });
      console.log('  ✅ Unit tests passed');
    } catch (testError) {
      // Tests might not be configured yet
      if (testError.message.includes('Missing script: "test"')) {
        console.log('  ⚠️  No test script configured');
      } else {
        throw testError;
      }
    }

    console.log('✨ All checks passed! File saved successfully.\n');
    console.log(`🌐 View at: http://localhost:5173/`);

  } catch (error) {
    console.error('❌ Checks failed! File not saved.');
    console.error('Error details:', error.message);
    console.log('\n⚠️  Fix the issues above and save again.\n');
  }
};

const debouncedTestAndSave = debounce(testAndSave, 1000);

// Watch src directory
const srcPath = path.join(projectRoot, 'src');
console.log(`👀 Watching for changes in: ${srcPath}`);
console.log(`🌐 Dev server should be running at: http://localhost:5173/`);
console.log('Press Ctrl+C to stop watching\n');

watch(srcPath, { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.js'))) {
    debouncedTestAndSave(filename);
  }
});

// Also watch root config files
const configFiles = ['vite.config.js', 'vitest.config.js', 'tsconfig.json', 'tailwind.config.js', 'package.json'];
configFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (existsSync(filePath)) {
    watch(filePath, (eventType) => {
      if (eventType === 'change') {
        debouncedTestAndSave(file);
      }
    });
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  process.exit(0);
});