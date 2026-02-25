/**
 * DAX measure definitions for the Power BI report.
 * These can be imported into Power BI Desktop or via the XMLA endpoint.
 */

export interface DAXMeasure {
  name: string;
  table: string;
  expression: string;
  formatString?: string;
  description?: string;
  folder?: string;
}

export const measures: DAXMeasure[] = [
  // Revenue Measures
  {
    name: "Total Revenue",
    table: "Sales",
    expression: `SUM(Sales[TotalAmount])`,
    formatString: "$#,##0",
    description: "Sum of all sales revenue",
    folder: "Revenue",
  },
  {
    name: "Revenue YoY %",
    table: "Sales",
    expression: `
      VAR CurrentYear = [Total Revenue]
      VAR PreviousYear = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR('Date'[Date]))
      RETURN
        DIVIDE(CurrentYear - PreviousYear, PreviousYear, 0)
    `,
    formatString: "0.0%",
    description: "Year-over-year revenue growth percentage",
    folder: "Revenue",
  },
  {
    name: "Revenue MTD",
    table: "Sales",
    expression: `TOTALMTD([Total Revenue], 'Date'[Date])`,
    formatString: "$#,##0",
    description: "Month-to-date revenue",
    folder: "Revenue",
  },
  {
    name: "Revenue YTD",
    table: "Sales",
    expression: `TOTALYTD([Total Revenue], 'Date'[Date])`,
    formatString: "$#,##0",
    description: "Year-to-date revenue",
    folder: "Revenue",
  },
  {
    name: "Running Total Revenue",
    table: "Sales",
    expression: `
      CALCULATE(
        [Total Revenue],
        FILTER(
          ALL('Date'[Date]),
          'Date'[Date] <= MAX('Date'[Date])
        )
      )
    `,
    formatString: "$#,##0",
    description: "Cumulative running total of revenue",
    folder: "Revenue",
  },

  // Profit Measures
  {
    name: "Gross Profit",
    table: "Sales",
    expression: `SUM(Sales[Profit])`,
    formatString: "$#,##0",
    description: "Total gross profit",
    folder: "Profit",
  },
  {
    name: "Profit Margin",
    table: "Sales",
    expression: `DIVIDE([Gross Profit], [Total Revenue], 0)`,
    formatString: "0.0%",
    description: "Profit as percentage of revenue",
    folder: "Profit",
  },

  // Order Measures
  {
    name: "Order Count",
    table: "Sales",
    expression: `DISTINCTCOUNT(Sales[SalesID])`,
    formatString: "#,##0",
    description: "Count of unique orders",
    folder: "Orders",
  },
  {
    name: "Average Order Value",
    table: "Sales",
    expression: `DIVIDE([Total Revenue], [Order Count], 0)`,
    formatString: "$#,##0.00",
    description: "Average revenue per order",
    folder: "Orders",
  },
  {
    name: "Units Sold",
    table: "Sales",
    expression: `SUM(Sales[Quantity])`,
    formatString: "#,##0",
    description: "Total units sold",
    folder: "Orders",
  },

  // Customer Measures
  {
    name: "Total Customers",
    table: "Customers",
    expression: `DISTINCTCOUNT(Sales[CustomerID])`,
    formatString: "#,##0",
    description: "Count of unique customers with purchases",
    folder: "Customers",
  },
  {
    name: "New Customers",
    table: "Customers",
    expression: `
      VAR CurrentPeriodCustomers =
        CALCULATETABLE(
          VALUES(Sales[CustomerID]),
          DATESINPERIOD('Date'[Date], MAX('Date'[Date]), -1, MONTH)
        )
      VAR PriorCustomers =
        CALCULATETABLE(
          VALUES(Sales[CustomerID]),
          DATESBETWEEN('Date'[Date], BLANK(), MIN('Date'[Date]) - 1)
        )
      RETURN
        COUNTROWS(EXCEPT(CurrentPeriodCustomers, PriorCustomers))
    `,
    formatString: "#,##0",
    description: "Customers making their first purchase in the current period",
    folder: "Customers",
  },
  {
    name: "Avg Lifetime Value",
    table: "Customers",
    expression: `DIVIDE([Total Revenue], [Total Customers], 0)`,
    formatString: "$#,##0.00",
    description: "Average revenue per customer",
    folder: "Customers",
  },
  {
    name: "Retention Rate",
    table: "Customers",
    expression: `
      VAR CurrentMonthCustomers =
        CALCULATETABLE(VALUES(Sales[CustomerID]))
      VAR PreviousMonthCustomers =
        CALCULATETABLE(
          VALUES(Sales[CustomerID]),
          PREVIOUSMONTH('Date'[Date])
        )
      VAR RetainedCustomers =
        COUNTROWS(INTERSECT(CurrentMonthCustomers, PreviousMonthCustomers))
      RETURN
        DIVIDE(RetainedCustomers, COUNTROWS(PreviousMonthCustomers), 0)
    `,
    formatString: "0.0%",
    description: "Percentage of customers retained from previous month",
    folder: "Customers",
  },
];

/**
 * Export measures as a TMSL (Tabular Model Scripting Language) command
 * for importing into Power BI via XMLA endpoint.
 */
export function toTMSL(
  databaseName: string,
  measuresToExport: DAXMeasure[] = measures
): string {
  const createCommands = measuresToExport.map((m) => ({
    createOrReplace: {
      object: {
        database: databaseName,
        table: m.table,
        measure: m.name,
      },
      measure: {
        name: m.name,
        expression: m.expression.trim(),
        formatString: m.formatString,
        description: m.description,
        displayFolder: m.folder,
      },
    },
  }));

  return JSON.stringify({ sequence: { operations: createCommands } }, null, 2);
}
