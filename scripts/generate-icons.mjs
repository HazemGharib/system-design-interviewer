import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

async function generateIcons() {
  console.log('Generating icons...');

  // Regular icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // Maskable icon (with padding for safe zone - 80% of the icon should be visible)
  // The safe zone is a circle inscribed in the center, so we need 10% padding on each side
  const maskableSize = 512;
  const padding = Math.round(maskableSize * 0.1);
  const innerSize = maskableSize - (padding * 2);
  
  const maskableIcon = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();
  
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 26, g: 122, b: 109, alpha: 1 } // #1A7A6D
    }
  })
    .composite([{
      input: maskableIcon,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(join(publicDir, 'icon-512-maskable.png'));
  console.log('Generated icon-512-maskable.png');

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Favicon (32x32 and 16x16)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
