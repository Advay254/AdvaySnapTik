// scripts/generate-icons.js
// Generates all required PWA icon sizes from a single source image.
// Usage:
//   npm install canvas
//   node scripts/generate-icons.js
//   npm uninstall canvas   (optional cleanup)
//
// Place your source icon at: public/icons/source.png (min 512×512 px)

import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
const SOURCE    = join(ICONS_DIR, 'source.png');

if (!existsSync(SOURCE)) {
  console.error('❌  Missing source file: public/icons/source.png');
  console.error('    Add a square PNG (min 512×512px) as source.png first.');
  process.exit(1);
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const img = await loadImage(SOURCE);

for (const size of SIZES) {
  const canvas  = createCanvas(size, size);
  const ctx     = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  writeFileSync(join(ICONS_DIR, `icon-${size}.png`), canvas.toBuffer('image/png'));
  console.log(`✅  icon-${size}.png`);
}

// Maskable icons (add ~10% padding for safe zone)
for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');
  const pad    = Math.round(size * 0.1);
  // Background fill (use your brand bg color)
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
  writeFileSync(join(ICONS_DIR, `icon-maskable-${size}.png`), canvas.toBuffer('image/png'));
  console.log(`✅  icon-maskable-${size}.png`);
}

console.log('\n🎉  All icons generated in public/icons/');
