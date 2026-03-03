export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  subSector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  pb: number;
  dividendYield: number;
  weekHigh52: number;
  weekLow52: number;
  roe: number;
  netMargin: number;
  debtToEquity: number;
  currentRatio: number;
  revenue: number;
  netIncome: number;
  equity: number;
  totalAssets: number;
  totalDebt: number;
  freeCashFlow: number;
  eps: number;
  revenueGrowth: number;
  netIncomeGrowth: number;
  score: StockScore;
  priceHistory: number[];
  quarterlyRevenue: QuarterlyData[];
  quarterlyNetIncome: QuarterlyData[];
  dividendHistory: DividendRecord[];
}

export interface StockScore {
  overall: number;
  profitability: number;
  growth: number;
  financial: number;
  valuation: number;
}

export interface QuarterlyData {
  quarter: string;
  value: number;
}

export interface DividendRecord {
  year: number;
  amount: number;
  yield: number;
}

export interface Sector {
  name: string;
  stockCount: number;
  totalMarketCap: number;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgDividendYield: number;
  change: number;
  changePercent: number;
  topStocks: string[];
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  sparkline: number[];
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
}

export interface CalendarEvent {
  date: string;
  title: string;
  type: 'earnings' | 'dividend' | 'macro' | 'ipo' | 'general';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface FilterCriteria {
  sector?: string;
  minPE?: number;
  maxPE?: number;
  minPB?: number;
  maxPB?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minDividendYield?: number;
  minROE?: number;
  minScore?: number;
  minNetMargin?: number;
  maxDebtToEquity?: number;
}
