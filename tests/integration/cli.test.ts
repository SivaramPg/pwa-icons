import { describe, it, expect, beforeAll, afterEach, afterAll } from "bun:test";
import { spawn } from "bun";
import { setupFixtures, FIXTURES, getTempOutputDir, cleanupFixtures, cleanupAppImages } from "../setup";
import { existsSync } from "fs";
import { rm, readdir } from "fs/promises";
import { join } from "path";

let tempDirs: string[] = [];

beforeAll(async () => {
  await setupFixtures();
});

afterEach(async () => {
  // Cleanup temp directories
  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      await rm(dir, { recursive: true, force: true });
    }
  }
  tempDirs = [];
});

afterAll(async () => {
  await cleanupFixtures();
  await cleanupAppImages();
});

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn({
    cmd: ["bun", "run", "src/index.ts", ...args],
    cwd: join(import.meta.dir, "../.."),
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("CLI", () => {
  describe("version and help", () => {
    it("--version outputs version number", async () => {
      const { stdout, exitCode } = await runCli(["--version"]);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe("1.0.2");
    });

    it("--help shows usage information", async () => {
      const { stdout, exitCode } = await runCli(["--help"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Usage:");
      expect(stdout).toContain("-i, --input");
      expect(stdout).toContain("-o, --output");
      expect(stdout).toContain("-p, --platforms");
    });
  });

  describe("non-interactive mode", () => {
    it("generates icons with minimal flags", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Generated");

      const androidDir = join(outputPath, "android");
      expect(existsSync(androidDir)).toBe(true);

      const files = await readdir(androidDir);
      expect(files.length).toBe(6);
    });

    it("applies all flags correctly", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-f", "webp",
        "--padding", "0.5",
        "-b", "#ff0000",
        "--optimization", "heavy",
        "-y",
      ]);

      expect(exitCode).toBe(0);

      const androidDir = join(outputPath, "android");
      const files = await readdir(androidDir);
      expect(files.every((f) => f.endsWith(".webp"))).toBe(true);
    });

    it("generates multiple platforms", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "ios,android",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(join(outputPath, "ios"))).toBe(true);
      expect(existsSync(join(outputPath, "android"))).toBe(true);
    });

    it("generates favicon with ICO file", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "favicon",
        "-y",
      ]);

      expect(exitCode).toBe(0);

      const faviconDir = join(outputPath, "favicon");
      const files = await readdir(faviconDir);
      expect(files).toContain("favicon.ico");
    });
  });

  describe("defaults", () => {
    it("uses default output directory ./AppImages", async () => {
      const defaultOutput = join(import.meta.dir, "../../AppImages");
      tempDirs.push(defaultOutput);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-p", "android",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(defaultOutput)).toBe(true);
    });

    it("uses default PNG format", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-y",
      ]);

      expect(exitCode).toBe(0);

      const files = await readdir(join(outputPath, "android"));
      expect(files.every((f) => f.endsWith(".png"))).toBe(true);
    });

    it("uses default platforms (ios, android, windows11)", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(join(outputPath, "ios"))).toBe(true);
      expect(existsSync(join(outputPath, "android"))).toBe(true);
      expect(existsSync(join(outputPath, "windows11"))).toBe(true);
      // favicon is not in defaults
      expect(existsSync(join(outputPath, "favicon"))).toBe(false);
    });
  });

  describe("error handling", () => {
    it("rejects invalid platform", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "invalid",
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("Invalid platform");
    });

    it("rejects invalid format", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-f", "bmp",
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("Invalid format");
    });

    it("rejects invalid optimization level", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "--optimization", "ultra",
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("Invalid optimization");
    });

    it("rejects non-existent input file", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", "/nonexistent/image.png",
        "-o", outputPath,
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("Could not read image");
    });

    it("rejects too small image", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.tooSmall,
        "-o", outputPath,
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("256x256");
    });

    it("rejects non-square image", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.nonSquare,
        "-o", outputPath,
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("square");
    });

    it("rejects invalid padding value", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "--padding", "2.0",
        "-y",
      ]);

      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("between 0 and 1");
    });
  });

  describe("background handling", () => {
    it("accepts transparent background", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-b", "transparent",
        "-y",
      ]);

      expect(exitCode).toBe(0);
    });

    it("accepts edge detection", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-b", "edge",
        "-y",
      ]);

      expect(exitCode).toBe(0);
    });

    it("accepts hex color", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-b", "#ff0000",
        "-y",
      ]);

      expect(exitCode).toBe(0);
    });

    it("warns when using transparent with JPEG", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-f", "jpg",
        "-b", "transparent",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      // Should fall back to edge detection
      expect(stdout).toContain("edge");
    });
  });

  describe("manifest output", () => {
    it("creates icons.json", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.valid256,
        "-o", outputPath,
        "-p", "android",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(join(outputPath, "icons.json"))).toBe(true);
    });
  });

  describe("real-world logo tests", () => {
    it("generates all icons from real logo", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { stdout, exitCode } = await runCli([
        "-i", FIXTURES.logo,
        "-o", outputPath,
        "-p", "ios,android,windows11,favicon",
        "-b", "edge",
        "--optimization", "light",
        "-y",
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Generated");
      expect(stdout).toContain("117");

      // Verify all platforms
      expect(existsSync(join(outputPath, "ios"))).toBe(true);
      expect(existsSync(join(outputPath, "android"))).toBe(true);
      expect(existsSync(join(outputPath, "windows11"))).toBe(true);
      expect(existsSync(join(outputPath, "favicon"))).toBe(true);
      expect(existsSync(join(outputPath, "favicon", "favicon.ico"))).toBe(true);
    });

    it("generates WebP icons from real logo with heavy optimization", async () => {
      const outputPath = getTempOutputDir();
      tempDirs.push(outputPath);

      const { exitCode } = await runCli([
        "-i", FIXTURES.logo,
        "-o", outputPath,
        "-p", "android",
        "-f", "webp",
        "--optimization", "heavy",
        "-y",
      ]);

      expect(exitCode).toBe(0);

      const files = await readdir(join(outputPath, "android"));
      expect(files.length).toBe(6);
      expect(files.every((f) => f.endsWith(".webp"))).toBe(true);
    });
  });
});
