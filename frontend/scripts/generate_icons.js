const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
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

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // Filter type 0 (None)
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

// Generates the Warm Crisis Command brand icon
function renderDisasterChainPixel(x, y, size, isMaskable = false) {
  const nx = (x / size) * 2 - 1;
  const ny = (y / size) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Default Background: Deep Charcoal #120B08
  let r = 18, g = 11, b = 8, a = 255;

  if (!isMaskable) {
    const cornerRadius = 0.88;
    if (Math.abs(nx) > cornerRadius && Math.abs(ny) > cornerRadius) {
      const cdx = Math.abs(nx) - cornerRadius;
      const cdy = Math.abs(ny) - cornerRadius;
      if (Math.sqrt(cdx * cdx + cdy * cdy) > (1 - cornerRadius)) {
        return [0, 0, 0, 0];
      }
    }
  }

  const bgWarmth = Math.max(0, 1 - dist * 1.1);
  r = Math.min(255, Math.floor(18 + bgWarmth * 22));
  g = Math.min(255, Math.floor(11 + bgWarmth * 12));
  b = Math.min(255, Math.floor(8 + bgWarmth * 10));

  if (!isMaskable && dist >= 0.94 && dist <= 0.98) {
    return [255, 107, 44, 180];
  }

  const scale = isMaskable ? 0.72 : 0.86;
  const sx = nx / scale;
  const sy = ny / scale;
  const sDist = Math.sqrt(sx * sx + sy * sy);

  const ring1 = Math.abs(sDist - 0.72);
  const ring2 = Math.abs(sDist - 0.52);
  if (ring1 < 0.022) {
    const alpha = Math.max(0, 1 - ring1 / 0.022) * 0.45;
    r = Math.floor(r * (1 - alpha) + 255 * alpha);
    g = Math.floor(g * (1 - alpha) + 107 * alpha);
    b = Math.floor(b * (1 - alpha) + 44 * alpha);
  }
  if (ring2 < 0.02) {
    const alpha = Math.max(0, 1 - ring2 / 0.02) * 0.55;
    r = Math.floor(r * (1 - alpha) + 245 * alpha);
    g = Math.floor(g * (1 - alpha) + 158 * alpha);
    b = Math.floor(b * (1 - alpha) + 11 * alpha);
  }

  const isInsideShield = (px, py) => {
    if (py < -0.52 || py > 0.62) return false;
    const topW = 0.52;
    if (py <= 0.0) {
      return Math.abs(px) <= topW;
    } else {
      const t = py / 0.62;
      const w = topW * (1 - t * t * 0.95);
      return Math.abs(px) <= Math.max(0, w);
    }
  };

  const shieldFilled = isInsideShield(sx, sy);
  const shieldInner = isInsideShield(sx / 0.90, (sy + 0.02) / 0.90);

  if (shieldFilled && !shieldInner) {
    const edgeGrad = (sy + 0.5) / 1.1;
    const er = 255;
    const eg = Math.floor(107 * (1 - edgeGrad) + 158 * edgeGrad);
    const eb = 44;
    return [er, eg, eb, 255];
  }

  if (shieldInner) {
    const shieldDark = (sy + 0.5) * 0.5;
    r = Math.floor(36 - shieldDark * 12);
    g = Math.floor(22 - shieldDark * 8);
    b = Math.floor(16 - shieldDark * 6);
  }

  const beaconDist = Math.sqrt(sx * sx + (sy + 0.04) * (sy + 0.04));
  if (beaconDist < 0.26) {
    const beaconGlow = 1 - beaconDist / 0.26;
    r = Math.min(255, Math.floor(r + 255 * beaconGlow * 0.9));
    g = Math.min(255, Math.floor(g + 140 * beaconGlow * 0.8));
    b = Math.min(255, Math.floor(b + 40 * beaconGlow * 0.6));
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

function generateSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#26150F"/>
      <stop offset="65%" stop-color="#180E0A"/>
      <stop offset="100%" stop-color="#120B08"/>
    </radialGradient>
    <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8A3D"/>
      <stop offset="50%" stop-color="#FF6B2C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2D1912"/>
      <stop offset="100%" stop-color="#1C110D"/>
    </linearGradient>
    <radialGradient id="coreBeacon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="35%" stop-color="#FFD166"/>
      <stop offset="70%" stop-color="#FF6B2C"/>
      <stop offset="100%" stop-color="#FF6B2C" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="104" fill="none" stroke="#FF6B2C" stroke-width="2.5" stroke-opacity="0.4" />

  <circle cx="256" cy="245" r="170" fill="none" stroke="#FF6B2C" stroke-width="1.5" stroke-opacity="0.22" stroke-dasharray="8 6"/>
  <circle cx="256" cy="245" r="128" fill="none" stroke="#F59E0B" stroke-width="1.8" stroke-opacity="0.32"/>
  <circle cx="256" cy="245" r="85" fill="none" stroke="#FF8A3D" stroke-width="2" stroke-opacity="0.45"/>

  <path d="M 256 100 
           C 310 100 375 115 375 115
           L 375 240
           C 375 320 305 385 256 415
           C 207 385 137 320 137 240
           L 137 115
           C 137 115 202 100 256 100 Z"
        fill="url(#shieldFill)"
        stroke="url(#shieldBorder)"
        stroke-width="10"
        stroke-linejoin="round"
        filter="url(#glow)"/>

  <path d="M 256 118 
           C 300 118 355 130 355 130
           L 355 235
           C 355 305 295 365 256 392
           C 217 365 157 305 157 235
           L 157 130
           C 157 130 212 118 256 118 Z"
        fill="none"
        stroke="#FF6B2C"
        stroke-width="2"
        stroke-opacity="0.35"/>

  <circle cx="256" cy="245" r="64" fill="url(#coreBeacon)" opacity="0.85"/>
  <path d="M 256 195 L 270 235 L 306 245 L 270 255 L 256 295 L 242 255 L 206 245 L 242 235 Z" 
        fill="#FFFFFF" 
        filter="url(#glow)"/>
  <circle cx="256" cy="245" r="7" fill="#FFFFFF"/>
</svg>`;
}

const publicDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating DisasterChain PWA assets...');

const svgContent = generateSVG();
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Created icon.svg');

const png192 = encodePNG(192, 192, (x, y, w, h) => renderDisasterChainPixel(x, y, w, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
console.log('Created icon-192.png (192x192)');

const png512 = encodePNG(512, 512, (x, y, w, h) => renderDisasterChainPixel(x, y, w, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
console.log('Created icon-512.png (512x512)');

const maskable192 = encodePNG(192, 192, (x, y, w, h) => renderDisasterChainPixel(x, y, w, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), maskable192);
console.log('Created icon-maskable-192.png');

const maskable512 = encodePNG(512, 512, (x, y, w, h) => renderDisasterChainPixel(x, y, w, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), maskable512);
console.log('Created icon-maskable-512.png');

fs.writeFileSync(path.join(publicDir, 'favicon.png'), png192);
console.log('Created favicon.png');

console.log('All DisasterChain PWA icons successfully generated!');
