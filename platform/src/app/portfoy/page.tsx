'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getStockBySymbol } from '@/data/stocks';
import { Stock } from '@/types';
import { formatPrice, formatCurrency, formatPercent, getChangeColor, getChangeBgColor, formatNumber } from '@/lib/utils';
import MiniChart from '@/components/MiniChart';
import KPICard from '@/components/KPICard';

interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgCost: number;
}

interface EnrichedHolding extends PortfolioHolding {
  stock: Stock;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
}

const defaultPortfolio: PortfolioHolding[] = [
  { symbol: 'THYAO', shares: 500, avgCost: 265.00 },
  { symbol: 'GARAN', shares: 1200, avgCost: 108.50 },
  { symbol: 'AKBNK', shares: 2000, avgCost: 52.40 },
  { symbol: 'FROTO', shares: 50, avgCost: 920.00 },
  { symbol: 'TUPRS', shares: 200, avgCost: 145.00 },
  { symbol: 'BIMAS', shares: 100, avgCost: 485.00 },
  { symbol: 'KOZAL', shares: 300, avgCost: 112.00 },
  { symbol: 'ASELS', shares: 1500, avgCost: 45.20 },
  { symbol: 'EREGL', shares: 800, avgCost: 42.50 },
  { symbol: 'TCELL', shares: 400, avgCost: 78.00 },
];

export default function PortfoyPage() {
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>(defaultPortfolio);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newCost, setNewCost] = useState('');

  const holdings: EnrichedHolding[] = useMemo(() => {
    const result: EnrichedHolding[] = [];
    portfolio.forEach(h => {
      const stock = getStockBySymbol(h.symbol);
      if (!stock) return;
      const currentValue = stock.price * h.shares;
      const costBasis = h.avgCost * h.shares;
      const pnl = currentValue - costBasis;
      const pnlPercent = ((currentValue - costBasis) / costBasis) * 100;
      result.push({ ...h, stock, currentValue, costBasis, pnl, pnlPercent });
    });
    return result;
  }, [portfolio]);

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const todayPnl = holdings.reduce((sum, h) => sum + (h.stock.change * h.shares), 0);
  const todayPnlPercent = totalValue > 0 ? (todayPnl / (totalValue - todayPnl)) * 100 : 0;

  const addHolding = () => {
    if (!newSymbol || !newShares || !newCost) return;
    const stock = getStockBySymbol(newSymbol.toUpperCase());
    if (!stock) return;
    setPortfolio([...portfolio, {
      symbol: newSymbol.toUpperCase(),
      shares: parseInt(newShares),
      avgCost: parseFloat(newCost),
    }]);
    setNewSymbol('');
    setNewShares('');
    setNewCost('');
  };

  const removeHolding = (symbol: string) => {
    setPortfolio(portfolio.filter(h => h.symbol !== symbol));
  };

  return (
    <div className="container-main py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Portföy</h1>
        <p className="text-sm text-bist-textSecondary mt-1">Yatırımlarınızı tek ekranda takip edin</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Portföy Değeri"
          value={formatCurrency(totalValue)}
          change={todayPnlPercent}
          changeLabel="bugün"
          icon="◈"
          accentColor="#3b82f6"
        />
        <KPICard
          title="Toplam Kâr/Zarar"
          value={`${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)}`}
          change={totalPnlPercent}
          changeLabel="toplam"
          icon="◉"
          accentColor={totalPnl >= 0 ? '#10b981' : '#ef4444'}
        />
        <KPICard
          title="Günlük Kâr/Zarar"
          value={`${todayPnl >= 0 ? '+' : ''}${formatCurrency(todayPnl)}`}
          change={todayPnlPercent}
          changeLabel="bugün"
          icon="▲"
          accentColor={todayPnl >= 0 ? '#10b981' : '#ef4444'}
        />
        <KPICard
          title="Yatırım Maliyeti"
          value={formatCurrency(totalCost)}
          icon="◧"
          accentColor="#8b5cf6"
        />
      </div>

      {/* Portfolio Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table - 2/3 */}
        <div className="lg:col-span-2 bg-bist-card border border-bist-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-bist-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pozisyonlar</h2>
            <span className="text-xs text-bist-textMuted">{holdings.length} hisse</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bist-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-bist-textMuted">Hisse</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Adet</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Ort. Maliyet</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Fiyat</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Değer</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Kâr/Zarar</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">% K/Z</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-bist-textMuted">Günlük</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-bist-textMuted">Grafik</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-bist-textMuted"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bist-border/50">
                {holdings.sort((a, b) => b.currentValue - a.currentValue).map((h) => (
                  <tr key={h.symbol} className="card-hover">
                    <td className="px-4 py-3">
                      <Link href={`/hisseler/${h.symbol}`} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-bist-border flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-400">{h.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{h.symbol}</div>
                          <div className="text-[10px] text-bist-textMuted">{h.stock.sector}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-bist-textSecondary">{h.shares.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3 text-sm text-right text-bist-textSecondary">₺{formatPrice(h.avgCost)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">₺{formatPrice(h.stock.price)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(h.currentValue)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${getChangeColor(h.pnl)}`}>
                      {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getChangeBgColor(h.pnlPercent)} ${getChangeColor(h.pnlPercent)}`}>
                        {formatPercent(h.pnlPercent)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-center ${getChangeColor(h.stock.changePercent)}`}>
                      {formatPercent(h.stock.changePercent)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <MiniChart data={h.stock.priceHistory} width={64} height={24} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeHolding(h.symbol)}
                        className="text-bist-textMuted hover:text-red-400 text-xs transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Add Holding */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Hisse Ekle</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Sembol (THYAO)"
                className="w-full bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text placeholder-bist-textMuted focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="number"
                value={newShares}
                onChange={(e) => setNewShares(e.target.value)}
                placeholder="Adet"
                className="w-full bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text placeholder-bist-textMuted focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Ort. Maliyet (₺)"
                step="0.01"
                className="w-full bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text placeholder-bist-textMuted focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={addHolding}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Portfolio Distribution */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Dağılım</h3>
            <div className="space-y-2">
              {holdings
                .sort((a, b) => b.currentValue - a.currentValue)
                .map((h) => {
                  const percent = (h.currentValue / totalValue) * 100;
                  return (
                    <div key={h.symbol}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{h.symbol}</span>
                        <span className="text-xs text-bist-textMuted">%{percent.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-bist-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sector Distribution */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Sektör Dağılımı</h3>
            <div className="space-y-2">
              {(() => {
                const sectorValues = new Map<string, number>();
                holdings.forEach(h => {
                  const current = sectorValues.get(h.stock.sector) || 0;
                  sectorValues.set(h.stock.sector, current + h.currentValue);
                });
                return Array.from(sectorValues.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([sector, value]) => {
                    const percent = (value / totalValue) * 100;
                    return (
                      <div key={sector} className="flex items-center justify-between">
                        <span className="text-xs text-bist-textSecondary">{sector}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{formatCurrency(value)}</span>
                          <span className="text-[10px] text-bist-textMuted">%{percent.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
