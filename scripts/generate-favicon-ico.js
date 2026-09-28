import fs from 'fs';
import path from 'path';

// Generate a valid 32x32 32-bit RGBA .ico file matching Almacenes Nor Oriente brand logo
function generateFaviconIco() {
  const width = 32;
  const height = 32;

  // 32x32 RGBA canvas (top-to-bottom)
  const pixels = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ r: 0, g: 0, b: 0, a: 0 }))
  );

  // Helper to draw a pixel with alpha blending
  function setPixel(x, y, r, g, b, a = 255) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      pixels[y][x] = { r, g, b, a };
    }
  }

  // Draw rounded rect background
  const radius = 6;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check rounded corners
      let inside = true;
      if (x < radius && y < radius) {
        inside = (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2;
      } else if (x >= width - radius && y < radius) {
        inside = (x - (width - radius - 1)) ** 2 + (y - radius) ** 2 <= radius ** 2;
      } else if (x < radius && y >= height - radius) {
        inside = (x - radius) ** 2 + (y - (height - radius - 1)) ** 2 <= radius ** 2;
      } else if (x >= width - radius && y >= height - radius) {
        inside = (x - (width - radius - 1)) ** 2 + (y - (height - radius - 1)) ** 2 <= radius ** 2;
      }

      if (inside) {
        // Subtle dark charcoal background #1C1917
        setPixel(x, y, 28, 25, 23, 255);
      }
    }
  }

  // Subtle amber border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y][x].a === 255) {
        const isBorder = (
          (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) ||
          ((x === 2 || x === width - 3) && (y <= 3 || y >= height - 4))
        );
        if (isBorder) {
          setPixel(x, y, 160, 110, 20, 180);
        }
      }
    }
  }

  // Draw Line helper
  function drawLine(x0, y0, x1, y1, r, g, b, thickness = 1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      for (let tx = -Math.floor(thickness / 2); tx <= Math.floor(thickness / 2); tx++) {
        for (let ty = -Math.floor(thickness / 2); ty <= Math.floor(thickness / 2); ty++) {
          setPixel(cx + tx, cy + ty, r, g, b, 255);
        }
      }
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  // 1. Draw House Outline (Amber/Yellow #CA8A04)
  // Peak at (16, 5)
  // Roof left (6, 13), roof right (25, 13)
  // Left wall down to (6, 26), right wall down to (25, 26)
  // Base line from (6, 26) to (25, 26)
  drawLine(6, 25, 6, 13, 202, 138, 4, 1);
  drawLine(6, 13, 16, 5, 202, 138, 4, 1);
  drawLine(16, 5, 25, 13, 202, 138, 4, 1);
  drawLine(25, 13, 25, 25, 202, 138, 4, 1);
  drawLine(6, 25, 25, 25, 202, 138, 4, 1);

  // 2. Draw Stylized "N" Letter (Nor Oriente - Bright Yellow #FDE047 / #EAB308)
  // Left pillar: (11, 24) up to (11, 11)
  drawLine(11, 24, 11, 11, 253, 224, 71, 2);
  // Diagonal beam: (11, 11) down to (20, 22)
  drawLine(11, 11, 20, 22, 234, 179, 8, 2);
  // Right pillar: (20, 22) up to (20, 9)
  drawLine(20, 22, 20, 9, 253, 224, 71, 2);

  // Build ICO binary structure
  const headerSize = 6;
  const dirEntrySize = 16;
  const bmiHeaderSize = 40;
  const pixelDataSize = width * height * 4; // 32 * 32 * 4 = 4096
  const andMaskRowSize = Math.ceil(width / 32) * 4; // 4 bytes per row
  const andMaskSize = andMaskRowSize * height; // 128 bytes
  const imageSize = bmiHeaderSize + pixelDataSize + andMaskSize;
  const totalFileSize = headerSize + dirEntrySize + imageSize;

  const buf = Buffer.alloc(totalFileSize);

  // 1. ICONDIR Header
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // 1 = ICO
  buf.writeUInt16LE(1, 4); // 1 image

  // 2. ICONDIRENTRY
  buf.writeUInt8(width, 6); // Width
  buf.writeUInt8(height, 7); // Height
  buf.writeUInt8(0, 8); // Color palette count
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(32, 12); // Bits per pixel (32-bit RGBA)
  buf.writeUInt32LE(imageSize, 14); // Size of image data
  buf.writeUInt32LE(headerSize + dirEntrySize, 18); // Offset to image data (22)

  // 3. BITMAPINFOHEADER (BMP Header inside ICO)
  let offset = headerSize + dirEntrySize;
  buf.writeUInt32LE(bmiHeaderSize, offset); // biSize = 40
  buf.writeInt32LE(width, offset + 4); // biWidth = 32
  buf.writeInt32LE(height * 2, offset + 8); // biHeight = 64 (XOR + AND mask)
  buf.writeUInt16LE(1, offset + 12); // biPlanes = 1
  buf.writeUInt16LE(32, offset + 14); // biBitCount = 32
  buf.writeUInt32LE(0, offset + 16); // biCompression = 0 (BI_RGB)
  buf.writeUInt32LE(pixelDataSize + andMaskSize, offset + 20); // biSizeImage
  buf.writeInt32LE(0, offset + 24); // biXPelsPerMeter
  buf.writeInt32LE(0, offset + 28); // biYPelsPerMeter
  buf.writeUInt32LE(0, offset + 32); // biClrUsed
  buf.writeUInt32LE(0, offset + 36); // biClrImportant
  offset += bmiHeaderSize;

  // 4. XOR Pixel Data (Bottom-to-Top in BMP / ICO format, BGRA order)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const p = pixels[y][x];
      buf.writeUInt8(p.b, offset++); // Blue
      buf.writeUInt8(p.g, offset++); // Green
      buf.writeUInt8(p.r, offset++); // Red
      buf.writeUInt8(p.a, offset++); // Alpha
    }
  }

  // 5. AND Mask (1 bit per pixel, 0 = opaque, 1 = transparent, Bottom-to-Top)
  for (let y = height - 1; y >= 0; y--) {
    let rowVal = 0;
    for (let x = 0; x < width; x++) {
      if (pixels[y][x].a === 0) {
        rowVal |= (1 << (7 - (x % 8)));
      }
      if (x % 8 === 7 || x === width - 1) {
        buf.writeUInt8(rowVal, offset++);
        rowVal = 0;
      }
    }
  }

  const outDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'favicon.ico');
  fs.writeFileSync(outPath, buf);
  console.log(`[favicon-generator] Successfully generated ${outPath} (${buf.length} bytes)!`);
}

generateFaviconIco();
