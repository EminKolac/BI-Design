#!/usr/bin/env python3
"""
fetch_tvf_powerbi.py — Fetch TVF (Turkey Wealth Fund) portfolio data via yfinance
and output CSV files matching the NBIM Power BI data model.

Outputs:
  investments.csv      — NBIM Fact Table with holdings, valuations, quote data
  timeframes.csv       — Risk metrics per ticker × timeframe × currency mode
  daily_prices.csv     — 5Y daily adjusted close in TRY
  daily_prices_usd.csv — 5Y daily adjusted close converted to USD
  portfolio_meta.csv   — Single-row portfolio summary

Usage:
  python fetch_tvf_powerbi.py
"""

import logging
import math
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
HOLDINGS = [
    {"name": "Türk Hava Yolları",    "ticker": "THYAO", "yahoo": "THYAO.IS", "sector": "Transport",  "stake_pct": 49.12, "shares": 1373660993, "acq_date": "2017-02-06", "acq_method": "Privatization Admin transfer"},
    {"name": "Halkbank",              "ticker": "HALKB", "yahoo": "HALKB.IS", "sector": "Banking",    "stake_pct": 40.40, "shares": 7184778041, "acq_date": "2023-03-28", "acq_method": "Treasury decree transfer"},
    {"name": "VakıfBank",             "ticker": "VAKBN", "yahoo": "VAKBN.IS", "sector": "Banking",    "stake_pct": 74.80, "shares": 9915921523, "acq_date": "2023-03-28", "acq_method": "Treasury transfer + cap injection"},
    {"name": "Türk Telekom",          "ticker": "TTKOM", "yahoo": "TTKOM.IS", "sector": "Telecom",    "stake_pct": 55.00, "shares": 3500000000, "acq_date": "2022-03-31", "acq_method": "Transfer + $1.65B acquisition"},
    {"name": "Turkcell",              "ticker": "TCELL", "yahoo": "TCELL.IS", "sector": "Telecom",    "stake_pct": 26.20, "shares": 2178536499, "acq_date": "2020-10-22", "acq_method": "Market acquisition ($1.8B)"},
    {"name": "Kardemir",              "ticker": "KRDMD", "yahoo": "KRDMD.IS", "sector": "Steel",      "stake_pct": 4.41,  "shares": 780226002,  "acq_date": "2022-12-06", "acq_method": "Market purchase ($35.2M)"},
    {"name": "Türkiye Sigorta",       "ticker": "TURSG", "yahoo": "TURSG.IS", "sector": "Insurance",  "stake_pct": 81.00, "shares": 10000000000,"acq_date": "2020-04-24", "acq_method": "Merger of state insurers"},
    {"name": "Türk Altın İşletmeleri","ticker": "TRALT", "yahoo": "TRALT.IS", "sector": "Gold Mining","stake_pct": 100.00,"shares": 3202500000, "acq_date": "2024-10-18", "acq_method": "Seized (ex-KOZAL)"},
    {"name": "TR Metal Madencilik",   "ticker": "TRMET", "yahoo": "TRMET.IS", "sector": "Mining",     "stake_pct": 100.00,"shares": 388080000,  "acq_date": "2024-10-18", "acq_method": "Seized (ex-KOZAA)"},
    {"name": "TR Doğal Enerji",       "ticker": "TRENJ", "yahoo": "TRENJ.IS", "sector": "Energy",     "stake_pct": 100.00,"shares": 259785561,  "acq_date": "2024-10-20", "acq_method": "Seized (ex-IPEKE)"},
]

BENCHMARK_TICKERS = [
    {"ticker": "XU100",  "yahoo": "XU100.IS"},
    {"ticker": "USDTRY", "yahoo": "USDTRY=X"},
]

RF_RATES: dict[str, float] = {
    "TRY":  0.50,
    "RTRY": 0.50,
    "USD":  0.0348,
    "RUSD": 0.0348,
}

CPI_RATES: dict[str, float] = {
    "TRY":  0.0,
    "RTRY": 0.445,
    "USD":  0.0,
    "RUSD": 0.028,
}

CURRENCY_MODES = ["TRY", "RTRY", "USD", "RUSD"]

TIMEFRAMES = ["MTD", "QTD", "YTD", "1Y", "3Y", "5Y"]

