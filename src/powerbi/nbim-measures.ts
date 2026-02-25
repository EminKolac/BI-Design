/**
 * DAX measures for an NBIM-style investment fund report.
 * Covers holdings, returns, allocation, and geographic distribution.
 */

import { DAXMeasure, toTMSL } from "./measures";

export const nbimMeasures: DAXMeasure[] = [
  // ─── Fund Value ───
  {
    name: "Fund Market Value",
    table: "Holdings",
    expression: `SUM(Holdings[MarketValueNOK])`,
    formatString: "#,##0",
    description: "Total fund market value in NOK",
    folder: "Fund Overview",
  },
  {
    name: "Fund Market Value USD",
    table: "Holdings",
    expression: `SUM(Holdings[MarketValueUSD])`,
    formatString: "$#,##0",
    description: "Total fund market value in USD",
    folder: "Fund Overview",
  },
  {
    name: "Fund Value NOK Bn",
    table: "Holdings",
    expression: `DIVIDE(SUM(Holdings[MarketValueNOK]), 1000000000, 0)`,
    formatString: "#,##0",
    description: "Fund value in billions of NOK",
    folder: "Fund Overview",
  },
  {
    name: "Number of Companies",
    table: "Holdings",
    expression: `DISTINCTCOUNT(Holdings[CompanyName])`,
    formatString: "#,##0",
    description: "Unique companies in portfolio",
    folder: "Fund Overview",
  },
  {
    name: "Number of Countries",
    table: "Holdings",
    expression: `DISTINCTCOUNT(Geography[Country])`,
    formatString: "#,##0",
    description: "Countries with investments",
    folder: "Fund Overview",
  },
  {
    name: "Number of Sectors",
    table: "Holdings",
    expression: `DISTINCTCOUNT(Sector[Name])`,
    formatString: "#,##0",
    description: "Distinct sectors invested in",
    folder: "Fund Overview",
  },

  // ─── Holdings Detail ───
  {
    name: "Market Value NOK",
    table: "Holdings",
    expression: `SUM(Holdings[MarketValueNOK])`,
    formatString: "#,##0",
    description: "Market value of holding in NOK",
    folder: "Holdings",
  },
  {
    name: "Market Value USD",
    table: "Holdings",
    expression: `SUM(Holdings[MarketValueUSD])`,
    formatString: "$#,##0",
    description: "Market value of holding in USD",
    folder: "Holdings",
  },
  {
    name: "Voting Share Pct",
    table: "Holdings",
    expression: `AVERAGE(Holdings[VotingSharePct])`,
    formatString: "0.00%",
    description: "Voting shares percentage",
    folder: "Holdings",
  },
  {
    name: "Ownership Pct",
    table: "Holdings",
    expression: `AVERAGE(Holdings[OwnershipPct])`,
    formatString: "0.00%",
    description: "Fund ownership percentage",
    folder: "Holdings",
  },
  {
    name: "Allocation Pct",
    table: "Holdings",
    expression: `
      DIVIDE(
        SUM(Holdings[MarketValueNOK]),
        CALCULATE(SUM(Holdings[MarketValueNOK]), ALL(Holdings)),
        0
      )
    `,
    formatString: "0.0%",
    description: "Share of total fund value",
    folder: "Holdings",
  },
  {
    name: "YoY Change Pct",
    table: "Holdings",
    expression: `
      VAR CurrentValue = SUM(Holdings[MarketValueNOK])
      VAR PreviousValue =
        CALCULATE(
          SUM(Holdings[MarketValueNOK]),
          DATEADD('Date'[Date], -1, YEAR)
        )
      RETURN
        DIVIDE(CurrentValue - PreviousValue, PreviousValue, 0)
    `,
    formatString: "0.0%",
    description: "Year-over-year change in market value",
    folder: "Holdings",
  },

  // ─── Allocation ───
  {
    name: "Equity Pct",
    table: "Allocation",
    expression: `
      DIVIDE(
        CALCULATE(SUM(Allocation[MarketValue]), AssetClass[Name] = "Equities"),
        SUM(Allocation[MarketValue]),
        0
      )
    `,
    formatString: "0.0%",
    description: "Equity allocation as percentage of fund",
    folder: "Allocation",
  },
  {
    name: "Fixed Income Pct",
    table: "Allocation",
    expression: `
      DIVIDE(
        CALCULATE(SUM(Allocation[MarketValue]), AssetClass[Name] = "Fixed Income"),
        SUM(Allocation[MarketValue]),
        0
      )
    `,
    formatString: "0.0%",
    description: "Fixed income allocation as percentage of fund",
    folder: "Allocation",
  },
  {
    name: "Real Estate Pct",
    table: "Allocation",
    expression: `
      DIVIDE(
        CALCULATE(SUM(Allocation[MarketValue]), AssetClass[Name] = "Unlisted Real Estate"),
        SUM(Allocation[MarketValue]),
        0
      )
    `,
    formatString: "0.0%",
    description: "Real estate allocation as percentage of fund",
    folder: "Allocation",
  },
  {
    name: "Infrastructure Pct",
    table: "Allocation",
    expression: `
      DIVIDE(
        CALCULATE(SUM(Allocation[MarketValue]), AssetClass[Name] = "Renewable Energy Infrastructure"),
        SUM(Allocation[MarketValue]),
        0
      )
    `,
    formatString: "0.0%",
    description: "Renewable infrastructure allocation as percentage of fund",
    folder: "Allocation",
  },

  // ─── Returns ───
  {
    name: "Annual Return",
    table: "Returns",
    expression: `AVERAGE(Returns[AnnualReturnPct])`,
    formatString: "0.0%",
    description: "Annual return percentage",
    folder: "Returns",
  },
  {
    name: "Return Since Inception",
    table: "Returns",
    expression: `
      VAR LastDate = MAX('Date'[Date])
      RETURN
        CALCULATE(
          MAX(Returns[CumulativeReturnPct]),
          'Date'[Date] = LastDate
        )
    `,
    formatString: "0.0%",
    description: "Cumulative return since 1998",
    folder: "Returns",
  },
  {
    name: "Cumulative Return Pct",
    table: "Returns",
    expression: `MAX(Returns[CumulativeReturnPct])`,
    formatString: "0.0%",
    description: "Cumulative return percentage",
    folder: "Returns",
  },
  {
    name: "Return Value NOK Bn",
    table: "Returns",
    expression: `DIVIDE(SUM(Returns[ReturnValueNOK]), 1000000000, 0)`,
    formatString: "#,##0",
    description: "Total return in billions of NOK",
    folder: "Returns",
  },
  {
    name: "Relative Return",
    table: "Returns",
    expression: `AVERAGE(Returns[RelativeReturnPct])`,
    formatString: "0.00%",
    description: "Return relative to benchmark",
    folder: "Returns",
  },
  {
    name: "Benchmark Return",
    table: "Returns",
    expression: `AVERAGE(Returns[BenchmarkReturnPct])`,
    formatString: "0.0%",
    description: "Benchmark return percentage",
    folder: "Returns",
  },

  // ─── Geographic ───
  {
    name: "Country Allocation Pct",
    table: "Holdings",
    expression: `
      DIVIDE(
        SUM(Holdings[MarketValueNOK]),
        CALCULATE(SUM(Holdings[MarketValueNOK]), ALL(Geography)),
        0
      )
    `,
    formatString: "0.0%",
    description: "Investment share per country",
    folder: "Geographic",
  },
  {
    name: "Region Allocation Pct",
    table: "Holdings",
    expression: `
      DIVIDE(
        SUM(Holdings[MarketValueNOK]),
        CALCULATE(SUM(Holdings[MarketValueNOK]), ALL(Geography[Region])),
        0
      )
    `,
    formatString: "0.0%",
    description: "Investment share per region",
    folder: "Geographic",
  },

  // ─── Top Holdings ───
  {
    name: "Top 10 Holdings Value",
    table: "Holdings",
    expression: `
      CALCULATE(
        SUM(Holdings[MarketValueNOK]),
        TOPN(
          10,
          ALL(Holdings[CompanyName]),
          CALCULATE(SUM(Holdings[MarketValueNOK]))
        )
      )
    `,
    formatString: "#,##0",
    description: "Combined value of top 10 holdings",
    folder: "Holdings",
  },
  {
    name: "Top 10 Share of Fund",
    table: "Holdings",
    expression: `
      DIVIDE(
        [Top 10 Holdings Value],
        CALCULATE(SUM(Holdings[MarketValueNOK]), ALL(Holdings)),
        0
      )
    `,
    formatString: "0.0%",
    description: "Top 10 holdings as percentage of total fund",
    folder: "Holdings",
  },
];

export function exportNBIMMeasures(databaseName: string): string {
  return toTMSL(databaseName, nbimMeasures);
}
