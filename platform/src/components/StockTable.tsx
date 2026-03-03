'use client';

import Link from 'next/link';
import { Stock } from '@/types';
import { formatPrice, formatPercent, formatCurrency, formatVolume, getChangeColor, getScoreColor } from '@/lib/utils';
import MiniChart from './MiniChart';

interface StockTableProps {
  stocks: Stock[];
  columns?: string[];
  compact?: boolean;
}

const defaultColumns = ['symbol', 'price', 'change', 'volume', 'marketCap', 'pe', 'pb', 'dividendYield', 'roe', 'score', 'chart'];

const columnHeaders: Record<string, { label: string; align: string }> = {
  symbol: { label: 'Hisse', align: 'text-left' },
  price: { label: 'Fiyat', align: 'text-right' },
  change: { label: 'Değişim', align: 'text-right' },
  volume: { label: 'Hacim', align: 'text-right' },
  marketCap: { label: 'Piy. Değeri', align: 'text-right' },
  pe: { label: 'F/K', align: 'text-right' },
  pb: { label: 'PD/DD', align: 'text-right' },
  dividendYield: { label: 'Temettü', align: 'text-right' },
  roe: { label: 'ROE', align: 'text-right' },
  netMargin: { label: 'Net Marj', align: 'text-right' },
  debtToEquity: { label: 'Borç/Öz', align: 'text-right' },
  score: { label: 'Skor', align: 'text-center' },
  chart: { label: '30 Gün', align: 'text-center' },
  revenueGrowth: { label: 'Gelir Büyüme', align: 'text-right' },
  eps: { label: 'HBK', align: 'text-right' },
};

export default function StockTable({ stocks, columns = defaultColumns, compact = false }: StockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full stock-table">
        <thead>
          <tr className="border-b border-bist-border">
            {columns.map((col) => (
              <th
                key={col}
                className={`${columnHeaders[col]?.align || 'text-left'} px-3 py-3 text-xs font-medium text-bist-textMuted uppercase tracking-wider whitespace-nowrap`}
              >
                {columnHeaders[col]?.label || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bist-border/50">
          {stocks.map((stock) => (
            <tr key={stock.symbol} className="card-hover group">
              {columns.map((col) => (
                <td key={col} className={`px-3 ${compact ? 'py-2' : 'py-3'} whitespace-nowrap`}>
                  {col === 'symbol' && (
                    <Link href={`/hisseler/${stock.symbol}`} className="flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-bist-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-400">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{stock.symbol}</div>
                        <div className="text-[11px] text-bist-textMuted max-w-[140px] truncate">{stock.name}</div>
                      </div>
                    </Link>
                  )}
                  {col === 'price' && (
                    <span className="text-sm font-medium">₺{formatPrice(stock.price)}</span>
                  )}
                  {col === 'change' && (
                    <div className={`text-right ${getChangeColor(stock.changePercent)}`}>
                      <div className="text-sm font-medium">{formatPercent(stock.changePercent)}</div>
                      <div className="text-[11px] opacity-70">
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {col === 'volume' && (
                    <span className="text-sm text-bist-textSecondary text-right block">₺{formatVolume(stock.volume)}</span>
                  )}
                  {col === 'marketCap' && (
                    <span className="text-sm text-bist-textSecondary text-right block">{formatCurrency(stock.marketCap)}</span>
                  )}
                  {col === 'pe' && (
                    <span className="text-sm text-bist-textSecondary text-right block">{stock.pe.toFixed(1)}</span>
                  )}
                  {col === 'pb' && (
                    <span className="text-sm text-bist-textSecondary text-right block">{stock.pb.toFixed(2)}</span>
                  )}
                  {col === 'dividendYield' && (
                    <span className={`text-sm text-right block ${stock.dividendYield > 5 ? 'text-emerald-400' : 'text-bist-textSecondary'}`}>
                      %{stock.dividendYield.toFixed(1)}
                    </span>
                  )}
                  {col === 'roe' && (
                    <span className={`text-sm text-right block ${stock.roe > 20 ? 'text-emerald-400' : 'text-bist-textSecondary'}`}>
                      %{stock.roe.toFixed(1)}
                    </span>
                  )}
                  {col === 'netMargin' && (
                    <span className="text-sm text-bist-textSecondary text-right block">%{stock.netMargin.toFixed(1)}</span>
                  )}
                  {col === 'debtToEquity' && (
                    <span className={`text-sm text-right block ${stock.debtToEquity > 1 ? 'text-red-400' : 'text-bist-textSecondary'}`}>
                      {stock.debtToEquity.toFixed(2)}
                    </span>
                  )}
                  {col === 'revenueGrowth' && (
                    <span className={`text-sm text-right block ${getChangeColor(stock.revenueGrowth)}`}>
                      {formatPercent(stock.revenueGrowth)}
                    </span>
                  )}
                  {col === 'eps' && (
                    <span className="text-sm text-bist-textSecondary text-right block">₺{stock.eps.toFixed(2)}</span>
                  )}
                  {col === 'score' && (
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold border ${
                        stock.score.overall >= 70
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : stock.score.overall >= 50
                          ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                          : 'bg-red-500/15 border-red-500/30 text-red-400'
                      }`}>
                        {stock.score.overall}
                      </span>
                    </div>
                  )}
                  {col === 'chart' && (
                    <div className="flex justify-center">
                      <MiniChart data={stock.priceHistory} width={80} height={28} />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
