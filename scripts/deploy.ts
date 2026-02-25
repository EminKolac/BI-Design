import * as fs from "fs";
import * as path from "path";
import { PowerBIClient } from "../src/powerbi/api-client";

/**
 * Deploy themes and report configurations to Power BI Service.
 *
 * Usage: npm run deploy
 *
 * Prerequisites:
 *   - Set Azure credentials in .env
 *   - Set POWERBI_WORKSPACE_ID and POWERBI_REPORT_ID in .env
 */

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "status";

  const client = new PowerBIClient();

  switch (command) {
    case "status": {
      console.log("Fetching workspace info...\n");
      const workspaces = await client.listWorkspaces();
      console.log("Workspaces:");
      workspaces.forEach((ws) => console.log(`  - ${ws.name} (${ws.id})`));

      const reports = await client.listReports();
      console.log("\nReports:");
      reports.forEach((r) => console.log(`  - ${r.name} (${r.id})`));

      const datasets = await client.listDatasets();
      console.log("\nDatasets:");
      datasets.forEach((d) =>
        console.log(`  - ${d.name} (${d.id}) [refreshable: ${d.isRefreshable}]`)
      );
      break;
    }

    case "apply-theme": {
      const themeName = args[1] || "default-theme";
      const reportId = args[2] || process.env.POWERBI_REPORT_ID;
      const themePath = path.resolve(
        __dirname,
        `../themes/${themeName}.json`
      );

      if (!fs.existsSync(themePath)) {
        console.error(`Theme file not found: ${themePath}`);
        console.error("Available themes:");
        const themes = fs.readdirSync(path.resolve(__dirname, "../themes"));
        themes.forEach((t) => console.error(`  - ${t.replace(".json", "")}`));
        process.exit(1);
      }

      if (!reportId) {
        console.error("Report ID required. Set POWERBI_REPORT_ID or pass as argument.");
        process.exit(1);
      }

      console.log(`Applying theme "${themeName}" to report ${reportId}...`);
      await client.applyTheme(reportId, themePath);
      console.log("Theme applied successfully!");
      break;
    }

    case "refresh": {
      const datasetId = args[1];
      if (!datasetId) {
        console.error("Dataset ID required. Usage: deploy refresh <dataset-id>");
        process.exit(1);
      }
      console.log(`Triggering refresh for dataset ${datasetId}...`);
      await client.refreshDataset(datasetId);
      console.log("Refresh triggered!");
      break;
    }

    case "export": {
      const reportId = args[1] || process.env.POWERBI_REPORT_ID;
      const format = (args[2] as "PDF" | "PPTX" | "PNG") || "PDF";

      if (!reportId) {
        console.error("Report ID required.");
        process.exit(1);
      }

      console.log(`Exporting report ${reportId} as ${format}...`);
      const buffer = await client.exportReport(reportId, format);
      const outputPath = path.resolve(
        __dirname,
        `../exports/report.${format.toLowerCase()}`
      );

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buffer);
      console.log(`Report exported to ${outputPath}`);
      break;
    }

    case "clone": {
      const reportId = args[1] || process.env.POWERBI_REPORT_ID;
      const newName = args[2] || `Report-Clone-${Date.now()}`;

      if (!reportId) {
        console.error("Report ID required.");
        process.exit(1);
      }

      console.log(`Cloning report ${reportId} as "${newName}"...`);
      const cloned = await client.cloneReport(reportId, newName);
      console.log(`Report cloned! New ID: ${cloned.id}`);
      break;
    }

    default:
      console.log("Power BI Deploy Tool\n");
      console.log("Commands:");
      console.log("  status                        - Show workspaces, reports, datasets");
      console.log("  apply-theme <theme> [report]  - Apply a theme to a report");
      console.log("  refresh <dataset-id>          - Trigger dataset refresh");
      console.log("  export [report] [PDF|PPTX|PNG]- Export report to file");
      console.log("  clone [report] [name]         - Clone a report");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
