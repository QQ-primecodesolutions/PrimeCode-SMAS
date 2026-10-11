/** A slide image (screenshot or photo) as a data URI, with its pixel size. */
export type Media = { src: string; width: number; height: number };

/** Pixel size of a PNG or JPEG from its header, without decoding it. Null for anything else. */
export function imageSize(data: Uint8Array): { width: number; height: number; type: "png" | "jpeg" } | null {
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // PNG: signature, then the IHDR chunk with width and height.
  if (data.length >= 24 && v.getUint32(0) === 0x89504e47 && v.getUint32(4) === 0x0d0a1a0a) {
    return { width: v.getUint32(16), height: v.getUint32(20), type: "png" };
  }
  // JPEG: walk the markers to the first start-of-frame (SOF0–SOF15, except DHT/JPG/DAC).
  if (data.length >= 4 && v.getUint16(0) === 0xffd8) {
    let p = 2;
    while (p + 9 < data.length) {
      if (data[p] !== 0xff) return null;
      const marker = data[p + 1]!;
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        p += 2;
        continue;
      }
      const length = v.getUint16(p + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: v.getUint16(p + 7), height: v.getUint16(p + 5), type: "jpeg" };
      }
      p += 2 + length;
    }
  }
  return null;
}
