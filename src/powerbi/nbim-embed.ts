import * as powerbi from "powerbi-client";
import { PowerBIClient } from "./api-client";

/**
 * NBIM-style embedded report with dark theme, custom styling,
 * and investment-specific interactivity.
 */
export class NBIMEmbed {
  private apiClient: PowerBIClient;

  constructor() {
    this.apiClient = new PowerBIClient();
  }

  async generateEmbedConfig(reportId: string): Promise<powerbi.IEmbedConfiguration> {
    const report = await this.apiClient.getReport(reportId);
    const embedToken = await this.apiClient.generateEmbedToken(reportId);

    return {
      type: "report",
      id: report.id,
      embedUrl: report.embedUrl,
      accessToken: embedToken.token,
      tokenType: powerbi.models.TokenType.Embed,
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: true, position: powerbi.models.PageNavigationPosition.Left },
        },
        background: powerbi.models.BackgroundType.Transparent,
        layoutType: powerbi.models.LayoutType.Custom,
        customLayout: {
          displayOption: powerbi.models.DisplayOption.FitToWidth,
        },
      },
    };
  }

  generateEmbedHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Investments</title>
    <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg-page: #000000;
            --bg-card: #0A0A0A;
            --bg-elevated: #111111;
            --bg-input: #0D0D1A;
            --bg-hover: #0A0A1E;
            --border: #1A1A2E;
            --text-primary: #FFFFFF;
            --text-secondary: #A3B5C4;
            --text-muted: #7A8B99;
            --accent-blue: #00205B;
            --accent-blue-light: #0056B3;
            --accent-gold: #C4A35A;
            --positive: #4CAF50;
            --negative: #E74C3C;
        }

        body {
            background: var(--bg-page);
            color: var(--text-primary);
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
        }

        /* ─── Navigation ─── */
        .nav {
            display: flex;
            align-items: center;
            padding: 0 60px;
            height: 64px;
            border-bottom: 1px solid var(--border);
        }

        .nav-logo {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            letter-spacing: 0.5px;
        }

        .nav-links {
            display: flex;
            gap: 32px;
            margin-left: 60px;
            list-style: none;
        }

        .nav-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 13px;
            padding: 20px 0;
            border-bottom: 2px solid transparent;
            transition: color 0.2s, border-color 0.2s;
        }

        .nav-links a:hover,
        .nav-links a.active {
            color: var(--text-primary);
            border-bottom-color: var(--text-primary);
        }

        /* ─── Page Header ─── */
        .page-header {
            padding: 48px 60px 32px;
        }

        .page-header h1 {
            font-size: 28px;
            font-weight: 300;
            color: var(--text-primary);
            font-family: 'Segoe UI Light', 'Segoe UI', sans-serif;
        }

        .page-header p {
            margin-top: 8px;
            font-size: 13px;
            color: var(--text-muted);
        }

        /* ─── Filter Bar ─── */
        .filter-bar {
            display: flex;
            gap: 16px;
            padding: 0 60px 24px;
            flex-wrap: wrap;
            align-items: center;
        }

        .filter-dropdown {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 10px 36px 10px 14px;
            font-size: 12px;
            font-family: 'Segoe UI', sans-serif;
            appearance: none;
            cursor: pointer;
            min-width: 180px;
            border-radius: 2px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237A8B99' stroke-width='1.5'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
        }

        .filter-dropdown:hover {
            border-color: var(--accent-blue-light);
        }

        .filter-dropdown option {
            background: var(--bg-elevated);
            color: var(--text-primary);
        }

        .search-input {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 10px 14px;
            font-size: 12px;
            font-family: 'Segoe UI', sans-serif;
            flex: 1;
            max-width: 300px;
            border-radius: 2px;
        }

        .search-input::placeholder { color: #555555; }
        .search-input:focus { outline: none; border-color: var(--accent-blue-light); }

        /* ─── KPI Row ─── */
        .kpi-row {
            display: flex;
            gap: 48px;
            padding: 24px 60px 32px;
        }

        .kpi-item {
            display: flex;
            flex-direction: column;
        }

        .kpi-value {
            font-size: 36px;
            font-weight: 300;
            font-family: 'Segoe UI Light', 'Segoe UI', sans-serif;
            color: var(--text-primary);
            line-height: 1.2;
        }

        .kpi-label {
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }

        /* ─── Divider ─── */
        .divider {
            height: 1px;
            background: var(--border);
            margin: 0 60px;
        }

        /* ─── Data Table ─── */
        .data-table-container {
            padding: 0 60px;
            overflow-x: auto;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        .data-table thead th {
            text-align: left;
            padding: 14px 16px;
            font-weight: 400;
            font-size: 10px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
            position: sticky;
            top: 0;
            background: var(--bg-page);
            cursor: pointer;
        }

        .data-table thead th:hover {
            color: var(--text-secondary);
        }

        .data-table thead th.align-right {
            text-align: right;
        }

        .data-table tbody tr {
            border-bottom: 1px solid var(--bg-input);
            transition: background 0.15s;
        }

        .data-table tbody tr:hover {
            background: var(--bg-hover);
        }

        .data-table tbody td {
            padding: 12px 16px;
            color: var(--text-primary);
            font-size: 12px;
            white-space: nowrap;
        }

        .data-table tbody td.align-right {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }

        .data-table tbody td.company {
            font-weight: 400;
        }

        .data-table tbody td.country {
            color: var(--text-secondary);
        }

        /* ─── Pagination ─── */
        .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 60px 48px;
        }

        .pagination-info {
            font-size: 11px;
            color: var(--text-muted);
        }

        .pagination-controls {
            display: flex;
            gap: 4px;
        }

        .pagination-controls button {
            background: none;
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
            border-radius: 2px;
            font-family: 'Segoe UI', sans-serif;
        }

        .pagination-controls button:hover {
            color: var(--text-primary);
            border-color: var(--text-muted);
        }

        .pagination-controls button.active {
            color: var(--text-primary);
            border-color: var(--text-primary);
        }

        /* ─── Power BI Embed Container ─── */
        #reportContainer {
            width: 100%;
            height: calc(100vh - 64px);
            background: var(--bg-page);
        }

        /* ─── Footer ─── */
        .footer {
            padding: 32px 60px;
            border-top: 1px solid var(--border);
            font-size: 11px;
            color: var(--text-muted);
        }

        /* ─── Positive/Negative Values ─── */
        .value-positive { color: var(--positive); }
        .value-negative { color: var(--negative); }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
            .nav, .page-header, .filter-bar, .kpi-row,
            .data-table-container, .pagination, .footer {
                padding-left: 24px;
                padding-right: 24px;
            }

            .divider { margin: 0 24px; }

            .kpi-row {
                flex-wrap: wrap;
                gap: 24px;
            }

            .kpi-value { font-size: 28px; }
        }
    </style>
