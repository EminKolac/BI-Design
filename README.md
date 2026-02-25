# BI-Design

Power BI report design project with theme management, Figma integration, data connectors, and embedded analytics.

## Project Structure

```
BI-Design/
├── themes/                    # Power BI theme JSON files
│   ├── default-theme.json     # Light theme (ready to import)
│   └── dark-theme.json        # Dark theme (ready to import)
├── designs/
│   └── report-layout.json     # 3-page report layout specification
├── connectors/                # Data source connector configs
│   ├── sql-server.json        # SQL Server connection
│   ├── rest-api.json          # REST API with pagination
│   ├── excel-csv.json         # Excel/CSV file sources
│   └── sharepoint.json        # SharePoint Online lists
├── figma/
│   └── design-tokens.json     # Design tokens (colors, typography, spacing)
├── src/
│   ├── powerbi/
│   │   ├── api-client.ts      # Power BI REST API client
│   │   ├── embed.ts           # Embedded report configuration
│   │   └── measures.ts        # DAX measures library
│   └── figma/
│       └── figma-client.ts    # Figma API integration
└── scripts/
    ├── deploy.ts              # Deploy themes & manage reports
    ├── export-figma-tokens.ts # Export tokens from Figma
    ├── generate-theme.ts      # Generate themes from tokens
    └── validate-theme.ts      # Validate theme JSON files
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Validate existing themes
npm run validate-theme

# Generate themes from design tokens
npm run generate-theme
```

## Themes

Import theme files directly into Power BI Desktop:
1. Open Power BI Desktop
2. Go to **View** > **Themes** > **Browse for themes**
3. Select a JSON file from the `themes/` directory

Available themes:
- `default-theme.json` - Clean light theme with blue accent
- `dark-theme.json` - Dark theme for presentations

## Figma Integration

Sync design tokens from your Figma file to keep Power BI reports consistent with your design system:

```bash
# Set your Figma token and file key in .env
FIGMA_ACCESS_TOKEN=your-token
FIGMA_FILE_KEY=your-file-key

# Export tokens and generate a synced theme
npm run export-figma
npm run generate-theme
```

## Data Connectors

Connector configuration files in `connectors/` document the data model:
- **SQL Server** - Star schema with fact/dimension tables and relationships
- **REST API** - Paginated API endpoints with response mapping
- **Excel/CSV** - File-based data imports
- **SharePoint** - SharePoint Online list and document sources

## DAX Measures

Pre-built DAX measures in `src/powerbi/measures.ts`:
- **Revenue**: Total Revenue, YoY %, MTD, YTD, Running Total
- **Profit**: Gross Profit, Profit Margin
- **Orders**: Order Count, Average Order Value, Units Sold
- **Customers**: Total, New, Retention Rate, Lifetime Value

## Deploy & Manage

```bash
# View workspace status
npm run deploy -- status

# Apply a theme to a report
npm run deploy -- apply-theme default-theme <report-id>

# Export report as PDF
npm run deploy -- export <report-id> PDF

# Trigger dataset refresh
npm run deploy -- refresh <dataset-id>
```

## Report Layout

The `designs/report-layout.json` defines a 3-page report (1280x720):

| Page | Content |
|------|---------|
| **Executive Summary** | 4 KPI cards, revenue trend line chart, revenue by region bar chart, sales by category donut, top products table |
| **Sales Analysis** | Multi-slicer filters, area chart over time by category, treemap distribution, sales matrix breakdown |
| **Customer Insights** | Customer KPI cards, segmentation scatter plot, segment bar chart, acquisition trend, geographic distribution map |
