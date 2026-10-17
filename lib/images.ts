import sharp from "sharp";

const ALLOWED = new Set(["jpeg", "png", "webp"]);

export type ProcessedImage = {
  original: Buffer;
  originalType: string;
  ext: string;
  width: number;
  height: number;
  preview: Buffer; // 1200px long edge, watermarked
  thumb: Buffer; // 560px long edge, watermarked
};

function watermarkSvg(width: number, height: number) {
  const step = Math.max(180, Math.round(Math.min(width, height) / 3.2));
  const font = Math.max(14, Math.round(step / 9));
  let rows = "";
  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += step * 2.2) {
      rows += `<text x="${x}" y="${y}">STOCKROOM · PREVIEW</text>`;
    }
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g transform="rotate(-24 ${width / 2} ${height / 2})"
         font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${font}"
         letter-spacing="${font / 5}" fill="#ffffff" fill-opacity="0.34"
         stroke="#000000" stroke-opacity="0.18" stroke-width="1">${rows}</g>
    </svg>`,
  );
}

async function watermarked(input: Buffer, longEdge: number, quality: number) {
  const resized = await sharp(input)
    .rotate()
    .resize({ width: longEdge, height: longEdge, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = resized.info;
  return sharp(resized.data)
    .composite([{ input: watermarkSvg(width, height), top: 0, left: 0 }])
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(input).metadata();
  if (!meta.format || !ALLOWED.has(meta.format)) throw new Error("Upload a JPG, PNG or WebP image.");
  // EXIF orientation: report the displayed size
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  const height = (rotated ? meta.width : meta.height) ?? 0;
  if (width < 400 || height < 400) throw new Error("Image must be at least 400×400 pixels.");
  const ext = meta.format === "jpeg" ? "jpg" : meta.format;
  const [preview, thumb] = await Promise.all([watermarked(input, 1200, 72), watermarked(input, 560, 70)]);
  return {
    original: input,
    originalType: `image/${meta.format}`,
    ext,
    width,
    height,
    preview,
    thumb,
  };
}
