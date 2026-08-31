// One-off generator for media/icon.png (256x256, no dependencies).
// Draws a simple "folder with an arrow" mark on a solid rounded tile.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 256;

// Pixel helpers — colors as [r, g, b, a]
const TRANSPARENT = [0, 0, 0, 0];
const TILE = [0, 120, 212, 255]; // VS Code blue
const FOLDER = [255, 255, 255, 255];
const ARROW = [255, 214, 0, 255]; // amber

function inTile(x, y, r = 48) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return false;
  const rx = x < r ? r - x : x >= SIZE - r ? x - (SIZE - r - 1) : 0;
  const ry = y < r ? r - y : y >= SIZE - r ? y - (SIZE - r - 1) : 0;
  return rx * rx + ry * ry <= r * r;
}

// Folder body: tab + rectangle, centered
function inFolder(x, y) {
  const x0 = 44, x1 = 212, yTop = 96, yBot = 190, tabH = 22, tabW = 62;
  if (x < x0 || x > x1 || y < yTop || y > yBot) return false;
  if (y < yTop + tabH && x > x0 + tabW) return false; // tab only on the left
  return true;
}

// Arrow: shaft + head pointing right, centered in the folder
function inArrow(x, y) {
  const cy = 143;
  const shaftH = 12, shaftX0 = 68, shaftX1 = 140;
  if (y >= cy - shaftH / 2 && y <= cy + shaftH / 2 && x >= shaftX0 && x <= shaftX1) return true;
  const headH = 40, headX0 = 140, headX1 = 182;
  if (x >= headX0 && x <= headX1) {
    const t = (x - headX0) / (headX1 - headX0);
    return Math.abs(y - cy) <= (headH / 2) * t;
  }
  return false;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
let off = 0;
for (let y = 0; y < SIZE; y++) {
  raw[off++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    let px = TRANSPARENT;
    if (inTile(x, y)) px = inFolder(x, y) ? (inArrow(x, y) ? ARROW : FOLDER) : TILE;
    raw[off++] = px[0]; raw[off++] = px[1]; raw[off++] = px[2]; raw[off++] = px[3];
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(new URL('./media/icon.png', import.meta.url), png);
console.log('icon.png written,', png.length, 'bytes');
