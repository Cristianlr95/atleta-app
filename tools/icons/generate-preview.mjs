import { createRequire } from 'node:module';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const projectRoot = path.resolve(import.meta.dirname, '..', '..');
const iconDir = path.join(projectRoot, 'src', 'assets', 'icons', 'atleta');
const outputPath = path.join(iconDir, 'preview-icons.png');
const files = (await readdir(iconDir)).filter((file) => file.endsWith('.svg')).sort();

const columns = 6;
const tileWidth = 300;
const tileHeight = 142;
const padding = 24;
const headerHeight = 92;
const rows = Math.ceil(files.length / columns);
const width = columns * tileWidth + padding * 2;
const height = headerHeight + rows * tileHeight + padding;
const composites = [];

for (const [index, file] of files.entries()) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = padding + column * tileWidth;
  const top = headerHeight + row * tileHeight;
  const source = (await readFile(path.join(iconDir, file), 'utf8'))
    .replaceAll('currentColor', '#c6e7ff');
  const icon = await sharp(Buffer.from(source)).resize(44, 44).png().toBuffer();
  composites.push({ input: icon, left: left + 128, top: top + 20 });
}

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const labels = files.map((file, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = padding + column * tileWidth;
  const y = headerHeight + row * tileHeight;
  return `
    <rect x="${x + 8}" y="${y + 8}" width="${tileWidth - 16}" height="${tileHeight - 16}" rx="14" fill="#0d1b2b" stroke="#315f7d" stroke-width="1.5"/>
    <text x="${x + tileWidth / 2}" y="${y + 94}" fill="#c6e7ff" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">${escapeXml(file.replace('_24.svg', ''))}</text>
    <text x="${x + tileWidth / 2}" y="${y + 116}" fill="#6e9fbd" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">16 · 20 · 24 px</text>`;
}).join('');

const canvas = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#071321"/>
    <text x="${padding + 8}" y="42" fill="#e3f2ff" font-family="Arial, sans-serif" font-size="26" font-weight="700">ATLETA · Acero en Movimiento</text>
    <text x="${padding + 8}" y="68" fill="#77bde8" font-family="Arial, sans-serif" font-size="15">${files.length} SVG · retícula 24 × 24 · currentColor · edición 2026-07-21</text>
    ${labels}
  </svg>`);

await sharp(canvas).composite(composites).png().toFile(outputPath);
console.log(`Preview generado: ${outputPath} (${files.length} iconos)`);
