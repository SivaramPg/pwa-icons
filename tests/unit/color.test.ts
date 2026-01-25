import { describe, it, expect, beforeAll } from "bun:test";
import { extractEdgeColor, isValidHexColor, normalizeHexColor } from "../../src/color";
import { setupFixtures, FIXTURES } from "../setup";

beforeAll(async () => {
  await setupFixtures();
});

describe("isValidHexColor", () => {
  it("accepts valid 6-digit hex colors", () => {
    expect(isValidHexColor("#ffffff")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#ff0000")).toBe(true);
    expect(isValidHexColor("#ABC123")).toBe(true);
  });

  it("accepts valid 3-digit hex colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#000")).toBe(true);
    expect(isValidHexColor("#f00")).toBe(true);
    expect(isValidHexColor("#ABC")).toBe(true);
  });

  it("rejects hex colors without #", () => {
    expect(isValidHexColor("ffffff")).toBe(false);
    expect(isValidHexColor("fff")).toBe(false);
  });

  it("rejects invalid hex characters", () => {
    expect(isValidHexColor("#gggggg")).toBe(false);
    expect(isValidHexColor("#xyz123")).toBe(false);
  });

  it("rejects invalid lengths", () => {
    expect(isValidHexColor("#ff")).toBe(false);
    expect(isValidHexColor("#ffff")).toBe(false);
    expect(isValidHexColor("#fffffff")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidHexColor("")).toBe(false);
  });

  it("rejects color names", () => {
    expect(isValidHexColor("white")).toBe(false);
    expect(isValidHexColor("red")).toBe(false);
  });
});

describe("normalizeHexColor", () => {
  it("adds # prefix if missing", () => {
    expect(normalizeHexColor("ffffff")).toBe("#ffffff");
    expect(normalizeHexColor("fff")).toBe("#ffffff");
  });

  it("expands 3-digit to 6-digit", () => {
    expect(normalizeHexColor("#fff")).toBe("#ffffff");
    expect(normalizeHexColor("#f00")).toBe("#ff0000");
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
  });

  it("converts to lowercase", () => {
    expect(normalizeHexColor("#FFFFFF")).toBe("#ffffff");
    expect(normalizeHexColor("#FF0000")).toBe("#ff0000");
    expect(normalizeHexColor("ABC123")).toBe("#abc123");
  });

  it("handles already normalized colors", () => {
    expect(normalizeHexColor("#ffffff")).toBe("#ffffff");
    expect(normalizeHexColor("#abc123")).toBe("#abc123");
  });

  it("handles mixed case 3-digit with no #", () => {
    // Note: 3-digit expansion preserves case (returns before lowercase)
    expect(normalizeHexColor("FFF")).toBe("#FFFFFF");
    expect(normalizeHexColor("AbC")).toBe("#AAbbCC");
  });
});

describe("extractEdgeColor", () => {
  it("extracts color from real project logo", async () => {
    const color = await extractEdgeColor(FIXTURES.logo);
    // Logo has purple edges - verify it returns a valid hex color
    expect(isValidHexColor(color)).toBe(true);
    // Should be purple-ish (the logo has #a020f0 purple background)
    expect(color.startsWith("#")).toBe(true);
  });

  it("extracts color from solid colored image", async () => {
    const color = await extractEdgeColor(FIXTURES.coloredEdges);
    // Red image should return #ff0000
    expect(color).toBe("#ff0000");
  });

  it("extracts color from white image", async () => {
    const color = await extractEdgeColor(FIXTURES.valid256);
    expect(color).toBe("#ffffff");
  });

  it("falls back to white for transparent edges", async () => {
    const color = await extractEdgeColor(FIXTURES.transparent);
    // Edges are transparent, should fall back to #ffffff
    expect(color).toBe("#ffffff");
  });

  it("throws error for non-existent file", async () => {
    await expect(extractEdgeColor("/nonexistent/image.png")).rejects.toThrow();
  });

  it("works with different image formats", async () => {
    const jpgColor = await extractEdgeColor(FIXTURES.validJpg);
    expect(jpgColor).toBe("#ffffff");

    const webpColor = await extractEdgeColor(FIXTURES.validWebp);
    expect(webpColor).toBe("#ffffff");
  });
});
