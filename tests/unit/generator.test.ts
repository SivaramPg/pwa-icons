import { describe, it, expect, beforeAll, afterEach } from "bun:test";
import { validateImage, generateIcons } from "../../src/generator";
import { setupFixtures, FIXTURES, getTempOutputDir } from "../setup";
import { existsSync } from "fs";
import { rm, readdir, readFile } from "fs/promises";
import { join } from "path";

let tempDirs: string[] = [];

beforeAll(async () => {
  await setupFixtures();
});

afterEach(async () => {
  // Cleanup temp directories with retry for Windows
  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      try {
        await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch {
        // Ignore cleanup errors on Windows
      }
    }
  }
  tempDirs = [];
});

describe("validateImage", () => {
  describe("valid images", () => {
    it("accepts real project logo (1023x1023)", async () => {
      const result = await validateImage(FIXTURES.logo);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(1023);
      expect(result.height).toBe(1023);
      expect(result.format).toBe("png");
    });

    it("accepts 256x256 PNG", async () => {
      const result = await validateImage(FIXTURES.valid256);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(256);
      expect(result.height).toBe(256);
      expect(result.format).toBe("png");
    });

    it("accepts 512x512 PNG", async () => {
      const result = await validateImage(FIXTURES.valid512);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(512);
      expect(result.height).toBe(512);
    });

    it("accepts JPEG format", async () => {
      const result = await validateImage(FIXTURES.validJpg);
      expect(result.valid).toBe(true);
      expect(result.format).toBe("jpeg");
    });

    it("accepts WebP format", async () => {
      const result = await validateImage(FIXTURES.validWebp);
      expect(result.valid).toBe(true);
      expect(result.format).toBe("webp");
    });
  });

  describe("invalid images", () => {
    it("rejects image smaller than 256x256", async () => {
      const result = await validateImage(FIXTURES.tooSmall);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 256x256");
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("rejects non-square image", async () => {
      const result = await validateImage(FIXTURES.nonSquare);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be square");
    });

    it("rejects non-existent file", async () => {
      const result = await validateImage("/nonexistent/image.png");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Could not read image");
    });

    it("rejects unsupported format", async () => {
      const result = await validateImage("/some/image.bmp");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported format");
    });
  });
});

describe("generateIcons", () => {
  describe("platform generation", () => {
    it("generates 26 iOS icons", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["ios"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(26);
      expect(result.platforms).toEqual(["ios"]);

      const iosDir = join(outputPath, "ios");
      const files = await readdir(iosDir);
      expect(files.length).toBe(26);
    });

    it("generates 6 Android icons", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(6);

      const androidDir = join(outputPath, "android");
      const files = await readdir(androidDir);
      expect(files.length).toBe(6);
      expect(files.some((f) => f.includes("android-launchericon"))).toBe(true);
    });

    it("generates favicon files including ICO", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["favicon"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(5); // 5 PNG icons (ICO is generated separately)

      const faviconDir = join(outputPath, "favicon");
      const files = await readdir(faviconDir);

      // Should have 5 PNGs + 1 ICO = 6 files
      expect(files.length).toBe(6);
      expect(files).toContain("favicon.ico");
      expect(files).toContain("favicon-16x16.png");
      expect(files).toContain("favicon-32x32.png");
      expect(files).toContain("apple-touch-icon.png");
    });

    it("generates ~80 Windows 11 icons", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["windows11"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(80);

      const win11Dir = join(outputPath, "windows11");
      const files = await readdir(win11Dir);
      expect(files.length).toBe(80);
    });

    it("generates all platforms (118 icons total)", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["ios", "android", "windows11", "favicon"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      // 26 + 6 + 80 + 5 = 117 (favicon ICO adds 1 entry)
      expect(result.totalIcons).toBe(117);
    });
  });

  describe("real-world logo tests", () => {
    it("generates all platforms from real logo with edge detection", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.logo,
        outputPath,
        platforms: ["ios", "android", "windows11", "favicon"],
        padding: 0.3,
        backgroundColor: "edge",
        outputFormat: "png",
        optimization: "light",
      });

      expect(result.totalIcons).toBe(117);
      expect(result.optimized).toBe(true);

      // Verify all platform directories exist
      expect(existsSync(join(outputPath, "ios"))).toBe(true);
      expect(existsSync(join(outputPath, "android"))).toBe(true);
      expect(existsSync(join(outputPath, "windows11"))).toBe(true);
      expect(existsSync(join(outputPath, "favicon"))).toBe(true);
      expect(existsSync(join(outputPath, "icons.json"))).toBe(true);
    });

    it("generates WebP icons from real logo", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.logo,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "edge",
        outputFormat: "webp",
        optimization: "heavy",
      });

      expect(result.totalIcons).toBe(6);
      expect(result.format).toBe("webp");

      const files = await readdir(join(outputPath, "android"));
      expect(files.every((f) => f.endsWith(".webp"))).toBe(true);
    });
  });

  describe("output formats", () => {
    it("generates WebP format icons", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "webp",
        optimization: "none",
      });

      const androidDir = join(outputPath, "android");
      const files = await readdir(androidDir);
      expect(files.every((f) => f.endsWith(".webp"))).toBe(true);
    });

    it("generates JPEG format icons", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "jpg",
        optimization: "none",
      });

      const androidDir = join(outputPath, "android");
      const files = await readdir(androidDir);
      expect(files.every((f) => f.endsWith(".jpg"))).toBe(true);
    });
  });

  describe("background colors", () => {
    it("uses transparent background", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "transparent",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.format).toBe("png");
    });

    it("uses edge detection for background", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      // Should not throw
      const result = await generateIcons({
        inputPath: FIXTURES.coloredEdges,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "edge",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(6);
    });

    it("uses custom hex color for background", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ff0000",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.totalIcons).toBe(6);
    });
  });

  describe("manifest generation", () => {
    it("creates icons.json manifest", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      const manifestPath = join(outputPath, "icons.json");
      expect(existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it("manifest entries have correct structure", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      const manifestPath = join(outputPath, "icons.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));

      for (const entry of manifest.icons) {
        expect(entry.src).toBeDefined();
        expect(entry.sizes).toBeDefined();
        expect(entry.src).toContain("android/");
        expect(entry.sizes).toMatch(/^\d+x\d+$/);
      }
    });
  });

  describe("progress callback", () => {
    it("calls progress callback with correct values", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const progressCalls: Array<{ current: number; total: number; name: string }> = [];

      await generateIcons(
        {
          inputPath: FIXTURES.valid256,
          outputPath,
          platforms: ["android"],
          padding: 0.3,
          backgroundColor: "#ffffff",
          outputFormat: "png",
          optimization: "none",
        },
        (current, total, name) => {
          progressCalls.push({ current, total, name });
        }
      );

      expect(progressCalls.length).toBe(6);
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall!.current).toBe(6);
      expect(lastCall!.total).toBe(6);
    });
  });

  describe("optimization levels", () => {
    it("applies light optimization", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "light",
      });

      expect(result.optimized).toBe(true);
    });

    it("applies heavy optimization", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "heavy",
      });

      expect(result.optimized).toBe(true);
    });

    it("reports not optimized for none", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const result = await generateIcons({
        inputPath: FIXTURES.valid256,
        outputPath,
        platforms: ["android"],
        padding: 0.3,
        backgroundColor: "#ffffff",
        outputFormat: "png",
        optimization: "none",
      });

      expect(result.optimized).toBe(false);
    });
  });
});
