const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, getPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset);
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData.writeUInt8(r, pxOffset);
      rawData.writeUInt8(g, pxOffset + 1);
      rawData.writeUInt8(b, pxOffset + 2);
      rawData.writeUInt8(a, pxOffset + 3);
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Render DisasterChain Shield Icon
function renderIconPixel(x, y, size, shape = 'square') {
  const nx = (x / size) * 2 - 1;
  const ny = (y / size) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  if (shape === 'round' && dist > 0.98) {
    return [0, 0, 0, 0];
  }

  if (shape === 'foreground') {
    // Only render shield and beacon on transparent background
    const scale = 0.54;
    const sx = nx / scale;
    const sy = ny / scale;
    return renderShieldBeacon(sx, sy, true);
  }

  // Background: Deep Charcoal #120B08 with warm radial glow
  const bgWarmth = Math.max(0, 1 - dist * 1.05);
  let r = Math.min(255, Math.floor(18 + bgWarmth * 24));
  let g = Math.min(255, Math.floor(11 + bgWarmth * 14));
  let b = Math.min(255, Math.floor(8 + bgWarmth * 10));
  let a = 255;

  if (shape === 'square') {
    const cornerRadius = 0.82;
    if (Math.abs(nx) > cornerRadius && Math.abs(ny) > cornerRadius) {
      const cdx = Math.abs(nx) - cornerRadius;
      const cdy = Math.abs(ny) - cornerRadius;
      if (Math.sqrt(cdx * cdx + cdy * cdy) > (1 - cornerRadius)) {
        return [0, 0, 0, 0];
      }
    }
  }

  const scale = 0.72;
  const sx = nx / scale;
  const sy = ny / scale;
  const fg = renderShieldBeacon(sx, sy, false, [r, g, b, a]);
  return fg;
}

function renderShieldBeacon(sx, sy, transparentBg, bgCol = [18, 11, 8, 255]) {
  const sDist = Math.sqrt(sx * sx + sy * sy);

  // Tactical beacon rings
  let r = bgCol[0];
  let g = bgCol[1];
  let b = bgCol[2];
  let a = transparentBg ? 0 : 255;

  const ring1 = Math.abs(sDist - 0.78);
  if (ring1 < 0.03) {
    const alpha = Math.max(0, 1 - ring1 / 0.03) * 0.45;
    r = Math.floor(r * (1 - alpha) + 255 * alpha);
    g = Math.floor(g * (1 - alpha) + 107 * alpha);
    b = Math.floor(b * (1 - alpha) + 44 * alpha);
    a = Math.max(a, Math.floor(255 * alpha));
  }

  const isInsideShield = (px, py) => {
    if (py < -0.54 || py > 0.65) return false;
    const topW = 0.52;
    if (py <= 0.0) {
      return Math.abs(px) <= topW;
    } else {
      const t = py / 0.65;
      const w = topW * (1 - t * t * 0.95);
      return Math.abs(px) <= Math.max(0, w);
    }
  };

  const shieldOuter = isInsideShield(sx, sy);
  const shieldInner = isInsideShield(sx / 0.88, (sy + 0.02) / 0.88);

  if (shieldOuter && !shieldInner) {
    // Shield border: Molten Orange #FF6B2C -> #FF8A3D
    const edgeGrad = (sy + 0.5) / 1.1;
    const er = 255;
    const eg = Math.floor(107 * (1 - edgeGrad) + 138 * edgeGrad);
    const eb = 44;
    return [er, eg, eb, 255];
  }

  if (shieldInner) {
    const shieldDark = (sy + 0.5) * 0.5;
    r = Math.floor(38 - shieldDark * 14);
    g = Math.floor(23 - shieldDark * 9);
    b = Math.floor(17 - shieldDark * 7);
    a = 255;
  }

  // Core Beacon Glow
  const beaconDist = Math.sqrt(sx * sx + (sy + 0.04) * (sy + 0.04));
  if (beaconDist < 0.28) {
    const beaconGlow = 1 - beaconDist / 0.28;
    r = Math.min(255, Math.floor(r + 255 * beaconGlow * 0.95));
    g = Math.min(255, Math.floor(g + 138 * beaconGlow * 0.85));
    b = Math.min(255, Math.floor(b + 45 * beaconGlow * 0.7));
    a = 255;
  }

  const bx = Math.abs(sx);
  const by = Math.abs(sy + 0.04);
  if (bx + by < 0.14) {
    return [255, 255, 255, 255];
  }
  if (bx + by < 0.22) {
    return [255, 175, 50, 255];
  }

  return [r, g, b, a];
}

// Render Splash Screen
function renderSplashPixel(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = (x - cx) / (width / 2);
  const dy = (y - cy) / (height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep Charcoal #120B08
  const bgWarmth = Math.max(0, 1 - dist * 1.2);
  let r = Math.min(255, Math.floor(18 + bgWarmth * 26));
  let g = Math.min(255, Math.floor(11 + bgWarmth * 15));
  let b = Math.min(255, Math.floor(8 + bgWarmth * 10));

  // Shield in center
  const minDim = Math.min(width, height);
  const scale = minDim * 0.35;
  const sx = (x - cx) / scale;
  const sy = (y - cy) / scale;

  return renderShieldBeacon(sx, sy, false, [r, g, b, 255]);
}

const resDir = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('Generating DisasterChain Android Brand Assets at:', resDir);

// 1. Mipmap Icons
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

for (const m of mipmaps) {
  const targetDir = path.join(resDir, m.dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const sq = encodePNG(m.size, m.size, (x, y, s) => renderIconPixel(x, y, s, 'square'));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), sq);

  const rd = encodePNG(m.size, m.size, (x, y, s) => renderIconPixel(x, y, s, 'round'));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), rd);

  const fg = encodePNG(m.size, m.size, (x, y, s) => renderIconPixel(x, y, s, 'foreground'));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fg);

  console.log(`Rendered icons for ${m.dir} (${m.size}x${m.size})`);
}

// 2. Splash Screens
const splashes = [
  { dir: 'drawable', w: 480, h: 800 },
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

for (const s of splashes) {
  const targetDir = path.join(resDir, s.dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const splashPng = encodePNG(s.w, s.h, (x, y, w, h) => renderSplashPixel(x, y, w, h));
  fs.writeFileSync(path.join(targetDir, 'splash.png'), splashPng);
  console.log(`Rendered splash for ${s.dir} (${s.w}x${s.h})`);
}

// 3. Update background XML
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#120B08"
        android:pathData="M0,0h108v108h-108z" />
</vector>`;

fs.writeFileSync(path.join(resDir, 'drawable', 'ic_launcher_background.xml'), bgXml, 'utf8');

const valuesBgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#120B08</color>
</resources>`;

fs.writeFileSync(path.join(resDir, 'values', 'ic_launcher_background.xml'), valuesBgXml, 'utf8');

console.log('DisasterChain Android brand assets generated successfully!');
