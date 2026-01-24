import type { PlatformConfig } from "../types";

// iOS icon sizes based on Apple Human Interface Guidelines
// Covers iPhone, iPad, App Store, Spotlight, Settings, etc.
const iosSizes = [
  16, 20, 29, 32, 40, 50, 57, 58, 60, 64, 72, 76, 80, 87, 100, 114, 120, 128,
  144, 152, 167, 180, 192, 256, 512, 1024,
];

export const iosConfig: PlatformConfig = {
  folder: "ios",
  icons: iosSizes.map((size) => ({
    name: `${size}.png`,
    width: size,
    height: size,
  })),
};
