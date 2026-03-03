import { IndexData } from '@/types';

function generateSparkline(base: number, points: number = 24): number[] {
  const data: number[] = [base * 0.95];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.45) * base * 0.005;
    data.push(data[i - 1] + change);
  }
  data[points - 1] = base;
  return data;
}

export const indices: IndexData[] = [
  {
    name: 'BIST 100',
    value: 10_842.35,
    change: 185.42,
    changePercent: 1.74,
    volume: 82_500_000_000,
    high: 10_920.18,
    low: 10_645.20,
    sparkline: generateSparkline(10_842.35),
  },
  {
    name: 'BIST 30',
    value: 11_256.80,
    change: 198.65,
    changePercent: 1.80,
    volume: 65_200_000_000,
    high: 11_340.50,
    low: 11_048.12,
    sparkline: generateSparkline(11_256.80),
  },
  {
    name: 'BIST 50',
    value: 10_985.42,
    change: 168.30,
    changePercent: 1.56,
    volume: 72_800_000_000,
    high: 11_065.80,
    low: 10_805.65,
    sparkline: generateSparkline(10_985.42),
  },
  {
    name: 'BIST Banka',
    value: 5_842.18,
    change: 112.45,
    changePercent: 1.96,
    volume: 28_400_000_000,
    high: 5_895.20,
    low: 5_718.50,
    sparkline: generateSparkline(5_842.18),
  },
  {
    name: 'BIST Sınai',
    value: 14_285.60,
    change: 205.80,
    changePercent: 1.46,
    volume: 18_600_000_000,
    high: 14_380.25,
    low: 14_068.40,
    sparkline: generateSparkline(14_285.60),
  },
  {
    name: 'BIST Teknoloji',
    value: 8_425.30,
    change: 245.12,
    changePercent: 3.00,
    volume: 12_400_000_000,
    high: 8_520.80,
    low: 8_165.45,
    sparkline: generateSparkline(8_425.30),
  },
];

export const marketSummary = {
  totalMarketCap: 12_850_000_000_000,
  totalVolume: 82_500_000_000,
  advancers: 285,
  decliners: 168,
  unchanged: 42,
  newHighs: 34,
  newLows: 12,
  usdTry: 38.42,
  eurTry: 41.85,
  goldTry: 3_245.00,
  brentOil: 82.45,
};
