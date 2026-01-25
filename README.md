# pwa-icons

[![CI](https://github.com/SivaramPg/pwa-icons/actions/workflows/ci.yml/badge.svg)](https://github.com/SivaramPg/pwa-icons/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pwa-icons.svg)](https://www.npmjs.com/package/pwa-icons)
[![npm downloads](https://img.shields.io/npm/dm/pwa-icons.svg)](https://www.npmjs.com/package/pwa-icons)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A fast, interactive CLI to generate PWA icons for **iOS**, **Android**, **Windows 11**, and **favicons** from a single source image.

Built with [Bun](https://bun.sh), [Sharp](https://sharp.pixelplumbing.com/), and [@clack/prompts](https://github.com/natemoo-re/clack).

## Demo

https://github.com/user-attachments/assets/6a527cc1-34da-4422-8639-5cfaaadadcd7

## Features

- **Interactive prompts** — No need to remember flags
- **118 icons** generated in under 1 second
- **Smart edge detection** — Samples border pixels for seamless backgrounds
- **Multiple output formats** — PNG, WebP, AVIF, JPEG
- **Optimization levels** — Balance quality vs file size
- **Platform selection** — iOS, Android, Windows 11, Favicon
- **Favicon generation** — Multi-size ICO + apple-touch-icon

## Quick Start

```bash
# Run interactively
bun run start

# Or with flags
bun run start -i logo.png -o ./icons -y
```

## Installation

### From npm (recommended)

```bash
# npm
npx pwa-icons
npm install -g pwa-icons

# yarn
yarn dlx pwa-icons
yarn global add pwa-icons

# pnpm
pnpm dlx pwa-icons
pnpm add -g pwa-icons

# bun
bunx pwa-icons
bun add -g pwa-icons
```

### From source

Prerequisites: [Bun](https://bun.sh) v1.0.0+ or [Node.js](https://nodejs.org) v18+

```bash
# Clone the repo
git clone https://github.com/SivaramPg/pwa-icons.git
cd pwa-icons

# Install dependencies
bun install  # or: npm install

# Run
bun run start  # or: npm start
```

## Usage

### Interactive Mode (Recommended)

Just run without arguments:

```bash
bun run start
```

You'll be prompted for:

1. **Source image path** — Must be square, minimum 256×256px
2. **Output directory** — Default: `./AppImages`
3. **Platforms** — iOS, Android, Windows 11 (multi-select)
4. **Output format** — PNG, WebP, AVIF, or JPEG
5. **Padding** — 0 to 1 ratio (0.3 recommended)
6. **Background color** — Edge detection, transparent, or custom hex
7. **Optimization level** — None, light, or heavy

### CLI Flags

For scripting or CI/CD:

```bash
bun run start \
  -i logo.png \
  -o ./output \
  -p ios,android \
  -f webp \
  --padding 0.3 \
  -b edge \
  --optimization light \
  -y
```

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <path>` | Source image path | (required in non-interactive) |
| `-o, --output <path>` | Output directory | `./AppImages` |
| `-p, --platforms <list>` | Comma-separated: `ios,android,windows11,favicon` | ios,android,windows11 |
| `-f, --format <fmt>` | `png`, `jpg`, `webp`, `avif` | `png` |
| `--padding <0-1>` | Padding ratio | `0.3` |
| `-b, --background <color>` | `edge`, `transparent`, or hex color | `edge` |
| `--optimization <level>` | `none`, `light`, `heavy` | `light` |
| `-y, --yes` | Skip confirmation prompts | `false` |

## Advanced Usage

### CI/CD Pipeline

Generate icons in a GitHub Actions workflow:

```yaml
- name: Generate PWA Icons
  run: npx pwa-icons -i ./src/logo.png -o ./public/icons -y
```

### Generate Only Favicons

```bash
npx pwa-icons -i logo.png -p favicon -y
```

### Maximum Compression (WebP)

```bash
npx pwa-icons -i logo.png -f webp --optimization heavy -y
```

### Transparent Background (for PNG/WebP/AVIF)

```bash
npx pwa-icons -i logo.png -b transparent -f png -y
```

### Custom Brand Color Background

```bash
npx pwa-icons -i logo.png -b "#1a1a2e" -y
```

### No Padding (Icon Fills Entire Canvas)

```bash
npx pwa-icons -i logo.png --padding 0 -y
```

### iOS + Android Only (Skip Windows)

```bash
npx pwa-icons -i logo.png -p ios,android -y
```

### All Platforms Including Favicon

```bash
npx pwa-icons -i logo.png -p ios,android,windows11,favicon -y
```

## Supported Formats

### Input Formats

| Format | Extension |
|--------|-----------|
| PNG | `.png` |
| JPEG | `.jpg`, `.jpeg` |
| WebP | `.webp` |
| AVIF | `.avif` |
| SVG | `.svg` |
| GIF | `.gif` |
| TIFF | `.tiff` |

### Output Formats

| Format | Transparency | Best For |
|--------|--------------|----------|
| **PNG** | ✅ | Maximum compatibility |
| **WebP** | ✅ | Modern browsers, ~8x smaller |
| **AVIF** | ✅ | Next-gen, smallest files |
| **JPEG** | ❌ | Universal support |

## Background Options

### Edge Detection (Recommended)

Samples 1px from all four edges of your image and calculates the average color. This creates seamless backgrounds that naturally extend your image.

```bash
-b edge
```

### Transparent

Only available for PNG, WebP, and AVIF:

```bash
-b transparent
```

### Custom Color

Any hex color:

```bash
-b "#ff6b6b"
-b "#fff"
```

## Optimization Levels

| Level | PNG | JPEG | WebP | AVIF |
|-------|-----|------|------|------|
| `none` | compression: 4 | quality: 90 | lossless | quality: 85 |
| `light` | compression: 6 | quality: 85, mozjpeg | quality: 85 | quality: 75 |
| `heavy` | compression: 9, palette | quality: 75, mozjpeg | quality: 75 | quality: 60 |

### File Size Comparison (512×512 icon)

| Format | Optimization | Size |
|--------|--------------|------|
| PNG | light | ~34 KB |
| WebP | heavy | ~4 KB |
| AVIF | heavy | ~3 KB |

## Output Structure

```
AppImages/
├── ios/
│   ├── 16.png
│   ├── 20.png
│   ├── ...
│   └── 1024.png          # 26 icons
├── android/
│   ├── android-launchericon-48-48.png
│   ├── android-launchericon-72-72.png
│   ├── ...
│   └── android-launchericon-512-512.png  # 6 icons
├── windows11/
│   ├── SmallTile.scale-100.png
│   ├── Square150x150Logo.scale-100.png
│   ├── LargeTile.scale-100.png
│   ├── SplashScreen.scale-100.png
│   ├── Square44x44Logo.targetsize-16.png
│   ├── Square44x44Logo.altform-unplated_targetsize-16.png
│   ├── ...
│   └── (80 icons total)
├── favicon/
│   ├── favicon.ico       # Multi-size (16, 32, 48)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-48x48.png
│   ├── favicon-192x192.png
│   └── apple-touch-icon.png  # 180x180
└── icons.json            # PWA manifest-ready
```

### icons.json

Ready to use in your `manifest.json`:

```json
{
  "icons": [
    {
      "src": "ios/512.png",
      "sizes": "512x512"
    },
    {
      "src": "android/android-launchericon-192-192.png",
      "sizes": "192x192"
    }
  ]
}
```

## Platform Breakdown

### iOS (26 icons)

Sizes: 16, 20, 29, 32, 40, 50, 57, 58, 60, 64, 72, 76, 80, 87, 100, 114, 120, 128, 144, 152, 167, 180, 192, 256, 512, 1024

Covers: iPhone, iPad, App Store, Spotlight, Settings

### Android (6 icons)

| Density | Size |
|---------|------|
| mdpi | 48×48 |
| hdpi | 72×72 |
| xhdpi | 96×96 |
| xxhdpi | 144×144 |
| xxxhdpi | 192×192 |
| Play Store | 512×512 |

### Windows 11 (80 icons)

| Type | Scales | Count |
|------|--------|-------|
| SmallTile | 100, 125, 150, 200, 400 | 5 |
| Square150x150Logo | 100, 125, 150, 200, 400 | 5 |
| Wide310x150Logo | 100, 125, 150, 200, 400 | 5 |
| LargeTile | 100, 125, 150, 200, 400 | 5 |
| Square44x44Logo | 100, 125, 150, 200, 400 | 5 |
| StoreLogo | 100, 125, 150, 200, 400 | 5 |
| SplashScreen | 100, 125, 150, 200, 400 | 5 |
| Square44x44Logo.targetsize | 16-256 (15 sizes) | 15 |
| Square44x44Logo.altform-unplated | 16-256 (15 sizes) | 15 |
| Square44x44Logo.altform-lightunplated | 16-256 (15 sizes) | 15 |

### Favicon (6 files)

| File | Size | Purpose |
|------|------|---------|
| favicon.ico | 16, 32, 48 | Classic favicon (multi-size ICO) |
| favicon-16x16.png | 16×16 | Modern browsers |
| favicon-32x32.png | 32×32 | Modern browsers, HiDPI |
| favicon-48x48.png | 48×48 | Windows site icons |
| favicon-192x192.png | 192×192 | Android Chrome |
| apple-touch-icon.png | 180×180 | iOS home screen |

## Performance

- **118 icons** in **~0.7 seconds** (all platforms including favicon)
- 10 concurrent operations via [p-limit](https://github.com/sindresorhus/p-limit)
- Source image processed once, buffer reused
- [Sharp](https://sharp.pixelplumbing.com/) (libvips) for native-speed processing

## Test Coverage

| Metric | Coverage |
|--------|----------|
| Functions | 100% |
| Lines | 99.33% |
| Tests | 92 |

```bash
bun test --coverage
```

## Requirements

- **Bun** v1.0.0+
- **Source image**: Square, minimum 256×256px (512×512+ recommended)

## Scripts

```bash
bun run start       # Run CLI
bun run dev         # Run with watch mode
bun run build       # Compile to single binary
bun run typecheck   # TypeScript check
```

## Build Binary

Create a standalone executable:

```bash
bun run build
./dist/pwa-icons -i logo.png -y
```

## Tech Stack

| Package | Purpose |
|---------|---------|
| [sharp](https://sharp.pixelplumbing.com/) | Image processing (libvips) |
| [@clack/prompts](https://github.com/natemoo-re/clack) | Beautiful interactive prompts |
| [commander](https://github.com/tj/commander.js) | CLI argument parsing |
| [chalk](https://github.com/chalk/chalk) | Terminal styling |
| [p-limit](https://github.com/sindresorhus/p-limit) | Concurrency control |

## Inspired By

- [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Vercel's add-skill CLI](https://github.com/vercel-labs/add-skill)

## See Also

If you need features like **iOS device-specific splash screens**, **dark mode splash screens**, **maskable icons**, or **HTML/CSS input**, check out [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) — it uses Puppeteer/Chromium for browser-based rendering.

This package (`pwa-icons`) is a lightweight, faster alternative using Sharp/libvips for most common use cases.

## License

MIT
