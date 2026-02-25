import * as fs from "fs";
import * as path from "path";
import { FigmaClient } from "../src/figma/figma-client";

/**
 * Pushes NBIM design tokens to Figma as local variables.
 *
 * Creates three variable collections in your Figma file:
 *   - "NBIM / Colors"    — all color tokens (primary, accent, semantic, bg, border, text)
 *   - "NBIM / Spacing"   — spacing and border-radius tokens
 *   - "NBIM / Typography" — font sizes as floats, font families as strings
 *
 * Usage: npm run push-figma
 *
 * Prerequisites:
 *   - FIGMA_ACCESS_TOKEN in .env (needs write access to the file)
 *   - FIGMA_FILE_KEY in .env
 */

interface TokenFile {
  colors: {
    primary: Record<string, string>;
    accent: Record<string, string>;
    semantic: Record<string, string>;
    background: Record<string, string>;
    border: Record<string, string>;
    text: Record<string, string>;
  };
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, number>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  dataVisualization: {
    sequential: string[];
    categorical: string[];
    diverging: string[];
    positiveNegative: string[];
    heatmap: Record<string, string>;
  };
}

function flattenColors(colors: TokenFile["colors"]): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [group, values] of Object.entries(colors)) {
    for (const [key, hex] of Object.entries(values)) {
      flat[`${group}/${key}`] = hex;
    }
  }

  return flat;
}

function flattenDataVizColors(dataViz: TokenFile["dataVisualization"]): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [i, hex] of dataViz.sequential.entries()) {
    flat[`data-viz/sequential/${i}`] = hex;
  }
  for (const [i, hex] of dataViz.categorical.entries()) {
    flat[`data-viz/categorical/${i}`] = hex;
  }
  for (const [i, hex] of dataViz.diverging.entries()) {
    flat[`data-viz/diverging/${i}`] = hex;
  }
  for (const [i, hex] of dataViz.positiveNegative.entries()) {
    flat[`data-viz/positive-negative/${i}`] = hex;
  }
  for (const [key, hex] of Object.entries(dataViz.heatmap)) {
    flat[`data-viz/heatmap/${key}`] = hex;
  }

  return flat;
}

async function main() {
  const tokensPath = path.resolve(__dirname, "../figma/nbim-design-tokens.json");
  if (!fs.existsSync(tokensPath)) {
    console.error(`Token file not found: ${tokensPath}`);
    process.exit(1);
  }

  const tokens: TokenFile = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));
  const client = new FigmaClient();

  console.log("Pushing NBIM design tokens to Figma...\n");

  // ─── 1. Colors ───
  console.log("1/3  Colors");
  const allColors: Record<string, string> = {
    ...flattenColors(tokens.colors),
    ...flattenDataVizColors(tokens.dataVisualization),
  };
  const colorResult = await client.pushColorVariables("NBIM / Colors", allColors);
  console.log(
    `     Created ${colorResult.created}, updated ${colorResult.updated} color variables\n`
  );

  // ─── 2. Spacing + Border Radius ───
  console.log("2/3  Spacing & Radii");
  const spacingValues: Record<string, number> = {};
  for (const [key, val] of Object.entries(tokens.spacing)) {
    spacingValues[`spacing/${key}`] = val;
  }
  for (const [key, val] of Object.entries(tokens.borderRadius)) {
    spacingValues[`border-radius/${key}`] = val;
  }
  const spacingResult = await client.pushFloatVariables("NBIM / Spacing", spacingValues);
  console.log(
    `     Created ${spacingResult.created}, updated ${spacingResult.updated} spacing variables\n`
  );

  // ─── 3. Typography ───
  console.log("3/3  Typography");

  // Font sizes + weights + line heights as floats
  const typoFloats: Record<string, number> = {};
  for (const [key, val] of Object.entries(tokens.typography.fontSize)) {
    typoFloats[`font-size/${key}`] = val;
  }
  for (const [key, val] of Object.entries(tokens.typography.fontWeight)) {
    typoFloats[`font-weight/${key}`] = val;
  }
  for (const [key, val] of Object.entries(tokens.typography.lineHeight)) {
    typoFloats[`line-height/${key}`] = val;
  }
  const typoFloatResult = await client.pushFloatVariables("NBIM / Typography", typoFloats);

  // Font families as strings
  const typoStrings: Record<string, string> = {};
  for (const [key, val] of Object.entries(tokens.typography.fontFamily)) {
    typoStrings[`font-family/${key}`] = val;
  }
  const typoStringResult = await client.pushStringVariables("NBIM / Typography", typoStrings);

  console.log(
    `     Created ${typoFloatResult.created + typoStringResult.created}, ` +
    `updated ${typoFloatResult.updated + typoStringResult.updated} typography variables\n`
  );

  // ─── Summary ───
  const totalCreated = colorResult.created + spacingResult.created + typoFloatResult.created + typoStringResult.created;
  const totalUpdated = colorResult.updated + spacingResult.updated + typoFloatResult.updated + typoStringResult.updated;

  console.log("Done!");
  console.log(`  Total: ${totalCreated} created, ${totalUpdated} updated`);
  console.log(`  Collections: "NBIM / Colors", "NBIM / Spacing", "NBIM / Typography"`);
  console.log(`  Open your Figma file to see the variables in the Local Variables panel.`);
}

main().catch((err) => {
  console.error("Failed to push tokens to Figma:", err.message || err);
  process.exit(1);
});
