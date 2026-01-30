import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const bg = { r: 37, g: 99, b: 235, alpha: 1 }; /* blue-600 */

for (const size of [192, 512]) {
  const path = join(publicDir, `icon-${size}.png`);
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .png()
    .toFile(path);
  console.log(`Created ${path}`);
}
