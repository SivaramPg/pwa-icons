/**
 * Test fixture setup - generates test images using Sharp
 */
import sharp from "sharp";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const FIXTURES_DIR = join(import.meta.dir, "fixtures");
export const PROJECT_ROOT = join(import.meta.dir, "..");

export const FIXTURES = {
  // Real logo from project (1024x1024)
  logo: join(PROJECT_ROOT, "logo.png"),
  // Generated test fixtures
  valid256: join(FIXTURES_DIR, "valid-256.png"),
  valid512: join(FIXTURES_DIR, "valid-512.png"),
  tooSmall: join(FIXTURES_DIR, "too-small.png"),
  nonSquare: join(FIXTURES_DIR, "non-square.png"),
  transparent: join(FIXTURES_DIR, "transparent.png"),
  coloredEdges: join(FIXTURES_DIR, "colored-edges.png"),
  validJpg: join(FIXTURES_DIR, "valid-256.jpg"),
  validWebp: join(FIXTURES_DIR, "valid-256.webp"),
} as const;

/**
 * Generate all test fixtures
 */
export async function setupFixtures(): Promise<void> {
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
}

/**
 * Create a temporary output directory for tests
 */
export function getTempOutputDir(): string {
  return join(FIXTURES_DIR, `output-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

/**
 * Clean up all test fixtures and temp directories
 */
export async function cleanupFixtures(): Promise<void> {
  if (existsSync(FIXTURES_DIR)) {
    await rm(FIXTURES_DIR, { recursive: true, force: true });
  }
}

/**
 * Clean up default AppImages directory if created during tests
 */
export async function cleanupAppImages(): Promise<void> {
  const appImagesDir = join(PROJECT_ROOT, "AppImages");
  if (existsSync(appImagesDir)) {
    await rm(appImagesDir, { recursive: true, force: true });
  }
}
