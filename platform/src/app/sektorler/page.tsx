'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { stocks } from '@/data/stocks';
import { Sector } from '@/types';
import { formatCurrency, formatNumber, formatPercent, getChangeColor } from '@/lib/utils';
import StockTable from '@/components/StockTable';

export default function SektorlerPage() {
  const [selectedSector, setSelectedSector] = useState<string>('');

  const sectors: Sector[] = useMemo(() => {
    const sectorMap = new Map<string, typeof stocks>();

    stocks.forEach(stock => {
      const list = sectorMap.get(stock.sector) || [];
      list.push(stock);
      sectorMap.set(stock.sector, list);
    });

    return Array.from(sectorMap.entries()).map(([name, sectorStocks]) => {
      const totalMarketCap = sectorStocks.reduce((sum, s) => sum + s.marketCap, 0);
      const avgPE = sectorStocks.reduce((sum, s) => sum + s.pe, 0) / sectorStocks.length;
      const avgPB = sectorStocks.reduce((sum, s) => sum + s.pb, 0) / sectorStocks.length;
      const avgROE = sectorStocks.reduce((sum, s) => sum + s.roe, 0) / sectorStocks.length;
      const avgDividendYield = sectorStocks.reduce((sum, s) => sum + s.dividendYield, 0) / sectorStocks.length;
      const weightedChange = sectorStocks.reduce((sum, s) => sum + s.changePercent * s.marketCap, 0) / totalMarketCap;

      return {
        name,
        stockCount: sectorStocks.length,
        totalMarketCap,
        avgPE,
        avgPB,
        avgROE,
        avgDividendYield,
        change: weightedChange,
        changePercent: weightedChange,
        topStocks: sectorStocks
          .sort((a, b) => b.marketCap - a.marketCap)
          .slice(0, 3)
          .map(s => s.symbol),
      };
    }).sort((a, b) => b.totalMarketCap - a.totalMarketCap);
  }, []);

  const sectorStocks = useMemo(() => {
    if (!selectedSector) return [];
    return stocks.filter(s => s.sector === selectedSector).sort((a, b) => b.marketCap - a.marketCap);
  }, [selectedSector]);

  const totalMarketCap = sectors.reduce((sum, s) => sum + s.totalMarketCap, 0);

  return (
    <div className="container-main py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sektörler</h1>
        <p className="text-sm text-bist-textSecondary mt-1">
          BIST sektör bazlı performans analizi ve karşılaştırma
        </p>
      </div>

      {/* Sector Treemap */}
      <div className="bg-bist-card border border-bist-border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-4">Sektör Haritası</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sectors.map((sector, i) => {
            const sizePercent = (sector.totalMarketCap / totalMarketCap) * 100;
            const colors = [
              'from-blue-600/30 to-blue-700/10',
              'from-purple-600/30 to-purple-700/10',
              'from-emerald-600/30 to-emerald-700/10',
              'from-amber-600/30 to-amber-700/10',
              'from-rose-600/30 to-rose-700/10',
              'from-cyan-600/30 to-cyan-700/10',
              'from-indigo-600/30 to-indigo-700/10',
              'from-teal-600/30 to-teal-700/10',
            ];
            const borderColors = [
              'border-blue-500/30',
              'border-purple-500/30',
              'border-emerald-500/30',
              'border-amber-500/30',
              'border-rose-500/30',
              'border-cyan-500/30',
              'border-indigo-500/30',
              'border-teal-500/30',
            ];

            return (
              <button
                key={sector.name}
                onClick={() => setSelectedSector(selectedSector === sector.name ? '' : sector.name)}
                className={`p-4 rounded-xl border bg-gradient-to-br ${colors[i % colors.length]} ${
                  selectedSector === sector.name ? 'border-blue-400 ring-1 ring-blue-400/30' : borderColors[i % borderColors.length]
                } text-left transition-all hover:scale-[1.02] active:scale-[0.98]`}
                style={{ minHeight: `${Math.max(80, sizePercent * 3)}px` }}
              >
                <div className="text-xs font-semibold mb-1">{sector.name}</div>
                <div className="text-lg font-bold">{formatCurrency(sector.totalMarketCap)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${getChangeColor(sector.changePercent)}`}>
                    {formatPercent(sector.changePercent)}
                  </span>
                  <span className="text-[10px] text-bist-textMuted">{sector.stockCount} hisse</span>
                </div>
                <div className="text-[10px] text-bist-textMuted mt-1">
                  %{sizePercent.toFixed(1)} piyasa payı
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sector Comparison Table */}
      <div className="bg-bist-card border border-bist-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-bist-border">
          <h2 className="text-sm font-semibold">Sektör Karşılaştırması</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bist-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-bist-textMuted">Sektör</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Hisse Sayısı</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Piyasa Değeri</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Değişim</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Ort. F/K</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Ort. PD/DD</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Ort. ROE</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-bist-textMuted">Ort. Temettü</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-bist-textMuted">Öne Çıkanlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bist-border/50">
              {sectors.map((sector) => (
                <tr
                  key={sector.name}
                  className={`card-hover cursor-pointer ${selectedSector === sector.name ? 'bg-blue-500/5' : ''}`}
                  onClick={() => setSelectedSector(selectedSector === sector.name ? '' : sector.name)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{sector.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-bist-textSecondary">{sector.stockCount}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(sector.totalMarketCap)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${getChangeColor(sector.changePercent)}`}>
                    {formatPercent(sector.changePercent)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-bist-textSecondary">{sector.avgPE.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-right text-bist-textSecondary">{sector.avgPB.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-sm text-right ${sector.avgROE > 20 ? 'text-emerald-400' : 'text-bist-textSecondary'}`}>
                    %{sector.avgROE.toFixed(1)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${sector.avgDividendYield > 4 ? 'text-emerald-400' : 'text-bist-textSecondary'}`}>
                    %{sector.avgDividendYield.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {sector.topStocks.map(sym => (
                        <Link
                          key={sym}
                          href={`/hisseler/${sym}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-blue-400 hover:bg-white/10 transition-colors"
                        >
                          {sym}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Sector Detail */}
      {selectedSector && sectorStocks.length > 0 && (
        <div className="bg-bist-card border border-bist-border rounded-xl overflow-hidden fade-in">
          <div className="p-4 border-b border-bist-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">{selectedSector} Sektörü Hisseleri</h2>
            <button
              onClick={() => setSelectedSector('')}
              className="text-xs text-bist-textMuted hover:text-bist-text"
            >
              Kapat
            </button>
          </div>
          <StockTable
            stocks={sectorStocks}
            columns={['symbol', 'price', 'change', 'volume', 'marketCap', 'pe', 'roe', 'dividendYield', 'score', 'chart']}
          />
        </div>
      )}
    </div>
  );
}
