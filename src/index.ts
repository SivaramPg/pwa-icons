import { program } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { resolve } from "path";
import { existsSync } from "fs";
import { generateIcons, validateImage } from "./generator";
import { isValidHexColor, normalizeHexColor } from "./color";
import {
  SUPPORTED_INPUT_FORMATS,
  FORMATS_WITH_TRANSPARENCY,
  type Platform,
  type OutputFormat,
  type OptimizationLevel,
} from "./types";

const version = "1.1.3";

interface CliOptions {
  input?: string;
  output?: string;
  platforms?: string;
  padding?: string;
  background?: string;
  format?: string;
  optimization?: string;
  yes?: boolean;
}

program
  .name("pwa-asset-generator")
  .description("Generate PWA icons for iOS, Android, and Windows 11")
  .version(version)
  .option("-i, --input <path>", "Path to source image (256x256 minimum, square)")
  .option("-o, --output <path>", "Output directory (default: ./AppImages)")
  .option(
    "-p, --platforms <platforms>",
    "Comma-separated platforms: ios,android,windows11,favicon (default: ios,android,windows11)"
  )
  .option("--padding <value>", "Padding ratio 0-1 (default: 0.3)")
  .option(
    "-b, --background <color>",
    'Background: "transparent", "edge", or hex color (default: edge)'
  )
  .option("-f, --format <format>", "Output format: png, jpg, webp, avif (default: png)")
  .option(
    "--optimization <level>",
    "Optimization level: none, light, heavy (default: light)"
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (options: CliOptions) => {
    await main(options);
  });

program.parse();