TRADING_DAYS_PER_YEAR = 252

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _retry_fetch(func, *args, retries: int = 3, delay: float = 2.0, **kwargs) -> Any:
    """Call *func* with retries and exponential backoff."""
    for attempt in range(retries):
        try:
            return func(*args, **kwargs)
        except Exception as exc:
            if attempt < retries - 1:
                wait = delay * (2 ** attempt)
                log.warning("Attempt %d failed for %s: %s — retrying in %.0fs",
                            attempt + 1, func.__name__, exc, wait)
                time.sleep(wait)
            else:
                log.error("All %d attempts failed for %s: %s", retries, func.__name__, exc)
                raise


def _timeframe_start(tf: str, today: datetime) -> datetime:
    """Return the start date for a given timeframe label."""
    if tf == "MTD":
        return today.replace(day=1)
    if tf == "QTD":
        q_month = ((today.month - 1) // 3) * 3 + 1
        return today.replace(month=q_month, day=1)
    if tf == "YTD":
        return today.replace(month=1, day=1)
    if tf == "1Y":
        return today - timedelta(days=365)
    if tf == "3Y":
        return today - timedelta(days=365 * 3)
    if tf == "5Y":
        return today - timedelta(days=365 * 5)
    raise ValueError(f"Unknown timeframe: {tf}")


def _safe_get(info: dict, *keys, default=None):
    """Try multiple keys from a yfinance info dict, return first non-None."""
    for k in keys:
        v = info.get(k)
        if v is not None:
            return v
    return default


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

def fetch_all_data() -> tuple[dict[str, dict], dict[str, pd.Series]]:
    """
    Fetch quote info and 5Y daily history for every ticker.

    Returns:
        info_map:    {ticker: yf.Ticker.info dict}
        history_map: {ticker: pd.Series of adjusted close, DatetimeIndex}
    """
    all_tickers = [h["yahoo"] for h in HOLDINGS] + [b["yahoo"] for b in BENCHMARK_TICKERS]
    ticker_labels = [h["ticker"] for h in HOLDINGS] + [b["ticker"] for b in BENCHMARK_TICKERS]

    info_map: dict[str, dict] = {}
    history_map: dict[str, pd.Series] = {}

    for label, yahoo in zip(ticker_labels, all_tickers):
        log.info("Fetching %s (%s) ...", label, yahoo)
        t = yf.Ticker(yahoo)

        # Quote info
        try:
            info = _retry_fetch(lambda _t=t: _t.info)
            info_map[label] = info if isinstance(info, dict) else {}
        except Exception:
            log.warning("Could not fetch info for %s — using empty dict", label)
            info_map[label] = {}

        # Historical prices (5 years)
        try:
            hist = _retry_fetch(lambda _t=t: _t.history(period="5y"))
            if hist is not None and not hist.empty:
                close = hist["Close"].dropna()
                close.index = close.index.tz_localize(None)
                history_map[label] = close
                log.info("  %s: %d days of history (%s → %s)",
                         label, len(close),
                         close.index[0].strftime("%Y-%m-%d"),
                         close.index[-1].strftime("%Y-%m-%d"))
            else:
                log.warning("  %s: empty history", label)
                history_map[label] = pd.Series(dtype=float)
        except Exception:
            log.warning("  %s: history fetch failed — empty series", label)
            history_map[label] = pd.Series(dtype=float)

    return info_map, history_map


# ---------------------------------------------------------------------------
# Currency transformation
# ---------------------------------------------------------------------------

def build_price_series(
    try_prices: pd.Series,
    usdtry: pd.Series,
    mode: str,
) -> pd.Series:
    """
    Transform a TRY-denominated price series to the requested currency mode.

    Modes:
      TRY  — raw TRY prices
      RTRY — raw TRY prices (CPI adjustment happens in log-return space)
      USD  — TRY / USDTRY
      RUSD — TRY / USDTRY (CPI adjustment happens in log-return space)
    """
    if try_prices.empty:
        return try_prices

    if mode in ("TRY", "RTRY"):
        return try_prices.copy()

    # USD or RUSD: convert to USD
    fx = usdtry.reindex(try_prices.index, method="ffill")
    # If there are still NaN at the start, backfill
    fx = fx.bfill()
    if fx.isna().all():
        log.warning("USDTRY has no overlap with price series — returning NaN")
        return pd.Series(np.nan, index=try_prices.index)
    return try_prices / fx


def compute_log_returns(prices: pd.Series, mode: str) -> pd.Series:
    """
    Compute daily log returns with CPI adjustment for Real modes.
    """
    if prices.empty or len(prices) < 2:
        return pd.Series(dtype=float)

    log_ret = np.log(prices / prices.shift(1)).dropna()

    cpi_annual = CPI_RATES.get(mode, 0.0)
    if cpi_annual > 0:
        daily_cpi = math.log(1 + cpi_annual) / TRADING_DAYS_PER_YEAR
        log_ret = log_ret - daily_cpi

    return log_ret


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------

def compute_metrics(
    prices: pd.Series,
    log_rets: pd.Series,
    xu100_log_rets: pd.Series | None,
    mode: str,
) -> dict:
    """
    Compute return, CAGR, Sharpe, Sortino, Beta, Vol, MaxDD for a given
    price series and its log returns in a single currency mode.
    """
    result: dict[str, Any] = {}
    days = len(log_rets)
    result["Days"] = days

    if prices.empty or days < 2:
        for k in ("Return", "CAGR", "Sharpe", "Sortino", "Beta", "Volatility",
                   "MaxDrawdown", "StartPrice", "EndPrice"):
            result[k] = None
        return result

    start_price = float(prices.iloc[0])
    end_price = float(prices.iloc[-1])
    result["StartPrice"] = start_price
    result["EndPrice"] = end_price

    # Simple return
    simple_ret = end_price / start_price - 1
    result["Return"] = simple_ret

    # CAGR (null if <60 days)
    if days >= 60:
        result["CAGR"] = (1 + simple_ret) ** (TRADING_DAYS_PER_YEAR / days) - 1
    else:
        result["CAGR"] = None

    # Daily rf
    rf_annual = RF_RATES[mode]
    rf_daily = math.log(1 + rf_annual) / TRADING_DAYS_PER_YEAR

    mean_r = float(log_rets.mean())
    std_r = float(log_rets.std(ddof=1))

    # Volatility
    vol = std_r * math.sqrt(TRADING_DAYS_PER_YEAR)
    result["Volatility"] = vol

    # Sharpe
    if std_r > 0:
        result["Sharpe"] = (mean_r - rf_daily) / std_r * math.sqrt(TRADING_DAYS_PER_YEAR)
    else:
        result["Sharpe"] = None

    # Sortino
    excess = log_rets - rf_daily
    downside = excess.clip(upper=0)
    downside_std = float(np.sqrt((downside ** 2).mean()))
    if downside_std > 0:
        result["Sortino"] = (mean_r - rf_daily) / downside_std * math.sqrt(TRADING_DAYS_PER_YEAR)
    else:
        result["Sortino"] = None

    # Beta vs XU100
    if xu100_log_rets is not None and len(xu100_log_rets) > 10:
        # Align indices
        aligned = pd.DataFrame({"stock": log_rets, "xu100": xu100_log_rets}).dropna()
        if len(aligned) > 10:
            cov = aligned["stock"].cov(aligned["xu100"])
            var_xu = aligned["xu100"].var()
            result["Beta"] = cov / var_xu if var_xu > 0 else None
        else:
            result["Beta"] = None
    else:
        result["Beta"] = None

    # Max Drawdown (on cumulative returns from prices)
    cum_max = prices.cummax()
    drawdowns = (prices - cum_max) / cum_max
    result["MaxDrawdown"] = float(drawdowns.min())

    return result


# ---------------------------------------------------------------------------
# CSV builders
# ---------------------------------------------------------------------------

def build_investments_csv(
    info_map: dict[str, dict],
    usdtry_rate: float,
) -> pd.DataFrame:
    """Build the investments.csv DataFrame."""
    rows = []
    total_value_try = 0.0

    # First pass: compute ValueTRY for each holding
    values_try = []
    for h in HOLDINGS:
        info = info_map.get(h["ticker"], {})
        price = _safe_get(info, "currentPrice", "regularMarketPrice", default=0.0)
        val_try = h["shares"] * price * (h["stake_pct"] / 100.0)
        values_try.append(val_try)
        total_value_try += val_try

    # Second pass: build rows
    for h, val_try in zip(HOLDINGS, values_try):
        info = info_map.get(h["ticker"], {})
        price = _safe_get(info, "currentPrice", "regularMarketPrice", default=0.0)
        prev_close = _safe_get(info, "previousClose", default=0.0)
        daily_chg = (price - prev_close) / prev_close if prev_close else None

        rows.append({
            "InvestmentID":  h["ticker"],
            "CompanyName":   h["name"],
            "Year":          datetime.now().year,
            "AssetClass":    "Equities",
            "Country":       "Turkey",
            "Sector":        h["sector"],
            "ValueTRY":      round(val_try, 2),
            "ValueUSD":      round(val_try / usdtry_rate, 2) if usdtry_rate else None,
            "ShareOfFund":   round(val_try / total_value_try, 6) if total_value_try else None,
            "Currency":      "TRY",
            "StakePct":      h["stake_pct"],
            "Shares":        h["shares"],
            "AcqDate":       h["acq_date"],
            "AcqMethod":     h["acq_method"],
            "CurrentPrice":  price,
            "PrevClose":     prev_close,
            "DailyChg":      round(daily_chg, 6) if daily_chg is not None else None,
            "MktCap":        _safe_get(info, "marketCap"),
            "PE":            _safe_get(info, "trailingPE"),
            "PB":            _safe_get(info, "priceToBook"),
            "DivYield":      _safe_get(info, "dividendYield"),
            "High52":        _safe_get(info, "fiftyTwoWeekHigh"),
            "Low52":         _safe_get(info, "fiftyTwoWeekLow"),
            "Volume":        _safe_get(info, "volume"),
        })

    return pd.DataFrame(rows)


def build_timeframes_csv(
    history_map: dict[str, pd.Series],
    today: datetime,
) -> pd.DataFrame:
    """Build the timeframes.csv DataFrame — all tickers × timeframes × currency modes."""
    usdtry_series = history_map.get("USDTRY", pd.Series(dtype=float))
    rows = []

    # Tickers to process: holdings + XU100
    tickers_to_process = [h["ticker"] for h in HOLDINGS] + ["XU100"]

    for tf in TIMEFRAMES:
        start_dt = _timeframe_start(tf, today)

        for mode in CURRENCY_MODES:
            # Pre-compute XU100 log returns in this currency mode for beta calc
            xu100_try = history_map.get("XU100", pd.Series(dtype=float))
            xu100_prices_mode = build_price_series(xu100_try, usdtry_series, mode)
            if xu100_prices_mode.empty:
                xu100_window = xu100_prices_mode
            else:
                xu100_window = xu100_prices_mode.loc[
                    xu100_prices_mode.index >= pd.Timestamp(start_dt)
                ]
            xu100_log_rets = compute_log_returns(xu100_window, mode)

            for ticker in tickers_to_process:
                try_prices = history_map.get(ticker, pd.Series(dtype=float))
                if try_prices.empty:
                    rows.append({
                        "Ticker": ticker, "Timeframe": tf,
                        "CurrencyMode": mode, "RfAnnual": RF_RATES[mode],
                        "Return": None, "CAGR": None, "Sharpe": None,
                        "Sortino": None, "Beta": None, "Volatility": None,
                        "MaxDrawdown": None, "Days": 0,
                        "StartPrice": None, "EndPrice": None,
                    })
                    continue

                # Transform to currency mode
                prices_mode = build_price_series(try_prices, usdtry_series, mode)

                # Window to timeframe
                if prices_mode.empty:
                    window = prices_mode
                else:
                    window = prices_mode.loc[prices_mode.index >= pd.Timestamp(start_dt)]
                if window.empty or len(window) < 2:
                    rows.append({
                        "Ticker": ticker, "Timeframe": tf,
                        "CurrencyMode": mode, "RfAnnual": RF_RATES[mode],
                        "Return": None, "CAGR": None, "Sharpe": None,
                        "Sortino": None, "Beta": None, "Volatility": None,
                        "MaxDrawdown": None, "Days": 0,
                        "StartPrice": None, "EndPrice": None,
                    })
                    continue

                log_rets = compute_log_returns(window, mode)

                # Beta: XU100 vs itself is null
                beta_ref = None if ticker == "XU100" else xu100_log_rets

                metrics = compute_metrics(window, log_rets, beta_ref, mode)
                rows.append({
                    "Ticker":      ticker,
                    "Timeframe":   tf,
                    "CurrencyMode": mode,
                    "RfAnnual":    RF_RATES[mode],
                    **metrics,
                })

    return pd.DataFrame(rows)


def build_daily_prices(
    history_map: dict[str, pd.Series],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Build daily_prices.csv (TRY) and daily_prices_usd.csv."""
    tickers_ordered = [h["ticker"] for h in HOLDINGS] + ["XU100"]
    usdtry_series = history_map.get("USDTRY", pd.Series(dtype=float))

    # Collect all dates across all tickers
    all_dates: set[pd.Timestamp] = set()
    for ticker in tickers_ordered:
        s = history_map.get(ticker, pd.Series(dtype=float))
        all_dates.update(s.index.tolist())
    if usdtry_series is not None and not usdtry_series.empty:
        all_dates.update(usdtry_series.index.tolist())

    if not all_dates:
        empty = pd.DataFrame()
        return empty, empty

    date_idx = pd.DatetimeIndex(sorted(all_dates))

    # Build TRY DataFrame
    df_try = pd.DataFrame(index=date_idx)
    df_try.index.name = "Date"

    for ticker in tickers_ordered:
        s = history_map.get(ticker, pd.Series(dtype=float))
        df_try[ticker] = s.reindex(date_idx)

    # USDTRY column (forward-filled to equity calendar)
    fx = usdtry_series.reindex(date_idx, method="ffill").bfill()
    df_try["USDTRY"] = fx

    # Build USD DataFrame
    df_usd = pd.DataFrame(index=date_idx)
    df_usd.index.name = "Date"

    for ticker in tickers_ordered:
        df_usd[ticker] = df_try[ticker] / fx

    df_usd["USDTRY"] = fx  # keep FX as reference

    return df_try, df_usd


def build_portfolio_meta(
    investments_df: pd.DataFrame,
    info_map: dict[str, dict],
    usdtry_rate: float,
) -> pd.DataFrame:
    """Build portfolio_meta.csv — single row."""
    total_try = investments_df["ValueTRY"].sum()

    xu100_info = info_map.get("XU100", {})
    xu100_price = _safe_get(xu100_info, "regularMarketPrice", "previousClose", default=None)
    xu100_prev = _safe_get(xu100_info, "previousClose", default=None)
    xu100_chg = None
    if xu100_price and xu100_prev and xu100_prev > 0:
        xu100_chg = round((xu100_price - xu100_prev) / xu100_prev, 6)

    # BIST market status: open Mon-Fri 10:00-18:00 TRT (UTC+3)
    now_utc = datetime.now(timezone.utc)
    trt = timezone(timedelta(hours=3))
    now_trt = now_utc.astimezone(trt)
    is_weekday = now_trt.weekday() < 5
    in_hours = 10 <= now_trt.hour < 18
    mkt_status = "OPEN" if (is_weekday and in_hours) else "CLOSED"

    row = {
        "FetchTime":         datetime.now(timezone.utc).isoformat(),
        "PortfolioValueTRY": round(total_try, 2),
        "PortfolioValueUSD": round(total_try / usdtry_rate, 2) if usdtry_rate else None,
        "USDTRY_Rate":       round(usdtry_rate, 4) if usdtry_rate else None,
        "XU100_Price":       xu100_price,
        "XU100_DailyChg":    xu100_chg,
        "RfAnnualTRY":       RF_RATES["TRY"],
        "RfAnnualUSD":       RF_RATES["USD"],
        "TurkeyInflation":   CPI_RATES["RTRY"],
        "USInflation":       CPI_RATES["RUSD"],
        "NumHoldings":       len(HOLDINGS),
        "MktStatus":         mkt_status,
    }
    return pd.DataFrame([row])


# ---------------------------------------------------------------------------
# Summary printer
# ---------------------------------------------------------------------------

def print_summary(investments_df: pd.DataFrame, timeframes_df: pd.DataFrame) -> None:
    """Print a nicely formatted summary table."""
    print("\n" + "=" * 110)
    print("TVF PORTFOLIO SUMMARY")
    print("=" * 110)
    header = f"{'Ticker':<8} {'Name':<25} {'ValueTRY':>18} {'Share':>8} {'1Y TRY':>9} {'1Y RTRY':>9} {'1Y USD':>9} {'1Y RUSD':>9}"
    print(header)
    print("-" * 110)

    for _, inv in investments_df.iterrows():
        ticker = inv["InvestmentID"]
        name = inv["CompanyName"][:24]
        val = inv["ValueTRY"] or 0
        share = inv["ShareOfFund"] or 0

        returns = {}
        for mode in CURRENCY_MODES:
            row = timeframes_df[
                (timeframes_df["Ticker"] == ticker)
                & (timeframes_df["Timeframe"] == "1Y")
                & (timeframes_df["CurrencyMode"] == mode)
            ]
            if not row.empty and row.iloc[0]["Return"] is not None:
                returns[mode] = row.iloc[0]["Return"]
            else:
                returns[mode] = None

        def _fmt_ret(r):
            return f"{r:+.1%}" if r is not None else "   N/A"

        def _fmt_val(v):
            if v >= 1e12:
                return f"{v/1e12:>14.1f} T"
            if v >= 1e9:
                return f"{v/1e9:>14.1f} B"
            if v >= 1e6:
                return f"{v/1e6:>14.1f} M"
            return f"{v:>15,.0f}"

        print(f"{ticker:<8} {name:<25} {_fmt_val(val):>18} {share:>7.1%} "
              f"{_fmt_ret(returns.get('TRY')):>9} {_fmt_ret(returns.get('RTRY')):>9} "
              f"{_fmt_ret(returns.get('USD')):>9} {_fmt_ret(returns.get('RUSD')):>9}")

    total_try = investments_df["ValueTRY"].sum() or 0
    total_usd = investments_df["ValueUSD"].sum() or 0
    print("-" * 110)
    print(f"{'TOTAL':<8} {'':25} {_fmt_val(total_try):>18} {'100.0%':>8}")
    print(f"{'':8} {'(USD)':25} {_fmt_val(total_usd):>18}")
    print("=" * 110)


def _fmt_val(v: float) -> str:
    if v >= 1e12:
        return f"{v/1e12:>14.1f} T"
    if v >= 1e9:
        return f"{v/1e9:>14.1f} B"
    if v >= 1e6:
        return f"{v/1e6:>14.1f} M"
    return f"{v:>15,.0f}"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    log.info("TVF Power BI data fetch — %s", today.strftime("%Y-%m-%d"))

    # 1) Fetch all data
    log.info("=" * 60)
    log.info("PHASE 1: Fetching data from Yahoo Finance")
    log.info("=" * 60)
    info_map, history_map = fetch_all_data()

    # Current USDTRY rate
    usdtry_info = info_map.get("USDTRY", {})
    usdtry_rate = _safe_get(usdtry_info, "regularMarketPrice", "previousClose", default=None)
    if usdtry_rate is None and not history_map.get("USDTRY", pd.Series(dtype=float)).empty:
        usdtry_rate = float(history_map["USDTRY"].iloc[-1])
    if usdtry_rate is None:
        log.error("Could not determine USDTRY rate — USD values will be null")
        usdtry_rate = 0.0
    log.info("USDTRY rate: %.4f", usdtry_rate)

    # 2) Build CSVs
    log.info("=" * 60)
    log.info("PHASE 2: Building CSV outputs")
    log.info("=" * 60)

    # investments.csv
    log.info("Building investments.csv ...")
    investments_df = build_investments_csv(info_map, usdtry_rate)
    investments_df.to_csv("investments.csv", index=False)
    log.info("  → investments.csv (%d rows)", len(investments_df))

    # timeframes.csv
    log.info("Building timeframes.csv ...")
    timeframes_df = build_timeframes_csv(history_map, today)
    # Round numeric columns
    numeric_cols = ["Return", "CAGR", "Sharpe", "Sortino", "Beta",
                    "Volatility", "MaxDrawdown", "StartPrice", "EndPrice"]
    for col in numeric_cols:
        if col in timeframes_df.columns:
            timeframes_df[col] = pd.to_numeric(timeframes_df[col], errors="coerce").round(6)
    timeframes_df.to_csv("timeframes.csv", index=False)
    log.info("  → timeframes.csv (%d rows)", len(timeframes_df))

    # daily_prices.csv / daily_prices_usd.csv
    log.info("Building daily_prices.csv and daily_prices_usd.csv ...")
    df_try, df_usd = build_daily_prices(history_map)
    df_try.to_csv("daily_prices.csv", index=True)
    df_usd.to_csv("daily_prices_usd.csv", index=True)
    log.info("  → daily_prices.csv (%d rows × %d cols)", len(df_try), len(df_try.columns))
    log.info("  → daily_prices_usd.csv (%d rows × %d cols)", len(df_usd), len(df_usd.columns))

    # portfolio_meta.csv
    log.info("Building portfolio_meta.csv ...")
    meta_df = build_portfolio_meta(investments_df, info_map, usdtry_rate)
    meta_df.to_csv("portfolio_meta.csv", index=False)
    log.info("  → portfolio_meta.csv")

    # 3) Summary
    print_summary(investments_df, timeframes_df)

    log.info("Done — all 5 CSV files written.")


if __name__ == "__main__":
    main()
