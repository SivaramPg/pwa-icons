import type { PlatformConfig } from "../types";

// Favicon sizes
// - ICO: multi-size (16, 32, 48) - handled specially in generator
// - PNG: 32x32 standard, 180x180 for apple-touch-icon, 192x192 for android
// - JPG: 32x32 as fallback

export const faviconConfig: PlatformConfig = {
  folder: "favicon",
  icons: [
    // Standard favicons (used to generate ICO)
    { name: "favicon-16x16.png", width: 16, height: 16 },
    { name: "favicon-32x32.png", width: 32, height: 32 },
    { name: "favicon-48x48.png", width: 48, height: 48 },
    // Apple touch icon
    { name: "apple-touch-icon.png", width: 180, height: 180 },
    // Larger PNG for modern browsers
    { name: "favicon-192x192.png", width: 192, height: 192 },
    // favicon.ico is generated separately from 16, 32, 48 PNGs
  ],
};

// Sizes to include in the multi-size ICO file
export const ICO_SIZES = [16, 32, 48];