</head>
<body>
    <nav class="nav">
        <span class="nav-logo">Investment Fund</span>
        <ul class="nav-links">
            <li><a href="#" class="active">All investments</a></li>
            <li><a href="#">Asset allocation</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Sectors</a></li>
        </ul>
    </nav>

    <div class="page-header">
        <h1>All investments</h1>
        <p>Search in all of the fund's investments by country, asset class, and sector.</p>
    </div>

    <div class="filter-bar">
        <select class="filter-dropdown" id="yearFilter">
            <option value="">Year</option>
        </select>
        <select class="filter-dropdown" id="countryFilter">
            <option value="">Country</option>
        </select>
        <select class="filter-dropdown" id="assetClassFilter">
            <option value="">Asset class</option>
        </select>
        <select class="filter-dropdown" id="sectorFilter">
            <option value="">Sector</option>
        </select>
        <input type="text" class="search-input" placeholder="Search company name..." id="searchInput">
    </div>

    <div class="kpi-row">
        <div class="kpi-item">
            <span class="kpi-value" id="kpiFundValue">--</span>
            <span class="kpi-label">Fund value (NOK bn)</span>
        </div>
        <div class="kpi-item">
            <span class="kpi-value" id="kpiCompanies">--</span>
            <span class="kpi-label">Companies</span>
        </div>
        <div class="kpi-item">
            <span class="kpi-value" id="kpiCountries">--</span>
            <span class="kpi-label">Countries</span>
        </div>
        <div class="kpi-item">
            <span class="kpi-value" id="kpiReturn">--</span>
            <span class="kpi-label">Return</span>
        </div>
    </div>

    <div class="divider"></div>

    <div class="data-table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Country</th>
                    <th>Asset class</th>
                    <th>Sector</th>
                    <th class="align-right">Voting shares (%)</th>
                    <th class="align-right">Market value (NOK)</th>
                    <th class="align-right">Market value (USD)</th>
                </tr>
            </thead>
            <tbody id="holdingsTableBody">
                <!-- Rows populated by Power BI embedded or JS -->
            </tbody>
        </table>
    </div>

    <div class="pagination">
        <span class="pagination-info" id="paginationInfo">Showing 1-25 of 7,200 investments</span>
        <div class="pagination-controls">
            <button>&laquo;</button>
            <button class="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>...</button>
            <button>288</button>
            <button>&raquo;</button>
        </div>
    </div>

    <div class="footer">
        Data as of 31 December 2024. Source: Fund annual report.
    </div>

    <script>
        // Power BI Embedded initialization
        if (window.__POWERBI_EMBED_CONFIG__) {
            const container = document.createElement('div');
            container.id = 'reportContainer';
            document.body.innerHTML = '';
            document.body.appendChild(container);

            const powerbiClient = new powerbi.service.Service(
                powerbi.factories.hpmFactory,
                powerbi.factories.wpmpFactory,
                powerbi.factories.routerFactory
            );

            const report = powerbiClient.embed(container, window.__POWERBI_EMBED_CONFIG__);

            report.on('loaded', function() {
                console.log('NBIM report loaded');
            });
        }
    </script>
</body>
</html>`;
  }
}
