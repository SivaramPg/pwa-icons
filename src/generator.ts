import sharp, { type Sharp, type PngOptions, type JpegOptions, type WebpOptions, type AvifOptions } from "sharp";
import { mkdir } from "fs/promises";
import { join, extname } from "path";
import pLimit from "p-limit";
import { extractEdgeColor } from "./color";
import { iosConfig } from "./platforms/ios";
import { androidConfig } from "./platforms/android";
import { windows11Config } from "./platforms/windows11";
import type {
  GeneratorOptions,
  Platform,
  PlatformConfig,
  IconConfig,
  IconEntry,
  IconsManifest,
  OutputFormat,
  OptimizationLevel,
} from "./types";
import { SUPPORTED_INPUT_FORMATS } from "./types";

const platformConfigs: Record<Platform, PlatformConfig> = {
  ios: iosConfig,
  android: androidConfig,
  windows11: windows11Config,
};

// Concurrency limit to prevent memory spikes
const limit = pLimit(10);

interface GenerationResult {
  totalIcons: number;
  platforms: Platform[];
  outputPath: string;
  format: OutputFormat;
  optimized: boolean;
}

/**
 * Get file extension for output format
 */
function getExtension(format: OutputFormat): string {
  return format === "jpg" ? "jpg" : format;
}

/**
 * Get optimization settings for each format
 */
function getFormatOptions(
  format: OutputFormat,
  optimization: OptimizationLevel
): PngOptions | JpegOptions | WebpOptions | AvifOptions {
  switch (format) {
    case "png":
      return {
        compressionLevel: optimization === "heavy" ? 9 : optimization === "light" ? 6 : 4,
        palette: optimization === "heavy",
      };
    case "jpg":
      return {
        quality: optimization === "heavy" ? 75 : optimization === "light" ? 85 : 90,
        mozjpeg: optimization !== "none",
      };
    case "webp":
      return {
        quality: optimization === "heavy" ? 75 : optimization === "light" ? 85 : 90,
        lossless: optimization === "none",
      };
    case "avif":
      return {
        quality: optimization === "heavy" ? 60 : optimization === "light" ? 75 : 85,
      };
  }
}

/**
 * Apply format-specific output to sharp instance
 */
function applyFormat(
  sharpInstance: Sharp,
  format: OutputFormat,
  optimization: OptimizationLevel
): Sharp {
  const options = getFormatOptions(format, optimization);
  switch (format) {
    case "png":
      return sharpInstance.png(options as PngOptions);
    case "jpg":
      return sharpInstance.jpeg(options as JpegOptions);
    case "webp":
      return sharpInstance.webp(options as WebpOptions);
    case "avif":
      return sharpInstance.avif(options as AvifOptions);
  }
}

