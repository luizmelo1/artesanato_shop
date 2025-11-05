// Tool: Convert the Instagram PNG icon to WebP using Sharp
// Usage: node build-tools/tools/convert-instagram.js (from project root)

const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const sharp = require('sharp');
    const root = path.resolve(__dirname, '..', '..');
    const srcPng = path.join(root, 'src', 'img', 'icons', 'instagram.png');
    const outWebp = path.join(root, 'src', 'img', 'icons', 'instagram.webp');

    if (!fs.existsSync(srcPng)) {
      console.error(`[convert-instagram] PNG not found: ${srcPng}`);
      process.exit(1);
    }

    // Convert to WebP with balanced quality for small icons
    await sharp(srcPng)
      .webp({ quality: 90, lossless: false })
      .toFile(outWebp);

    const stats = fs.statSync(outWebp);
    console.log(`[convert-instagram] Done → ${path.relative(root, outWebp)} (${Math.round(stats.size / 1024)} KB)`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('[convert-instagram] Missing dependency: sharp. Run `npm i sharp` and try again.');
      process.exit(1);
    }
    console.error('[convert-instagram] Failed:', err.message);
    process.exit(1);
  }
})();
