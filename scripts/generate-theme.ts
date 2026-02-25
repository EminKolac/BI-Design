import * as fs from "fs";
import * as path from "path";

/**
 * Generates a Power BI theme JSON from design tokens.
 *
 * Usage: npm run generate-theme
 *
 * Reads figma/design-tokens.json and produces a complete
 * Power BI theme file ready for import.
 */

interface DesignTokens {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    neutral: Record<string, string>;
    background: Record<string, string>;
  };
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, number>;
    fontWeight: Record<string, number>;
  };
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, { offset: number; blur: number; opacity: number }>;
  dataVisualization: {
    sequential: string[];
    diverging: string[];
    categorical: string[];
  };
}

function generatePowerBITheme(tokens: DesignTokens, variant: "light" | "dark" = "light") {
  const isDark = variant === "dark";

  const bg = isDark ? tokens.colors.neutral["900"] : tokens.colors.background.page;
  const cardBg = isDark ? tokens.colors.neutral["800"] : tokens.colors.background.card;
  const fg = isDark ? tokens.colors.neutral["50"] : tokens.colors.neutral["800"];
  const muted = isDark ? tokens.colors.neutral["400"] : tokens.colors.neutral["500"];
  const border = isDark ? tokens.colors.neutral["700"] : tokens.colors.neutral["200"];

  return {
    name: `BI-Design ${variant.charAt(0).toUpperCase() + variant.slice(1)} Theme (Generated)`,
    dataColors: tokens.dataVisualization.categorical,
    background: bg,
    foreground: fg,
    tableAccent: tokens.colors.primary["600"],
    maximum: tokens.colors.error.default,
    center: tokens.colors.warning.default,
    minimum: tokens.colors.success.default,
    good: tokens.colors.success.default,
    neutral: tokens.colors.warning.default,
    bad: tokens.colors.error.default,
    textClasses: {
      callout: {
        fontSize: tokens.typography.fontSize["3xl"],
        fontFace: tokens.typography.fontFamily.secondary,
        color: fg,
      },
      title: {
        fontSize: tokens.typography.fontSize.lg,
        fontFace: tokens.typography.fontFamily.secondary,
        color: fg,
      },
      header: {
        fontSize: tokens.typography.fontSize.base,
        fontFace: tokens.typography.fontFamily.secondary,
        color: muted,
      },
      label: {
        fontSize: tokens.typography.fontSize.sm,
        fontFace: tokens.typography.fontFamily.primary,
        color: muted,
      },
    },
    visualStyles: {
      "*": {
        "*": {
          background: [
            {
              color: { solid: { color: cardBg } },
              transparency: 0,
            },
          ],
          border: [
            {
              color: { solid: { color: border } },
              radius: tokens.borderRadius.md,
            },
          ],
          dropShadow: [
            {
              show: true,
              color: { solid: { color: "#000000" } },
              position: "Outer",
              preset: "BottomRight",
              transparency: isDark ? 70 : 90,
              offset: tokens.shadows.md.offset,
            },
          ],
          title: [
            {
              show: true,
              fontColor: { solid: { color: fg } },
              fontSize: tokens.typography.fontSize.base,
              fontFamily: tokens.typography.fontFamily.secondary,
              alignment: "left",
            },
          ],
        },
      },
      page: {
        "*": {
          background: [
            {
              color: { solid: { color: bg } },
              transparency: 0,
            },
          ],
        },
      },
    },
  };
}

function main() {
  const tokensPath = path.resolve(__dirname, "../figma/design-tokens.json");

  if (!fs.existsSync(tokensPath)) {
    console.error(`Design tokens not found at ${tokensPath}`);
    console.error("Run 'npm run export-figma' first, or use the default tokens.");
    process.exit(1);
  }

  const tokens: DesignTokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));

  // Generate light theme
  const lightTheme = generatePowerBITheme(tokens, "light");
  const lightPath = path.resolve(__dirname, "../themes/generated-light-theme.json");
  fs.writeFileSync(lightPath, JSON.stringify(lightTheme, null, 2));
  console.log(`Light theme saved to ${lightPath}`);

  // Generate dark theme
  const darkTheme = generatePowerBITheme(tokens, "dark");
  const darkPath = path.resolve(__dirname, "../themes/generated-dark-theme.json");
  fs.writeFileSync(darkPath, JSON.stringify(darkTheme, null, 2));
  console.log(`Dark theme saved to ${darkPath}`);

  console.log("\nThemes generated successfully from design tokens!");
}

main();