async function main(options: CliOptions) {
  console.log();
  p.intro(chalk.bgMagenta.white(" PWA Asset Generator "));

  let inputPath: string;
  let outputPath: string;
  let platforms: Platform[];
  let padding: number;
  let backgroundColor: string;
  let outputFormat: OutputFormat;
  let optimization: OptimizationLevel;

  // Interactive mode if no input provided
  const isInteractive = !options.input;

  if (isInteractive) {
    // === Input Image ===
    const supportedFormatsStr = SUPPORTED_INPUT_FORMATS.join(", ");
    const inputResult = await p.text({
      message: `Path to your source image`,
      placeholder: "./logo.png",
      defaultValue: "./logo.png",
      validate: (value) => {
        if (!value) return "Please enter a path";
        const resolved = resolve(value);
        if (!existsSync(resolved)) return `File not found: ${resolved}`;
        return undefined;
      },
    });

    if (p.isCancel(inputResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    inputPath = resolve(inputResult);

    // Validate image
    const spinner = p.spinner();
    spinner.start("Validating image...");

    const validation = await validateImage(inputPath);
    if (!validation.valid) {
      spinner.stop(chalk.red("Invalid image"));
      p.log.error(validation.error!);
      p.log.info(chalk.dim(`Supported formats: ${supportedFormatsStr}`));
      process.exit(1);
    }

    spinner.stop(
      chalk.green(
        `Valid image: ${validation.width}x${validation.height}px (${validation.format})`
      )
    );

    // === Output Directory ===
    const outputResult = await p.text({
      message: "Output directory",
      placeholder: "./AppImages",
      defaultValue: "./AppImages",
    });

    if (p.isCancel(outputResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    outputPath = resolve(outputResult || "./AppImages");

    // === Platforms ===
    const platformsResult = await p.multiselect({
      message: "Select platforms to generate icons for",
      options: [
        { value: "ios", label: "iOS", hint: "26 icons (16-1024px)" },
        { value: "android", label: "Android", hint: "6 icons (48-512px)" },
        {
          value: "windows11",
          label: "Windows 11",
          hint: "~80 icons (tiles, splash, variants)",
        },
        {
          value: "favicon",
          label: "Favicon",
          hint: "6 files (ico, png, apple-touch-icon)",
        },
      ],
      initialValues: ["ios", "android", "windows11"],
      required: true,
    });

    if (p.isCancel(platformsResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    platforms = platformsResult as Platform[];

    // === Output Format ===
    const formatResult = await p.select({
      message: "Output format",
      options: [
        { value: "png", label: "PNG", hint: "Lossless, supports transparency (recommended)" },
        { value: "webp", label: "WebP", hint: "Modern, smaller files, supports transparency" },
        { value: "avif", label: "AVIF", hint: "Next-gen, smallest files, supports transparency" },
        { value: "jpg", label: "JPEG", hint: "Universal, no transparency support" },
      ],
    });

    if (p.isCancel(formatResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    outputFormat = formatResult as OutputFormat;

    // === Padding ===
    const paddingResult = await p.text({
      message: "Padding ratio (0 = no padding, 1 = max padding)",
      placeholder: "0.3",
      defaultValue: "0.3",
      validate: (value) => {
        if (!value) return "Please enter a value";
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 1) {
          return "Please enter a number between 0 and 1";
        }
        return undefined;
      },
    });

    if (p.isCancel(paddingResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    padding = parseFloat(paddingResult || "0.3");

    // === Background Color (conditional on format) ===
    const supportsTransparency = FORMATS_WITH_TRANSPARENCY.includes(outputFormat);

    const bgOptions = supportsTransparency
      ? [
          {
            value: "edge",
            label: "Edge detection",
            hint: "Sample colors from image edges (recommended)",
          },
          { value: "transparent", label: "Transparent" },
          { value: "custom", label: "Custom color", hint: "Enter a hex color" },
        ]
      : [
          {
            value: "edge",
            label: "Edge detection",
            hint: "Sample colors from image edges (recommended)",
          },
          { value: "custom", label: "Custom color", hint: "Enter a hex color" },
        ];

    const bgResult = await p.select({
      message: supportsTransparency
        ? "Background color"
        : "Background color (JPEG doesn't support transparency)",
      options: bgOptions,
    });

    if (p.isCancel(bgResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    if (bgResult === "custom") {
      const colorResult = await p.text({
        message: "Enter hex color",
        placeholder: "#ffffff",
        validate: (value) => {
          if (!value) return "Please enter a color";
          const normalized = normalizeHexColor(value);
          if (!isValidHexColor(normalized)) {
            return "Please enter a valid hex color (e.g., #ff0000 or #f00)";
          }
          return undefined;
        },
      });

      if (p.isCancel(colorResult)) {
        p.cancel("Cancelled");
        process.exit(0);
      }

      backgroundColor = normalizeHexColor(colorResult);
    } else {
      backgroundColor = bgResult as string;
    }

    // === Optimization ===
    const optimizationResult = await p.select({
      message: "Optimization level",
      options: [
        { value: "light", label: "Light (Recommended)", hint: "Good balance of quality and size" },
        { value: "none", label: "None", hint: "Maximum quality, larger files" },
        { value: "heavy", label: "Heavy", hint: "Smallest files, some quality loss" },
      ],
    });

    if (p.isCancel(optimizationResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    optimization = optimizationResult as OptimizationLevel;
  } else {
    // Non-interactive mode - use flags
    inputPath = resolve(options.input!);

    // Validate image
    const validation = await validateImage(inputPath);
    if (!validation.valid) {
      p.log.error(validation.error!);
      p.log.info(chalk.dim(`Supported formats: ${SUPPORTED_INPUT_FORMATS.join(", ")}`));
      process.exit(1);
    }

    outputPath = resolve(options.output || "./AppImages");

    // Parse platforms
    if (options.platforms) {
      const requestedPlatforms = options.platforms.split(",").map((p) => p.trim());
      const validPlatforms = ["ios", "android", "windows11", "favicon"];
      const invalid = requestedPlatforms.filter((p) => !validPlatforms.includes(p));
      if (invalid.length > 0) {
        p.log.error(`Invalid platforms: ${invalid.join(", ")}`);
        p.log.info(`Valid platforms: ${validPlatforms.join(", ")}`);
        process.exit(1);
      }
      platforms = requestedPlatforms as Platform[];
    } else {
      platforms = ["ios", "android", "windows11"];
    }

    // Parse format
    if (options.format) {
      const validFormats = ["png", "jpg", "webp", "avif"];
      if (!validFormats.includes(options.format)) {
        p.log.error(`Invalid format: ${options.format}`);
        p.log.info(`Valid formats: ${validFormats.join(", ")}`);
        process.exit(1);
      }
      outputFormat = options.format as OutputFormat;
    } else {
      outputFormat = "png";
    }

    // Parse padding
    padding = parseFloat(options.padding || "0.3");
    if (isNaN(padding) || padding < 0 || padding > 1) {
      p.log.error("Padding must be a number between 0 and 1");
      process.exit(1);
    }

    // Parse background
    if (options.background) {
      if (options.background === "transparent") {
        // Check if format supports transparency
        if (!FORMATS_WITH_TRANSPARENCY.includes(outputFormat)) {
          p.log.warn(
            `${outputFormat.toUpperCase()} doesn't support transparency, using edge detection`
          );
          backgroundColor = "edge";
        } else {
          backgroundColor = "transparent";
        }
      } else if (options.background === "edge") {
        backgroundColor = "edge";
      } else {
        const normalized = normalizeHexColor(options.background);
        if (!isValidHexColor(normalized)) {
          p.log.error("Invalid hex color for background");
          process.exit(1);
        }
        backgroundColor = normalized;
      }
    } else {
      backgroundColor = "edge";
    }

    // Parse optimization
    if (options.optimization) {
      const validLevels = ["none", "light", "heavy"];
      if (!validLevels.includes(options.optimization)) {
        p.log.error(`Invalid optimization level: ${options.optimization}`);
        p.log.info(`Valid levels: ${validLevels.join(", ")}`);
        process.exit(1);
      }
      optimization = options.optimization as OptimizationLevel;
    } else {
      optimization = "light";
    }
  }

  // === Summary ===
  const summaryLines = [
    `${chalk.dim("Input:")} ${inputPath}`,
    `${chalk.dim("Output:")} ${outputPath}`,
    `${chalk.dim("Platforms:")} ${platforms.join(", ")}`,
    `${chalk.dim("Format:")} ${outputFormat.toUpperCase()}`,
    `${chalk.dim("Padding:")} ${padding}`,
    `${chalk.dim("Background:")} ${backgroundColor}`,
    `${chalk.dim("Optimization:")} ${optimization}`,
  ];

  console.log();
  p.note(summaryLines.join("\n"), "Generation Settings");

  if (!options.yes && isInteractive) {
    const confirmed = await p.confirm({
      message: "Proceed with generation?",
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Cancelled");
      process.exit(0);
    }
  }

  // === Generate Icons ===
  const spinner = p.spinner();
  spinner.start("Generating icons...");

  const startTime = Date.now();

  try {
    const result = await generateIcons(
      {
        inputPath,
        outputPath,
        platforms,
        padding,
        backgroundColor,
        outputFormat,
        optimization,
      },
      (current, total, _name) => {
        spinner.message(`Generating icons... (${current}/${total})`);
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    spinner.stop(chalk.green(`Generated ${result.totalIcons} icons in ${duration}s`));

    console.log();
    p.note(
      [
        `${chalk.dim("Total icons:")} ${result.totalIcons}`,
        `${chalk.dim("Format:")} ${result.format.toUpperCase()}`,
        `${chalk.dim("Optimized:")} ${result.optimized ? "Yes" : "No"}`,
        `${chalk.dim("Output:")} ${result.outputPath}`,
        `${chalk.dim("Manifest:")} ${result.outputPath}/icons.json`,
      ].join("\n"),
      chalk.green("Success!")
    );
  } catch (err) {
    spinner.stop(chalk.red("Generation failed"));
    p.log.error(err instanceof Error ? err.message : "Unknown error");
    process.exit(1);
  }

  console.log();
  p.outro(chalk.green("Done!"));
}
