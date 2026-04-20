import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

// Provider selection:
//   APIFY_TOKEN set  -> call canadesk/yahoo-finance actor (robust, handles cookies)
//   otherwise        -> yahoo-finance2 npm lib (may fail in restricted networks)
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = "canadesk~yahoo-finance";
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;

interface TickerEntry {
  bbgTicker: string;
  yahoo: string | null;
  name: string;
  country: string;
  note: string;
}

interface ConnectorConfig {
  universe: {
    tickers: TickerEntry[];
  };
}

interface FetchResult {
  bbgTicker: string;
  yahoo: string | null;
  name: string;
  country: string;
  currency?: string;
  totalDebt?: number;
  equity?: number;
  debtToEquityPct?: number;
  rawBeta?: number;
  taxRate?: number;
  unleveredBeta?: number;
  price?: number;
  marketCap?: number;
  status: "ok" | "skipped" | "error";
  note?: string;
  error?: string;
  asOf?: string;
}

// Statutory corporate tax rates (2025) used for unlevered beta calc.
const COUNTRY_TAX: Record<string, number> = {
  GREECE: 0.22,
  MALTA: 0.35,
  BRITAIN: 0.25,
  SWEDEN: 0.206,
  GERMANY: 0.3,
  IRELAND: 0.125,
};

function unlever(rawBeta: number | undefined, de: number | undefined, t: number): number | undefined {
  if (rawBeta === undefined || de === undefined) return undefined;
  return rawBeta / (1 + (1 - t) * de);
}

async function fetchViaApify(symbol: string): Promise<any> {
  // Apify canadesk/yahoo-finance actor input shape (see actor README).
  const input = {
    symbols: [symbol],
    modules: [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "balanceSheetHistory",
    ],
  };
  const res = await axios.post(APIFY_RUN_URL, input, {
    params: { token: APIFY_TOKEN, timeout: 60 },
    timeout: 90_000,
  });
  const items = Array.isArray(res.data) ? res.data : [];
  if (!items.length) throw new Error("Apify actor returned no items");
  // Actor typically returns a flat object per symbol or a nested quoteSummary.
  const first = items[0];
  return first.quoteSummary ?? first;
}

async function fetchQuoteSummary(symbol: string): Promise<any> {
  if (APIFY_TOKEN) {
    return fetchViaApify(symbol);
  }
  return yahooFinance.quoteSummary(symbol, {
    modules: [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "balanceSheetHistory",
    ],
  });
}

async function fetchOne(entry: TickerEntry): Promise<FetchResult> {
  const base: FetchResult = {
    bbgTicker: entry.bbgTicker,
    yahoo: entry.yahoo,
    name: entry.name,
    country: entry.country,
    status: "skipped",
    note: entry.note,
  };

  if (!entry.yahoo) {
    return { ...base, status: "skipped", note: `No Yahoo symbol — ${entry.note}` };
  }

  try {
    const qs = (await fetchQuoteSummary(entry.yahoo)) as any;

    const bs = qs.balanceSheetHistory?.balanceSheetStatements?.[0];
    const totalDebt =
      qs.financialData?.totalDebt ??
      bs?.longTermDebt ??
      bs?.totalLiab;
    const equity = bs?.totalStockholderEquity;
    const de = qs.financialData?.debtToEquity; // already in percent
    const rawBeta = qs.defaultKeyStatistics?.beta;
    const taxRate = COUNTRY_TAX[entry.country] ?? 0.25;

    const debtToEquityDecimal = de !== undefined ? de / 100 : undefined;
    const unlevered = unlever(rawBeta, debtToEquityDecimal, taxRate);

    return {
      ...base,
      status: "ok",
      currency: qs.price?.currency ?? undefined,
      price: qs.price?.regularMarketPrice ?? undefined,
      marketCap: qs.price?.marketCap ?? undefined,
      totalDebt,
      equity,
      debtToEquityPct: de,
      rawBeta,
      taxRate,
      unleveredBeta: unlevered,
      asOf: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ...base,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function fmt(v: number | undefined, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "-";
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(digits) + "B";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(digits) + "M";
  return v.toFixed(digits);
}

function printTable(results: FetchResult[]): void {
  const rows = results.map((r) => ({
    ticker: r.bbgTicker.replace(" Equity", ""),
    yahoo: r.yahoo ?? "-",
    ccy: r.currency ?? "-",
    debt: fmt(r.totalDebt),
    equity: fmt(r.equity),
    de: r.debtToEquityPct !== undefined ? r.debtToEquityPct.toFixed(0) + "%" : "-",
    beta: r.rawBeta !== undefined ? r.rawBeta.toFixed(2) : "-",
    tax: r.taxRate !== undefined ? (r.taxRate * 100).toFixed(0) + "%" : "-",
    uBeta: r.unleveredBeta !== undefined ? r.unleveredBeta.toFixed(2) : "-",
    status: r.status,
  }));

  const header = ["Ticker", "YahooSym", "Ccy", "Debt", "Equity", "D/E", "Beta", "Tax", "UBeta", "Status"];
  const widths = header.map((h, i) => {
    const colKeys = ["ticker", "yahoo", "ccy", "debt", "equity", "de", "beta", "tax", "uBeta", "status"] as const;
    const maxRow = Math.max(...rows.map((r) => String(r[colKeys[i]]).length));
    return Math.max(h.length, maxRow);
  });

  const line = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
  console.log(line(header));
  console.log(widths.map((w) => "-".repeat(w)).join("-+-"));
  for (const r of rows) {
    console.log(
      line([r.ticker, r.yahoo, r.ccy, r.debt, r.equity, r.de, r.beta, r.tax, r.uBeta, r.status])
    );
  }
}

async function main(): Promise<void> {
  const configPath = path.join(__dirname, "..", "connectors", "yahoo-finance.json");
  const config: ConnectorConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  console.log(
    `Provider: ${APIFY_TOKEN ? "apify (canadesk/yahoo-finance)" : "yahoo-finance2 (direct)"}`
  );

  // Silence the deprecated-survey notice (available in v3).
  (yahooFinance as any).suppressNotices?.(["yahooSurvey"]);

  const results: FetchResult[] = [];
  for (const entry of config.universe.tickers) {
    const r = await fetchOne(entry);
    results.push(r);
    // polite throttle
    await new Promise((res) => setTimeout(res, 400));
  }

  const outPath = path.join(__dirname, "data", "yahoo-finance-snapshot.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
  );

  printTable(results);
  console.log(`\nSaved snapshot → ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
