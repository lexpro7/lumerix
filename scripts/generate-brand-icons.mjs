// Rebuild only brand assets from the transparent vector master.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const asset = name => fileURLToPath(new URL(`../public/${name}`, import.meta.url));
const svg = await readFile(asset('icon.svg'));
for (const size of [32, 192, 512]) {
  await sharp(svg, { density: 192 }).resize(size, size).png().toFile(asset(`icon-${size}.png`));
}
// Separate opaque maskable icon; the symbol stays inside the 80% safe circle.
const symbol = await sharp(svg).resize(400, 400).png().toBuffer();
const maskable = await sharp({ create: { width: 512, height: 512, channels: 4, background: '#191322' } })
  .composite([{ input: symbol, left: 56, top: 56 }]).png().toBuffer();
await sharp(maskable).toFile(asset('icon-maskable-512.png'));
await sharp(maskable).resize(180, 180).toFile(asset('apple-touch-icon.png'));
