"""
Yahoo Finance - Gaming/Lottery Peer Audit (Google Colab)
=========================================================

Colab'e yapistirip calistir. yfinance ile Bigdata.com verilerini audit eder
ve Bigdata'nin bulamadigi tickerlari (ANGL.ST, WVIA.L) doldurur.

Cikti:
  - Ekrana rapor tablosu
  - /content/yahoo_finance_snapshot.csv
  - /content/yahoo_finance_snapshot.json
"""

# ============================================================
# 1) Kurulum (Colab icin)
# ============================================================
# !pip install -q yfinance pandas requests
# import os; os.environ["APIFY_TOKEN"] = "apify_api_xxx"   # opsiyonel

import json
import os
import time
from datetime import datetime, timezone

import pandas as pd
import requests
import yfinance as yf

# Apify actor fallback (robust in restricted networks).
# Colab: os.environ["APIFY_TOKEN"] = "apify_api_xxx"  before run()
APIFY_TOKEN = os.environ.get("APIFY_TOKEN")
APIFY_URL = "https://api.apify.com/v2/acts/canadesk~yahoo-finance/run-sync-get-dataset-items"


# ============================================================
# 2) Universe - BBG ticker <-> Yahoo ticker esleme
# ============================================================
UNIVERSE = [
    {"bbg": "INLOT GA",  "yahoo": "BYLOT.AT",  "name": "Bally's Intralot (ex-INTRALOT)", "country": "GREECE",  "note": "Re-branded 2025; former INLOT.AT"},
    {"bbg": "OPAP GA",   "yahoo": "OPAP.AT",   "name": "OPAP SA",                        "country": "GREECE",  "note": "Allwyn tender offer Q2 2026"},
    {"bbg": "ANGL SS",   "yahoo": "ANGL.ST",   "name": "Angler Gaming PLC",              "country": "MALTA",   "note": "NGM micro-cap; not on Bigdata"},
    {"bbg": "GMBL US",   "yahoo": "GMBL",      "name": "Esports Entertainment Group",    "country": "MALTA",   "note": "Penny stock, negative equity"},
    {"bbg": "ASPIRE SS", "yahoo": None,        "name": "Aspire Global PLC",              "country": "MALTA",   "note": "Delisted 2022 -> use ALL.AX peer"},
    {"bbg": "BOTB LN",   "yahoo": "WVIA.L",    "name": "Winvia Entertainment (ex-BOTB)", "country": "BRITAIN", "note": "Relisted Nov 2025 as WVIA"},
    {"bbg": "NLAB SS",   "yahoo": None,        "name": "Enlabs AB",                      "country": "SWEDEN",  "note": "Delisted 2021 -> use ENT.L peer"},
    {"bbg": "LO24 GR",   "yahoo": None,        "name": "Lotto24",                        "country": "GERMANY", "note": "Merged into TIMA.DE"},
    {"bbg": "TIMA GR",   "yahoo": "TIMA.DE",   "name": "Zeal Network SE",                "country": "GERMANY", "note": "Lotto24 parent"},
    {"bbg": "BETSB SS",  "yahoo": "BETS-B.ST", "name": "Betsson AB",                     "country": "SWEDEN",  "note": "Reports in EUR despite SEK ticker"},
    {"bbg": "FLTR ID",   "yahoo": "FLUT",      "name": "Flutter Entertainment",          "country": "IRELAND", "note": "Primary listing moved to NYSE May 2024"},
]

# 2025 kurumlar vergisi oranlari (unlevered beta hesabi icin)
COUNTRY_TAX = {
    "GREECE":  0.22,
    "MALTA":   0.35,
    "BRITAIN": 0.25,
    "SWEDEN":  0.206,
    "GERMANY": 0.30,
    "IRELAND": 0.125,
}


# ============================================================
# 3) Yardimcilar
# ============================================================
def unlever(raw_beta, de_decimal, tax):
    if raw_beta is None or de_decimal is None:
        return None
    try:
        return raw_beta / (1 + (1 - tax) * de_decimal)
    except ZeroDivisionError:
        return None


def first_col_value(df, candidates):
    """balance_sheet / income_stmt DataFrame'lerinden ilk sutunun (en son donem)
    ilk eslesen index satirini dondurur."""
    if df is None or df.empty:
        return None
    latest = df.columns[0]
    for key in candidates:
        if key in df.index:
            val = df.loc[key, latest]
            if pd.notna(val):
                return float(val)
    return None


def fetch_via_apify(symbol):
    """canadesk/yahoo-finance Apify actor'u cagirir; dict doner."""
    r = requests.post(
        APIFY_URL,
        params={"token": APIFY_TOKEN, "timeout": 60},
        json={
            "symbols": [symbol],
            "modules": [
                "price", "summaryDetail", "defaultKeyStatistics",
                "financialData", "balanceSheetHistory",
            ],
        },
        timeout=90,
    )
    r.raise_for_status()
    items = r.json()
    if not items:
        raise RuntimeError("Apify actor returned no items")
    first = items[0]
    return first.get("quoteSummary", first)


