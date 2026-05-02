import sharp from 'sharp';
import fs from 'node:fs';

const SRC = '.icons-draft/icon-bowl.png';

await sharp(SRC).resize(192, 192).png({ compressionLevel: 9 }).toFile('public/icon-192.png');
await sharp(SRC).resize(512, 512).png({ compressionLevel: 9 }).toFile('public/icon-512.png');
await sharp(SRC).resize(180, 180).png({ compressionLevel: 9 }).toFile('public/apple-touch-icon.png');

const meta = await sharp(SRC).metadata();
const dim = Math.min(meta.width, meta.height);
const pad = Math.round(dim * 0.12);
await sharp(SRC)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 250, g: 250, b: 247, alpha: 1 } })
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile('public/icon-512-maskable.png');

['icon-192', 'icon-512', 'icon-512-maskable', 'apple-touch-icon'].forEach((n) => {
  const stat = fs.statSync(`public/${n}.png`);
  console.log(`  public/${n}.png — ${stat.size} bytes`);
});
