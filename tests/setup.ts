/**
 * Test fixture setup - generates test images using Sharp
 */
import sharp from "sharp";
import { copyFile, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const FIXTURES_DIR = join(import.meta.dir, "fixtures");
export const PROJECT_ROOT = join(import.meta.dir, "..");

export const FIXTURES = {
  // Sample logo from project (512x512)
  logo: join(PROJECT_ROOT, "sample-logo.png"),
  // Generated test fixtures
  valid256: join(FIXTURES_DIR, "valid-256.png"),
  valid512: join(FIXTURES_DIR, "valid-512.png"),
  tooSmall: join(FIXTURES_DIR, "too-small.png"),
  nonSquare: join(FIXTURES_DIR, "non-square.png"),
  transparent: join(FIXTURES_DIR, "transparent.png"),
  coloredEdges: join(FIXTURES_DIR, "colored-edges.png"),
  validJpg: join(FIXTURES_DIR, "valid-256.jpg"),
  validWebp: join(FIXTURES_DIR, "valid-256.webp"),
  smallNonSquareSvg: join(FIXTURES_DIR, "small-non-square.svg"),
  tinyDetailedSvg: join(FIXTURES_DIR, "tiny-detailed.svg"),
  rasterNamedSvg: join(FIXTURES_DIR, "raster-named-svg.svg"),
} as const;

// Track if fixtures have been set up in this process
let fixturesReady = false;

/**
 * Generate all test fixtures (skips if already created)
 */
export async function setupFixtures(): Promise<void> {
  // Skip if already set up in this process
  if (fixturesReady) return;

  // Skip if fixtures directory already exists with files
  if (
    existsSync(FIXTURES.valid256) &&
    existsSync(FIXTURES.smallNonSquareSvg) &&
    existsSync(FIXTURES.tinyDetailedSvg) &&
    existsSync(FIXTURES.rasterNamedSvg)
  ) {
    fixturesReady = true;
    return;
  }

  await mkdir(FIXTURES_DIR, { recursive: true });

  // 256x256 white PNG
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(FIXTURES.valid256);

  // 512x512 white PNG
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(FIXTURES.valid512);

  // 100x100 (too small)
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(FIXTURES.tooSmall);

  // 512x256 (non-square)
  await sharp({
    create: {
      width: 512,
      height: 256,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(FIXTURES.nonSquare);

  // 256x256 with transparent edges (center is opaque)
  const transparentBase = await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  // Add a centered opaque square
  const centerSquare = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 100, g: 150, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  await sharp(transparentBase)
    .composite([{ input: centerSquare, left: 28, top: 28 }])
    .png()
    .toFile(FIXTURES.transparent);

  // 256x256 with red edges (#ff0000)
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(FIXTURES.coloredEdges);

  // 256x256 JPEG
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .jpeg()
    .toFile(FIXTURES.validJpg);

  // 256x256 WebP
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .webp()
    .toFile(FIXTURES.validWebp);

  // 95x77 SVG matching the dimensions reported in GitHub issue #1
  await writeFile(
    FIXTURES.smallNonSquareSvg,
    '<svg xmlns="http://www.w3.org/2000/svg" width="95" height="77" viewBox="0 0 95 77"><rect width="95" height="77" fill="#663399"/><circle cx="47.5" cy="38.5" r="24" fill="#ffffff"/></svg>'
  );

  const stripes = Array.from(
    { length: 800 },
    (_, x) => `<rect x="${x}" width="1" height="800" fill="${x % 2 === 0 ? "#000" : "#fff"}"/>`
  ).join("");
  await writeFile(
    FIXTURES.tinyDetailedSvg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="0.5" height="0.5" viewBox="0 0 800 800">${stripes}</svg>`
  );

  // Raster content with an SVG extension must still follow raster validation rules.
  await copyFile(FIXTURES.nonSquare, FIXTURES.rasterNamedSvg);

  fixturesReady = true;
}

/**
 * Create a temporary output directory for tests
 */
export function getTempOutputDir(): string {
  return join(FIXTURES_DIR, `output-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

/**
 * Sleep helper for Windows file lock issues
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry rm with exponential backoff (Windows file locking workaround)
 */
async function rmWithRetry(path: string, maxRetries = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await rm(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      // EBUSY = file busy, ENOTEMPTY = dir not empty, EPERM = permission (Windows)
      if (error.code === "EBUSY" || error.code === "ENOTEMPTY" || error.code === "EPERM") {
        await sleep(100 * (i + 1)); // 100ms, 200ms, 300ms
        continue;
      }
      throw err;
    }
  }
  // Final attempt without catching
  await rm(path, { recursive: true, force: true });
}

/**
 * Clean up all test fixtures and temp directories
 */
export async function cleanupFixtures(): Promise<void> {
  fixturesReady = false;
  if (existsSync(FIXTURES_DIR)) {
    await rmWithRetry(FIXTURES_DIR);
  }
}

/**
 * Clean up default AppImages directory if created during tests
 */
export async function cleanupAppImages(): Promise<void> {
  const appImagesDir = join(PROJECT_ROOT, "AppImages");
  if (existsSync(appImagesDir)) {
    await rmWithRetry(appImagesDir);
  }
}
