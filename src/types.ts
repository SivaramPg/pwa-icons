export type Platform = "ios" | "android" | "windows11" | "favicon";
export type OutputFormat = "png" | "jpg" | "webp" | "avif";
export type OptimizationLevel = "none" | "light" | "heavy";

export interface IconConfig {
  name: string;
  width: number;
  height: number;
  // Optional padding override (Windows11 has specific padding per icon type)
  padding?: number;
}

export interface PlatformConfig {
  folder: string;
  icons: IconConfig[];
}

export interface GeneratorOptions {
  inputPath: string;
  outputPath: string;
  platforms: Platform[];
  padding: number;
  backgroundColor: "transparent" | "edge" | string; // "edge" = extract from edges, string = hex color
  outputFormat: OutputFormat;
  optimization: OptimizationLevel;
}

export interface IconEntry {
  src: string;
  sizes: string;
}

export interface IconsManifest {
  icons: IconEntry[];
}

// Supported input formats (Sharp supports these via libvips)
export const SUPPORTED_INPUT_FORMATS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "avif",
  "svg",
  "gif",
  "tiff",
] as const;

export type InputFormat = (typeof SUPPORTED_INPUT_FORMATS)[number];

// Formats that support transparency
export const FORMATS_WITH_TRANSPARENCY: OutputFormat[] = ["png", "webp", "avif"];
