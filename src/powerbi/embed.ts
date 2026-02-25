import * as powerbi from "powerbi-client";
import { PowerBIClient } from "./api-client";

interface EmbedConfig {
  reportId: string;
  containerElementId: string;
  theme?: "default" | "dark";
  pageNavigation?: boolean;
  filterPaneEnabled?: boolean;
}

/**
 * Power BI Embedded report configuration generator.
 * Use this to generate the config needed for embedding reports in web apps.
 */
export class PowerBIEmbed {
  private apiClient: PowerBIClient;

  constructor() {
    this.apiClient = new PowerBIClient();
  }

  async generateEmbedConfig(config: EmbedConfig): Promise<powerbi.IEmbedConfiguration> {
    const report = await this.apiClient.getReport(config.reportId);
    const embedToken = await this.apiClient.generateEmbedToken(config.reportId);

    return {
      type: "report",
      id: report.id,
      embedUrl: report.embedUrl,
      accessToken: embedToken.token,
      tokenType: powerbi.models.TokenType.Embed,
      settings: {
        panes: {
          filters: {
            visible: config.filterPaneEnabled ?? false,
          },
          pageNavigation: {
            visible: config.pageNavigation ?? true,
          },
        },
        background: powerbi.models.BackgroundType.Transparent,
        layoutType: powerbi.models.LayoutType.Custom,
        customLayout: {
          displayOption: powerbi.models.DisplayOption.FitToWidth,
        },
      },
    };
  }

  generateEmbedHTML(containerId: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Power BI Embedded Report</title>
    <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.min.js"></script>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        #${containerId} {
            width: 100vw;
            height: 100vh;
        }
        .toolbar {
            position: fixed;
            top: 0;
            right: 0;
            padding: 12px;
            z-index: 100;
            display: flex;
            gap: 8px;
        }
        .toolbar button {
            padding: 8px 16px;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            background: #FFFFFF;
            cursor: pointer;
            font-size: 13px;
            color: #475569;
        }
        .toolbar button:hover {
            background: #F1F5F9;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="toggleFullscreen()">Fullscreen</button>
        <button onclick="printReport()">Print</button>
        <button onclick="refreshData()">Refresh</button>
    </div>
    <div id="${containerId}"></div>
    <script>
        // This config should be populated from your server-side embed config
        const embedConfig = window.__POWERBI_EMBED_CONFIG__;

        const powerbiClient = new powerbi.service.Service(
            powerbi.factories.hpmFactory,
            powerbi.factories.wpmpFactory,
            powerbi.factories.routerFactory
        );

        const container = document.getElementById('${containerId}');
        const report = powerbiClient.embed(container, embedConfig);

        report.on('loaded', function() {
            console.log('Report loaded');
        });

        report.on('error', function(event) {
            console.error('Embed error:', event.detail);
        });

        function toggleFullscreen() {
            report.fullscreen();
        }

        function printReport() {
            report.print();
        }

        function refreshData() {
            report.refresh();
        }
    </script>
</body>
</html>`;
  }
}
