import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const rootDir = process.cwd();
const sourceSvgPath = path.join(rootDir, 'build', 'icon-source.svg');
const iconOutputDir = path.join(rootDir, 'build', 'icons');
const publicFaviconPath = path.join(rootDir, 'public', 'favicon.svg');

const pngSizes = [16, 24, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  if (!fs.existsSync(sourceSvgPath)) {
    throw new Error(`Icon source not found: ${sourceSvgPath}`);
  }

  fs.mkdirSync(iconOutputDir, { recursive: true });

  const svgBuffer = fs.readFileSync(sourceSvgPath);
  const pngPaths = [];

  for (const size of pngSizes) {
    const outputPath = path.join(iconOutputDir, `app-icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    pngPaths.push(outputPath);
  }

  fs.copyFileSync(sourceSvgPath, publicFaviconPath);
  fs.copyFileSync(path.join(iconOutputDir, 'app-icon-512.png'), path.join(iconOutputDir, 'app-icon.png'));

  const icoBuffer = await pngToIco([
    path.join(iconOutputDir, 'app-icon-16.png'),
    path.join(iconOutputDir, 'app-icon-24.png'),
    path.join(iconOutputDir, 'app-icon-32.png'),
    path.join(iconOutputDir, 'app-icon-48.png'),
    path.join(iconOutputDir, 'app-icon-64.png'),
    path.join(iconOutputDir, 'app-icon-128.png'),
    path.join(iconOutputDir, 'app-icon-256.png'),
  ]);

  fs.writeFileSync(path.join(iconOutputDir, 'app-icon.ico'), icoBuffer);
}

generateIcons().catch((error) => {
  console.error('[Icon Build Error]', error);
  process.exitCode = 1;
});
