import * as fs from "fs";
import * as path from "path";
import { FigmaClient, DesignToken } from "../src/figma/figma-client";

/**
 * Exports design tokens from a Figma file and converts them
 * into a Power BI compatible theme JSON.
 *
 * Usage: npm run export-figma
 *
 * Prerequisites:
 *   - Set FIGMA_ACCESS_TOKEN in .env
 *   - Set FIGMA_FILE_KEY in .env (from your Figma file URL)
 */

async function main() {
  console.log("Connecting to Figma API...");

  const client = new FigmaClient();

  console.log("Extracting color tokens...");
  const colorTokens = await client.extractColorTokens();

  console.log(`Found ${colorTokens.length} color tokens`);

  // Group colors by name prefix (e.g., "primary/500" -> "primary")
  const groupedColors: Record<string, DesignToken[]> = {};
  for (const token of colorTokens) {
    const group = token.name.split("/")[0];
    if (!groupedColors[group]) {
      groupedColors[group] = [];
    }
    groupedColors[group].push(token);
  }

  // Build design tokens output
  const designTokens = {
    $description: `Auto-exported from Figma on ${new Date().toISOString()}`,
    colors: Object.fromEntries(
      Object.entries(groupedColors).map(([group, tokens]) => [
        group,
        Object.fromEntries(
          tokens.map((t) => [t.name.split("/")[1] || "default", t.value])
        ),
      ])
    ),
  };

  const tokensPath = path.resolve(__dirname, "../figma/design-tokens.json");
  fs.writeFileSync(tokensPath, JSON.stringify(designTokens, null, 2));
  console.log(`Design tokens saved to ${tokensPath}`);

  // Convert to Power BI theme
  const dataColors = colorTokens
    .filter((t) => t.name.toLowerCase().includes("data") || t.name.toLowerCase().includes("chart"))
    .slice(0, 10)
    .map((t) => t.value as string);

  if (dataColors.length < 2) {
    console.log(
      "Not enough chart-specific colors found, using first 10 unique colors..."
    );
    const uniqueColors = [...new Set(colorTokens.map((t) => t.value as string))];
    dataColors.push(...uniqueColors.slice(0, 10 - dataColors.length));
  }

  const primaryColor = colorTokens.find(
    (t) => t.name.toLowerCase().includes("primary") && t.name.includes("600")
  );

  const powerbiTheme = {
    name: "Figma-Synced Theme",
    dataColors: dataColors.slice(0, 10),
    background: "#FFFFFF",
    foreground: "#1E293B",
    tableAccent: (primaryColor?.value as string) || "#2563EB",
  };

  const themePath = path.resolve(__dirname, "../themes/figma-synced-theme.json");
  fs.writeFileSync(themePath, JSON.stringify(powerbiTheme, null, 2));
  console.log(`Power BI theme saved to ${themePath}`);

  // Get file styles
  console.log("Fetching Figma file styles...");
  const styles = await client.getFileStyles();
  console.log(`Found ${Object.keys(styles).length} styles in the Figma file`);

  console.log("\nDone! Files generated:");
  console.log(`  - ${tokensPath}`);
  console.log(`  - ${themePath}`);
}

main().catch(console.error);
