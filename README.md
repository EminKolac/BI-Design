# BI-Design

Investment fund Power BI report inspired by [Norges Bank Investment Management](https://www.nbim.no/en/investments/all-investments/) (NBIM). Features a dark theme, fund portfolio data model, and NBIM-style "All Investments" layout.

## Project Structure

```
BI-Design/
├── themes/
│   ├── nbim-theme.json              # NBIM dark theme (primary)
│   ├── default-theme.json           # Light theme alternative
│   └── dark-theme.json              # Generic dark theme
├── designs/
│   ├── nbim-report-layout.json      # 4-page NBIM-style report layout
│   └── report-layout.json           # Generic 3-page report layout
├── connectors/
│   ├── investment-fund.json         # Investment fund star schema
│   ├── sql-server.json              # SQL Server connection
│   ├── rest-api.json                # REST API with pagination
│   ├── excel-csv.json               # Excel/CSV file sources
│   ├── sharepoint.json              # SharePoint Online lists
│   └── yahoo-finance.json           # Yahoo Finance equity fundamentals
├── figma/
│   ├── nbim-design-tokens.json      # NBIM-style design tokens
│   └── design-tokens.json           # Generic design tokens
├── src/
│   ├── powerbi/
│   │   ├── api-client.ts            # Power BI REST API client
│   │   ├── nbim-embed.ts            # NBIM-style embed with dark HTML
│   │   ├── nbim-measures.ts         # Investment fund DAX measures
│   │   ├── embed.ts                 # Generic embedded report config
│   │   └── measures.ts              # Generic DAX measures
│   └── figma/
│       └── figma-client.ts          # Figma API integration
└── scripts/
    ├── deploy.ts                    # Deploy themes & manage reports
    ├── export-figma-tokens.ts       # Export tokens from Figma
    ├── generate-theme.ts            # Generate themes from tokens
    ├── validate-theme.ts            # Validate theme JSON files
    └── fetch-yahoo-finance.ts       # Pull equity fundamentals from Yahoo Finance
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run validate-theme
```

## NBIM-Style Design

The report follows the design language of Norges Bank Investment Management:

- **Black background** (#000000) with white text
- **Norway Blue accent** (#00205B) for data visualization
- **Segoe UI Light** for large KPI numbers (36px, weight 300)
- **Segoe UI** for body text, **Segoe UI Semibold** for headers
- **Minimal borders** (#1A1A2E) — no drop shadows, no rounded corners
- **Gold accent** (#C4A35A) for totals and highlights
- **Muted grey labels** (#7A8B99) for secondary information

### Theme

Import `themes/nbim-theme.json` into Power BI Desktop:
1. **View** > **Themes** > **Browse for themes**
2. Select `nbim-theme.json`

### Report Pages

The `designs/nbim-report-layout.json` defines a 4-page report (1440x900):

| Page | Content |
|------|---------|
| **All Investments** | Filter bar (year, country, asset class, sector, search), 4 KPI cards (fund value, companies, countries, return), full-width holdings data table with pagination |
| **Asset Allocation** | Allocation KPIs by asset class, donut chart, stacked bar over time, geographic map, top 10 countries bar chart |
| **Returns** | Return KPIs (annual, since inception, NOK bn, relative), cumulative return line chart, annual return by asset class, return matrix with conditional formatting |
| **Sectors** | Full-width treemap of sectors, sector detail table with companies count, market value, fund share, return, and YoY change |

### Data Model

The `connectors/investment-fund.json` defines a star schema:

| Table | Type | Description |
|-------|------|-------------|
| **Holdings** | Fact | Individual investment holdings per company per period |
| **Returns** | Fact | Fund return data by period and asset class |
| **Allocation** | Fact | Asset allocation breakdown |
| **Geography** | Dimension | Countries and regions |
| **AssetClass** | Dimension | Equities, Fixed Income, Real Estate, Infrastructure |
| **Sector** | Dimension | Industry sectors (GICS-based) |
| **Date** | Dimension | Time periods |

### DAX Measures (26 measures)

| Folder | Measures |
|--------|----------|
| **Fund Overview** | Fund Market Value, Fund Value NOK Bn, Number of Companies/Countries/Sectors |
| **Holdings** | Market Value NOK/USD, Voting Share %, Ownership %, Allocation %, YoY Change %, Top 10 Holdings Value/Share |
| **Allocation** | Equity %, Fixed Income %, Real Estate %, Infrastructure % |
| **Returns** | Annual Return, Return Since Inception, Cumulative Return, Return NOK Bn, Relative Return, Benchmark Return |
| **Geographic** | Country Allocation %, Region Allocation % |

### Design Tokens

`figma/nbim-design-tokens.json` contains the full token set:
- Color palette (primary blues, gold accent, semantic colors, backgrounds, borders, text)
- Typography (display/primary/bold/mono fonts, 10 size steps)
- Component specs (filter dropdowns, data tables, KPI cards, charts)

## Figma Integration

Sync design tokens from Figma to maintain consistency:

```bash
# Set credentials in .env
FIGMA_ACCESS_TOKEN=your-token
FIGMA_FILE_KEY=your-file-key

# Export and generate theme
npm run export-figma
npm run generate-theme
```

## Yahoo Finance Equity Fundamentals

Used to audit Bigdata.com values and to fill gaps for tickers Bigdata does not
cover (e.g. Angler Gaming `ANGL.ST`, Winvia Entertainment `WVIA.L`). The
connector config lists each Bloomberg ticker from the gaming/lottery peer set
with its Yahoo equivalent, country, and any corporate-action notes (rebrands,
delistings, acquisitions).

```bash
npm run fetch-yahoo
```

The script pulls `quoteSummary` (price, summaryDetail, defaultKeyStatistics,
financialData, balanceSheetHistory), recomputes unlevered beta with the
country statutory tax rate, prints a summary table, and writes a JSON snapshot
to `scripts/data/yahoo-finance-snapshot.json`.

Delisted tickers (`ASPIRE SS`, `NLAB SS`, `LO24 GR`) are flagged `skipped` in
the snapshot with a recommended replacement peer in the note field.

## Deploy

```bash
npm run deploy -- status                              # List workspaces/reports
npm run deploy -- apply-theme nbim-theme <report-id>  # Apply NBIM theme
npm run deploy -- export <report-id> PDF              # Export as PDF
npm run deploy -- refresh <dataset-id>                # Refresh data
```
