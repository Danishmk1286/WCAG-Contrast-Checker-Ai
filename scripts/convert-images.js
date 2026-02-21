import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Images to convert
const imagesToConvert = [
  { src: 'public/assets/link-preview.jpg', name: 'link-preview' },
  { src: 'src/assets/link-preview.jpg', name: 'link-preview' },
  { src: 'src/assets/logo.png', name: 'logo' },
];

async function convertImage(inputPath, outputDir, baseName) {
  const fullInputPath = path.join(projectRoot, inputPath);
  
  if (!fs.existsSync(fullInputPath)) {
    console.log(`⚠️  Skipping ${inputPath} - file not found`);
    return;
  }

  const inputDir = path.dirname(fullInputPath);
  const webpPath = path.join(inputDir, `${baseName}.webp`);
  const avifPath = path.join(inputDir, `${baseName}.avif`);

  try {
    console.log(`\n🖼️  Converting ${inputPath}...`);
    
    // Convert to WebP
    await sharp(fullInputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(webpPath);
    
    const webpStats = fs.statSync(webpPath);
    const originalStats = fs.statSync(fullInputPath);
    const webpSavings = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
    console.log(`   ✅ WebP created: ${path.relative(projectRoot, webpPath)} (${webpSavings}% smaller)`);

    // Convert to AVIF
    await sharp(fullInputPath)
      .avif({ quality: 80, effort: 4 })
      .toFile(avifPath);
    
    const avifStats = fs.statSync(avifPath);
    const avifSavings = ((1 - avifStats.size / originalStats.size) * 100).toFixed(1);
    console.log(`   ✅ AVIF created: ${path.relative(projectRoot, avifPath)} (${avifSavings}% smaller)`);

  } catch (error) {
    console.error(`   ❌ Error converting ${inputPath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image conversion to WebP and AVIF...\n');
  
  for (const image of imagesToConvert) {
    await convertImage(image.src, path.dirname(image.src), image.name);
  }
  
  console.log('\n✨ Image conversion complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Update image references to use OptimizedImage component');
  console.log('   2. Test images load correctly in browser');
  console.log('   3. Verify file sizes in build output');
}

main().catch(console.error);





