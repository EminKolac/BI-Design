import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";

/**
 * Validates Power BI theme JSON files against the expected schema.
 *
 * Usage: npm run validate-theme
 */

const themeSchema = {
  type: "object",
  required: ["name", "dataColors"],
  properties: {
    name: { type: "string", minLength: 1 },
    dataColors: {
      type: "array",
      items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
      minItems: 1,
      maxItems: 12,
    },
    background: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    foreground: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    tableAccent: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    maximum: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    center: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    minimum: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    good: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    neutral: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    bad: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    textClasses: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          fontSize: { type: "number", minimum: 6, maximum: 72 },
          fontFace: { type: "string" },
          color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        },
      },
    },
    visualStyles: { type: "object" },
  },
};

function main() {
  const themesDir = path.resolve(__dirname, "../themes");
  const files = fs
    .readdirSync(themesDir)
    .filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No theme files found in themes/ directory.");
    return;
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(themeSchema);

  let allValid = true;

  for (const file of files) {
    const filePath = path.join(themesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const valid = validate(content);

    if (valid) {
      console.log(`  [PASS] ${file} - "${content.name}" (${content.dataColors?.length || 0} data colors)`);
    } else {
      allValid = false;
      console.log(`  [FAIL] ${file}`);
      for (const err of validate.errors || []) {
        console.log(`         - ${err.instancePath || "root"}: ${err.message}`);
      }
    }
  }

  console.log("");
  if (allValid) {
    console.log("All themes are valid!");
  } else {
    console.log("Some themes have validation errors. Please fix them before deploying.");
    process.exit(1);
  }
}

main();