def _apify_field(qs, *paths):
    """Apify quoteSummary icinde dotted-path degeri bul."""
    for p in paths:
        cur = qs
        for k in p.split("."):
            if isinstance(cur, dict) and k in cur:
                cur = cur[k]
            else:
                cur = None
                break
        if cur is not None:
            if isinstance(cur, dict) and "raw" in cur:
                return cur["raw"]
            return cur
    return None


def fetch_one(entry):
    row = {
        "bbg_ticker": entry["bbg"],
        "yahoo": entry["yahoo"],
        "name": entry["name"],
        "country": entry["country"],
        "note": entry["note"],
        "status": "skipped",
        "currency": None,
        "price": None,
        "market_cap": None,
        "total_debt": None,
        "equity": None,
        "de_pct": None,
        "raw_beta": None,
        "tax_rate": COUNTRY_TAX.get(entry["country"], 0.25),
        "unlevered_beta": None,
        "fiscal_date": None,
        "error": None,
    }

    if not entry["yahoo"]:
        row["error"] = "No Yahoo symbol - delisted/merged"
        return row

    try:
        if APIFY_TOKEN:
            qs = fetch_via_apify(entry["yahoo"])
            row["currency"]   = _apify_field(qs, "price.currency")
            row["price"]      = _apify_field(qs, "price.regularMarketPrice")
            row["market_cap"] = _apify_field(qs, "price.marketCap")
            row["raw_beta"]   = _apify_field(qs, "defaultKeyStatistics.beta", "summaryDetail.beta")
            total_debt = _apify_field(qs, "financialData.totalDebt",
                                      "balanceSheetHistory.balanceSheetStatements.0.longTermDebt",
                                      "balanceSheetHistory.balanceSheetStatements.0.totalLiab")
            equity     = _apify_field(qs, "balanceSheetHistory.balanceSheetStatements.0.totalStockholderEquity")
            de_info    = _apify_field(qs, "financialData.debtToEquity")
            end_date   = _apify_field(qs, "balanceSheetHistory.balanceSheetStatements.0.endDate")
            if end_date:
                row["fiscal_date"] = str(end_date)[:10]
        else:
            t = yf.Ticker(entry["yahoo"])
            info = t.info or {}
            bs = t.balance_sheet  # quarterly_balance_sheet da var

            row["currency"]   = info.get("currency") or info.get("financialCurrency")
            row["price"]      = info.get("currentPrice") or info.get("regularMarketPrice")
            row["market_cap"] = info.get("marketCap")
            row["raw_beta"]   = info.get("beta")

            total_debt = info.get("totalDebt")
            equity     = info.get("totalStockholderEquity")
            de_info    = info.get("debtToEquity")

            if total_debt is None:
                total_debt = first_col_value(bs, ["Total Debt", "Long Term Debt", "Total Liabilities Net Minority Interest"])
            if equity is None:
                equity = first_col_value(bs, ["Stockholders Equity", "Total Stockholder Equity", "Common Stock Equity"])
            if bs is not None and not bs.empty:
                row["fiscal_date"] = str(bs.columns[0].date())

        row["total_debt"] = total_debt
        row["equity"]     = equity

        if de_info is not None:
            row["de_pct"] = de_info
        elif total_debt is not None and equity not in (None, 0):
            row["de_pct"] = (total_debt / equity) * 100

        de_decimal = row["de_pct"] / 100 if row["de_pct"] is not None else None
        row["unlevered_beta"] = unlever(row["raw_beta"], de_decimal, row["tax_rate"])
        row["status"] = "ok"
    except Exception as e:
        row["status"] = "error"
        row["error"] = str(e)

    return row


# ============================================================
# 4) Calistir
# ============================================================
def run():
    rows = []
    for i, entry in enumerate(UNIVERSE, 1):
        print(f"[{i:2d}/{len(UNIVERSE)}] {entry['bbg']:10s} -> {entry['yahoo'] or 'SKIP'}")
        rows.append(fetch_one(entry))
        time.sleep(0.4)  # rate-limit

    df = pd.DataFrame(rows)
    display_cols = [
        "bbg_ticker", "yahoo", "country", "currency", "fiscal_date",
        "total_debt", "equity", "de_pct", "raw_beta", "tax_rate",
        "unlevered_beta", "status",
    ]
    print("\n=== SONUC TABLOSU ===")
    with pd.option_context("display.max_columns", None, "display.width", 200):
        print(df[display_cols].to_string(index=False))

    # Ciktilari kaydet
    out_csv  = "/content/yahoo_finance_snapshot.csv"
    out_json = "/content/yahoo_finance_snapshot.json"
    df.to_csv(out_csv, index=False)
    with open(out_json, "w") as f:
        json.dump({
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "results": rows,
        }, f, indent=2, default=str)

    print(f"\nKaydedildi:\n  {out_csv}\n  {out_json}")
    return df


if __name__ == "__main__":
    run()
