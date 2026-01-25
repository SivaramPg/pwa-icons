import { describe, it, expect } from "bun:test";
import { iosConfig } from "../../src/platforms/ios";
import { androidConfig } from "../../src/platforms/android";
import { windows11Config } from "../../src/platforms/windows11";
import { faviconConfig, ICO_SIZES } from "../../src/platforms/favicon";

describe("iOS Platform Config", () => {
  it("has 26 icon configurations", () => {
    expect(iosConfig.icons.length).toBe(26);
  });

  it("uses 'ios' folder", () => {
    expect(iosConfig.folder).toBe("ios");
  });

  it("includes all required sizes", () => {
    const expectedSizes = [
      16, 20, 29, 32, 40, 50, 57, 58, 60, 64, 72, 76, 80, 87, 100, 114, 120, 128, 144, 152, 167, 180,
      192, 256, 512, 1024,
    ];

    const actualSizes = iosConfig.icons.map((icon) => icon.width);
    expect(actualSizes.sort((a, b) => a - b)).toEqual(expectedSizes.sort((a, b) => a - b));
  });

  it("all icons are square", () => {
    for (const icon of iosConfig.icons) {
      expect(icon.width).toBe(icon.height);
    }
  });

  it("icon names follow pattern {size}.png", () => {
    for (const icon of iosConfig.icons) {
      expect(icon.name).toBe(`${icon.width}.png`);
    }
  });
});

describe("Android Platform Config", () => {
  it("has 6 icon configurations", () => {
    expect(androidConfig.icons.length).toBe(6);
  });

  it("uses 'android' folder", () => {
    expect(androidConfig.folder).toBe("android");
  });

  it("includes all density sizes", () => {
    const expectedSizes = [48, 72, 96, 144, 192, 512];
    const actualSizes = androidConfig.icons.map((icon) => icon.width);
    expect(actualSizes.sort((a, b) => a - b)).toEqual(expectedSizes.sort((a, b) => a - b));
  });

  it("all icons are square", () => {
    for (const icon of androidConfig.icons) {
      expect(icon.width).toBe(icon.height);
    }
  });

  it("icon names follow pattern android-launchericon-{size}-{size}.png", () => {
    for (const icon of androidConfig.icons) {
      expect(icon.name).toBe(`android-launchericon-${icon.width}-${icon.height}.png`);
    }
  });
});

describe("Windows 11 Platform Config", () => {
  it("has 80 icon configurations", () => {
    expect(windows11Config.icons.length).toBe(80);
  });

  it("uses 'windows11' folder", () => {
    expect(windows11Config.folder).toBe("windows11");
  });

  it("includes scaled tile variants (5 scales x 7 types = 35)", () => {
    const scaledIcons = windows11Config.icons.filter((icon) => icon.name.includes(".scale-"));
    expect(scaledIcons.length).toBe(35);
  });

  it("includes targetsize variants (15 sizes x 3 variants = 45)", () => {
    const targetsizeIcons = windows11Config.icons.filter((icon) =>
      icon.name.includes("targetsize-")
    );
    expect(targetsizeIcons.length).toBe(45);
  });

  it("has correct scale factors", () => {
    const scales = [100, 125, 150, 200, 400];
    for (const scale of scales) {
      const hasScale = windows11Config.icons.some((icon) => icon.name.includes(`.scale-${scale}.`));
      expect(hasScale).toBe(true);
    }
  });

  it("has all targetsize variants", () => {
    const targetSizes = [16, 20, 24, 30, 32, 36, 40, 44, 48, 60, 64, 72, 80, 96, 256];
    for (const size of targetSizes) {
      // Standard
      expect(
        windows11Config.icons.some((i) => i.name === `Square44x44Logo.targetsize-${size}.png`)
      ).toBe(true);
      // Unplated
      expect(
        windows11Config.icons.some(
          (i) => i.name === `Square44x44Logo.altform-unplated_targetsize-${size}.png`
        )
      ).toBe(true);
      // Light unplated
      expect(
        windows11Config.icons.some(
          (i) => i.name === `Square44x44Logo.altform-lightunplated_targetsize-${size}.png`
        )
      ).toBe(true);
    }
  });

  it("SmallTile scales correctly", () => {
    // SmallTile base is 71x71 at scale-100
    const smallTile100 = windows11Config.icons.find((i) => i.name === "SmallTile.scale-100.png");
    expect(smallTile100?.width).toBe(71);
    expect(smallTile100?.height).toBe(71);

    const smallTile200 = windows11Config.icons.find((i) => i.name === "SmallTile.scale-200.png");
    expect(smallTile200?.width).toBe(142);
    expect(smallTile200?.height).toBe(142);
  });

  it("Wide310x150Logo is non-square", () => {
    const wideLogos = windows11Config.icons.filter((i) => i.name.includes("Wide310x150Logo"));
    for (const icon of wideLogos) {
      expect(icon.width).not.toBe(icon.height);
      // Aspect ratio should be ~2:1
      expect(icon.width / icon.height).toBeCloseTo(310 / 150, 1);
    }
  });
});

describe("Favicon Platform Config", () => {
  it("has 5 PNG icon configurations", () => {
    expect(faviconConfig.icons.length).toBe(5);
  });

  it("uses 'favicon' folder", () => {
    expect(faviconConfig.folder).toBe("favicon");
  });

  it("includes standard favicon sizes", () => {
    const expectedNames = [
      "favicon-16x16.png",
      "favicon-32x32.png",
      "favicon-48x48.png",
      "apple-touch-icon.png",
      "favicon-192x192.png",
    ];

    const actualNames = faviconConfig.icons.map((i) => i.name);
    for (const name of expectedNames) {
      expect(actualNames).toContain(name);
    }
  });

  it("apple-touch-icon is 180x180", () => {
    const appleIcon = faviconConfig.icons.find((i) => i.name === "apple-touch-icon.png");
    expect(appleIcon?.width).toBe(180);
    expect(appleIcon?.height).toBe(180);
  });

  it("ICO_SIZES contains correct sizes for multi-size ICO", () => {
    expect(ICO_SIZES).toEqual([16, 32, 48]);
  });

  it("all favicon icons are square", () => {
    for (const icon of faviconConfig.icons) {
      expect(icon.width).toBe(icon.height);
    }
  });
});
