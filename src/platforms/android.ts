import type { PlatformConfig } from "../types";

// Android launcher icon sizes
// mdpi (48), hdpi (72), xhdpi (96), xxhdpi (144), xxxhdpi (192), Play Store (512)
const androidSizes = [48, 72, 96, 144, 192, 512];

export const androidConfig: PlatformConfig = {
  folder: "android",
  icons: androidSizes.map((size) => ({
    name: `android-launchericon-${size}-${size}.png`,
    width: size,
    height: size,
  })),
};