export async function generateIcons(
  options: GeneratorOptions,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<GenerationResult> {
  const { inputPath, outputPath, platforms, padding, backgroundColor, outputFormat, optimization } =
    options;

  // Resolve background color
  let bgColor: { r: number; g: number; b: number; alpha: number } | undefined;

  if (backgroundColor === "transparent") {
    bgColor = { r: 0, g: 0, b: 0, alpha: 0 };
  } else if (backgroundColor === "edge") {
    const hexColor = await extractEdgeColor(inputPath);
    bgColor = hexToRgb(hexColor);
  } else {
    bgColor = hexToRgb(backgroundColor);
  }

  // Load and optimize source image once
  // This removes metadata and ensures consistent processing
  let sourceSharp = sharp(inputPath);

  // Apply light preprocessing to source
  if (optimization !== "none") {
    sourceSharp = sourceSharp
      .rotate() // Auto-rotate based on EXIF
      .withMetadata({ density: 72 }); // Normalize DPI
  }

  const sourceBuffer = await sourceSharp.png().toBuffer();

  // Get file extension
  const ext = getExtension(outputFormat);

  // Collect all icons to generate
  const tasks: Array<{
    platform: Platform;
    config: IconConfig;
    outputDir: string;
  }> = [];

  for (const platform of platforms) {
    const platformConfig = platformConfigs[platform];
    const outputDir = join(outputPath, platformConfig.folder);

    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    for (const iconConfig of platformConfig.icons) {
      tasks.push({
        platform,
        config: iconConfig,
        outputDir,
      });
    }
  }

  const totalIcons = tasks.length;
  let completed = 0;

  // Generate all icons with concurrency limit
  const iconEntries: IconEntry[] = [];

  await Promise.all(
    tasks.map((task) =>
      limit(async () => {
        const { platform, config, outputDir } = task;
        const platformConfig = platformConfigs[platform];

        const entry = await generateIcon(
          sourceBuffer,
          config,
          outputDir,
          platformConfig.folder,
          padding,
          bgColor,
          outputFormat,
          optimization,
          ext
        );

        iconEntries.push(entry);
        completed++;

        if (onProgress) {
          onProgress(completed, totalIcons, config.name);
        }
      })
    )
  );

  // Sort entries by platform folder and then by size
  iconEntries.sort((a, b) => {
    if (a.src < b.src) return -1;
    if (a.src > b.src) return 1;
    return 0;
  });

  // Write icons.json manifest
  const manifest: IconsManifest = { icons: iconEntries };
  const manifestPath = join(outputPath, "icons.json");
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));

  return {
    totalIcons,
    platforms,
    outputPath,
    format: outputFormat,
    optimized: optimization !== "none",
  };
}

async function generateIcon(
  sourceBuffer: Buffer,
  config: IconConfig,
  outputDir: string,
  folder: string,
  padding: number,
  bgColor: { r: number; g: number; b: number; alpha: number } | undefined,
  format: OutputFormat,
  optimization: OptimizationLevel,
  ext: string
): Promise<IconEntry> {
  const { width, height } = config;
  // Replace .png extension with actual format extension
  const name = config.name.replace(/\.png$/, `.${ext}`);
  const outputPath = join(outputDir, name);

  // Calculate padded dimensions
  const effectivePadding = config.padding ?? padding;
  const paddingFactor = 1 - effectivePadding;

  // For non-square icons (like splash screens), we need to fit the icon
  // while maintaining aspect ratio
  const iconSize = Math.min(width, height);
  const scaledIconSize = Math.round(iconSize * paddingFactor);

  // Resize source image to fit within the padded area
  const resizedIcon = await sharp(sourceBuffer)
    .resize(scaledIconSize, scaledIconSize, {
      fit: "contain",
      background: bgColor ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // Create the final canvas with background and center the icon
  const left = Math.round((width - scaledIconSize) / 2);
  const top = Math.round((height - scaledIconSize) / 2);

  // Create base image with background
  let output = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: bgColor ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([
    {
      input: resizedIcon,
      left,
      top,
    },
  ]);

  // Apply format and optimization
  output = applyFormat(output, format, optimization);

  await output.toFile(outputPath);

  return {
    src: `${folder}/${name}`,
    sizes: `${width}x${height}`,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number; alpha: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return { r: 255, g: 255, b: 255, alpha: 1 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    alpha: 1,
  };
}

/**
 * Validates the input image meets minimum requirements
 */
export async function validateImage(
  imagePath: string
): Promise<{ valid: boolean; width?: number; height?: number; format?: string; error?: string }> {
  try {
    // Check file extension first
    const ext = extname(imagePath).toLowerCase().slice(1);
    const supportedExts = SUPPORTED_INPUT_FORMATS as readonly string[];

    if (!supportedExts.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported format: .${ext}. Supported: ${SUPPORTED_INPUT_FORMATS.join(", ")}`,
      };
    }

    const metadata = await sharp(imagePath).metadata();

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Could not read image dimensions" };
    }

    if (metadata.width < 256 || metadata.height < 256) {
      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        error: `Image must be at least 256x256 pixels (got ${metadata.width}x${metadata.height})`,
      };
    }

    if (metadata.width !== metadata.height) {
      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        error: `Image must be square (got ${metadata.width}x${metadata.height})`,
      };
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Could not read image: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}
