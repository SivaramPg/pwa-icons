import type { PlatformConfig, IconConfig } from "../types";

// Windows 11 requires many icon variants for different contexts
// Based on Microsoft UX guidelines and PWABuilder output

const scales = [100, 125, 150, 200, 400];
const targetSizes = [16, 20, 24, 30, 32, 36, 40, 44, 48, 60, 64, 72, 80, 96, 256];

// Base dimensions at scale-100
const baseDimensions = {
  SmallTile: { width: 71, height: 71 },
  Square150x150Logo: { width: 150, height: 150 },
  Wide310x150Logo: { width: 310, height: 150 },
  LargeTile: { width: 310, height: 310 },
  Square44x44Logo: { width: 44, height: 44 },
  StoreLogo: { width: 50, height: 50 },
  SplashScreen: { width: 620, height: 300 },
};

function generateScaledIcons(): IconConfig[] {
  const icons: IconConfig[] = [];

  // Scaled versions of each tile type
  for (const [baseName, dims] of Object.entries(baseDimensions)) {
    for (const scale of scales) {
      const width = Math.round((dims.width * scale) / 100);
      const height = Math.round((dims.height * scale) / 100);
      icons.push({
        name: `${baseName}.scale-${scale}.png`,
        width,
        height,
      });
    }
  }

  // Target size icons (Square44x44Logo variants)
  // These are used for taskbar, start menu, etc.
  for (const size of targetSizes) {
    // Standard targetsize
    icons.push({
      name: `Square44x44Logo.targetsize-${size}.png`,
      width: size,
      height: size,
    });

    // Unplated variant (no background plate)
    icons.push({
      name: `Square44x44Logo.altform-unplated_targetsize-${size}.png`,
      width: size,
      height: size,
    });

    // Light unplated variant (for light theme)
    icons.push({
      name: `Square44x44Logo.altform-lightunplated_targetsize-${size}.png`,
      width: size,
      height: size,
    });
  }

  return icons;
}

export const windows11Config: PlatformConfig = {
  folder: "windows11",
  icons: generateScaledIcons(),
};
