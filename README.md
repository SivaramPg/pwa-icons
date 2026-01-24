# PWA Asset Generator

A fast, interactive CLI to generate PWA icons for **iOS**, **Android**, and **Windows 11** from a single source image.

Built with [Bun](https://bun.sh), [Sharp](https://sharp.pixelplumbing.com/), and [@clack/prompts](https://github.com/natemoo-re/clack).

## Features

- **Interactive prompts** — No need to remember flags
- **112 icons** generated in under 1 second
- **Smart edge detection** — Samples border pixels for seamless backgrounds
- **Multiple output formats** — PNG, WebP, AVIF, JPEG
- **Optimization levels** — Balance quality vs file size
- **Platform selection** — Generate only what you need

## Quick Start

```bash
# Run interactively
bun run start

# Or with flags
bun run start -i logo.png -o ./icons -y
```

## Installation

### Prerequisites

- [Bun](https://bun.sh) v1.0.0 or later

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/pwa-asset-generator.git
cd pwa-asset-generator

# Install dependencies
bun install

# Run
bun run start
```

### Global Installation

```bash
# Link globally
bun link

# Now use from anywhere
pwa-icons
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
| `-p, --platforms <list>` | Comma-separated: `ios,android,windows11` | all |
| `-f, --format <fmt>` | `png`, `jpg`, `webp`, `avif` | `png` |
| `--padding <0-1>` | Padding ratio | `0.3` |
| `-b, --background <color>` | `edge`, `transparent`, or hex color | `edge` |
| `--optimization <level>` | `none`, `light`, `heavy` | `light` |
| `-y, --yes` | Skip confirmation prompts | `false` |

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

## Performance

- **112 icons** in **~0.6 seconds**
- 10 concurrent operations via [p-limit](https://github.com/sindresorhus/p-limit)
- Source image processed once, buffer reused
- [Sharp](https://sharp.pixelplumbing.com/) (libvips) for native-speed processing

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
./dist/pwa-asset-generator -i logo.png -y
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

## License

MIT
