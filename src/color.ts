import sharp from "sharp";

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Extracts the average color from the edges of an image.
 * This is smarter than "dominant color" - it samples the actual borders
 * so we can naturally extend the image's edge appearance.
 */
export async function extractEdgeColor(imagePath: string): Promise<string> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const { width, height } = metadata;
  const edgePixels: RGB[] = [];

  // Extract 1px strips from each edge and sample their colors
  const edges = [
    // Top edge
    { left: 0, top: 0, width, height: 1 },
    // Bottom edge
    { left: 0, top: height - 1, width, height: 1 },
    // Left edge
    { left: 0, top: 0, width: 1, height },
    // Right edge
    { left: width - 1, top: 0, width: 1, height },
  ];

  for (const region of edges) {
    const { data, info } = await sharp(imagePath)
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const pixelCount = data.length / channels;

    for (let i = 0; i < pixelCount; i++) {
      const offset = i * channels;
      // Only include pixels that aren't fully transparent
      const alpha = channels === 4 ? (data[offset + 3] ?? 255) : 255;
      if (alpha > 10) {
        edgePixels.push({
          r: data[offset] ?? 0,
          g: data[offset + 1] ?? 0,
          b: data[offset + 2] ?? 0,
        });
      }
    }
  }

  if (edgePixels.length === 0) {
    // Fallback to white if all edges are transparent
    return "#ffffff";
  }

  // Calculate average color
  const avg = edgePixels.reduce(
    (acc, pixel) => ({
      r: acc.r + pixel.r,
      g: acc.g + pixel.g,
      b: acc.b + pixel.b,
    }),
    { r: 0, g: 0, b: 0 }
  );

  const count = edgePixels.length;
  const r = Math.round(avg.r / count);
  const g = Math.round(avg.g / count);
  const b = Math.round(avg.b / count);

  return rgbToHex(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Validates a hex color string
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Normalizes hex color to 6-digit format
 */
export function normalizeHexColor(color: string): string {
  if (!color.startsWith("#")) {
    color = "#" + color;
  }

  // Expand 3-digit hex to 6-digit
  if (color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return color.toLowerCase();
}
