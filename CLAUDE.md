# pwa-icons

A CLI tool to generate PWA icons for iOS, Android, Windows 11, and favicons.

## Commands

```bash
bun run start       # Run CLI interactively
bun run start -i logo.png -y  # Non-interactive with flags
bun run typecheck   # TypeScript check
bun run build       # Compile to binary
```

## Architecture

```
src/
  index.ts          # CLI entry point (@clack/prompts + commander)
  generator.ts      # Icon generation logic (sharp + p-limit)
  color.ts          # Edge color extraction
  types.ts          # TypeScript types + constants
  platforms/
    ios.ts          # 26 icon sizes
    android.ts      # 6 icon sizes
    windows11.ts    # 80 icon variants
    favicon.ts      # 6 favicon files
```

## Key Design Decisions

1. **Edge detection over dominant color** — Samples 1px borders for natural background extension
2. **Source buffer reuse** — Load once, generate 118 icons from same buffer
3. **p-limit(10)** — Prevents memory spikes during parallel generation
4. **Conditional transparency** — JPEG format hides "transparent" option in prompts

## Testing

```bash
bun test              # Run all tests (86 tests)
bun test --watch      # Watch mode
bun test --coverage   # Coverage report
```

### Manual Testing

```bash
# Quick test
bun run start -i logo.png -o test-output -p ios -y

# Full test (all platforms)
bun run start -i logo.png -o test-output -y
```

### Test Structure

```
tests/
  setup.ts              # Fixture generation (test images)
  fixtures/             # Generated test images
  unit/
    color.test.ts       # 12 tests
    generator.test.ts   # 20 tests
    platforms.test.ts   # 8 tests
  integration/
    cli.test.ts         # 15 tests
```
