'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getStockBySymbol } from '@/data/stocks';
import { formatPrice, formatCurrency, formatNumber, formatPercent, getChangeColor, getChangeBgColor, getScoreColor, getScoreBgColor } from '@/lib/utils';
import MiniChart from '@/components/MiniChart';
import ScoreCard from '@/components/ScoreCard';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();
  const stock = getStockBySymbol(symbol);

  if (!stock) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Hisse Bulunamadı</h1>
        <p className="text-bist-textSecondary mb-4">&quot;{symbol}&quot; sembolü ile eşleşen hisse bulunamadı.</p>
        <Link href="/hisseler" className="text-blue-400 hover:text-blue-300 text-sm">← Hisselere Dön</Link>
      </div>
    );
  }

  const ratios = [
    { label: 'F/K Oranı', value: stock.pe.toFixed(1), desc: 'Fiyat/Kazanç' },
    { label: 'PD/DD', value: stock.pb.toFixed(2), desc: 'Piyasa Değeri/Defter Değeri' },
    { label: 'ROE', value: `%${stock.roe.toFixed(1)}`, desc: 'Özsermaye Kârlılığı' },
    { label: 'Net Marj', value: `%${stock.netMargin.toFixed(1)}`, desc: 'Net Kâr Marjı' },
    { label: 'Borç/Özsermaye', value: stock.debtToEquity.toFixed(2), desc: 'Kaldıraç Oranı' },
    { label: 'Cari Oran', value: stock.currentRatio.toFixed(1), desc: 'Kısa Vadeli Likidite' },
    { label: 'Temettü Verimi', value: `%${stock.dividendYield.toFixed(1)}`, desc: 'Yıllık Temettü/Fiyat' },
    { label: 'HBK (EPS)', value: `₺${stock.eps.toFixed(2)}`, desc: 'Hisse Başına Kâr' },
  ];

  const financials = [
    { label: 'Gelir (Ciro)', value: formatCurrency(stock.revenue), growth: stock.revenueGrowth },
    { label: 'Net Kâr', value: formatCurrency(stock.netIncome), growth: stock.netIncomeGrowth },
    { label: 'Özsermaye', value: formatCurrency(stock.equity) },
    { label: 'Toplam Varlıklar', value: formatCurrency(stock.totalAssets) },
    { label: 'Toplam Borç', value: formatCurrency(stock.totalDebt) },
    { label: 'Serbest Nakit Akışı', value: formatCurrency(stock.freeCashFlow) },
  ];

  return (
    <div className="container-main py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-bist-textMuted">
        <Link href="/hisseler" className="hover:text-bist-text">Hisseler</Link>
        <span>/</span>
        <span className="text-bist-text">{stock.symbol}</span>
      </div>

      {/* Stock Header */}
      <div className="bg-bist-card border border-bist-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-bist-border flex items-center justify-center">
              <span className="text-xl font-bold text-blue-400">{stock.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{stock.symbol}</h1>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getScoreBgColor(stock.score.overall)}`}>
                  Skor: {stock.score.overall}
                </span>
              </div>
              <p className="text-sm text-bist-textSecondary">{stock.name}</p>
              <p className="text-xs text-bist-textMuted mt-1">{stock.sector} • {stock.subSector}</p>
            </div>
          </div>

          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold">₺{formatPrice(stock.price)}</div>
              <div className={`flex items-center gap-2 mt-1 justify-end ${getChangeColor(stock.changePercent)}`}>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${getChangeBgColor(stock.changePercent)}`}>
                  {stock.changePercent >= 0 ? '▲' : '▼'} {formatPercent(stock.changePercent)}
                </span>
                <span className="text-sm">
                  {stock.change >= 0 ? '+' : ''}₺{stock.change.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <MiniChart data={stock.priceHistory} width={160} height={60} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-bist-border">
          {[
            { label: 'Piyasa Değeri', value: formatCurrency(stock.marketCap) },
            { label: 'Hacim', value: `₺${formatNumber(stock.volume)}` },
            { label: '52H Yüksek', value: `₺${formatPrice(stock.weekHigh52)}` },
            { label: '52H Düşük', value: `₺${formatPrice(stock.weekLow52)}` },
            { label: 'F/K', value: stock.pe.toFixed(1) },
            { label: 'Temettü', value: `%${stock.dividendYield.toFixed(1)}` },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[10px] text-bist-textMuted uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-semibold mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Ratios */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Finansal Oranlar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ratios.map((ratio) => (
                <div key={ratio.label} className="p-3 bg-white/[0.02] border border-bist-border/50 rounded-lg">
                  <div className="text-xs text-bist-textMuted mb-1">{ratio.label}</div>
                  <div className="text-lg font-bold">{ratio.value}</div>
                  <div className="text-[10px] text-bist-textMuted mt-1">{ratio.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Finansal Özet</h2>
            <div className="space-y-3">
              {financials.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-bist-border/50 last:border-0">
                  <span className="text-sm text-bist-textSecondary">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{item.value}</span>
                    {item.growth !== undefined && (
                      <span className={`text-xs font-medium ${getChangeColor(item.growth)}`}>
                        {formatPercent(item.growth)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quarterly Revenue Chart */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Çeyreklik Gelir</h2>
            <div className="flex items-end gap-2 h-48">
              {stock.quarterlyRevenue.map((q, i) => {
                const maxVal = Math.max(...stock.quarterlyRevenue.map(r => r.value));
                const height = (q.value / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-bist-textMuted">{formatNumber(q.value)}</div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <div className="text-[9px] text-bist-textMuted">{q.quarter}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quarterly Net Income */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Çeyreklik Net Kâr</h2>
            <div className="flex items-end gap-2 h-48">
              {stock.quarterlyNetIncome.map((q, i) => {
                const maxVal = Math.max(...stock.quarterlyNetIncome.map(r => Math.abs(r.value)));
                const height = (Math.abs(q.value) / maxVal) * 100;
                const isPositive = q.value >= 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-bist-textMuted">{formatNumber(q.value)}</div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isPositive
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300'
                          : 'bg-gradient-to-t from-red-600 to-red-400 hover:from-red-500 hover:to-red-300'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <div className="text-[9px] text-bist-textMuted">{q.quarter}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dividend History */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Temettü Geçmişi</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bist-border">
                    <th className="text-left py-2 text-xs font-medium text-bist-textMuted">Yıl</th>
                    <th className="text-right py-2 text-xs font-medium text-bist-textMuted">Brüt Temettü (₺)</th>
                    <th className="text-right py-2 text-xs font-medium text-bist-textMuted">Temettü Verimi (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.dividendHistory.map((d) => (
                    <tr key={d.year} className="border-b border-bist-border/30">
                      <td className="py-2 text-sm font-medium">{d.year}</td>
                      <td className="py-2 text-sm text-right">₺{d.amount.toFixed(2)}</td>
                      <td className="py-2 text-sm text-right text-emerald-400">%{d.yield.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">Karne</h2>
            <ScoreCard score={stock.score} size="lg" />
          </div>

          {/* 52 Week Range */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">52 Hafta Aralığı</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400">₺{formatPrice(stock.weekLow52)}</span>
                <span className="text-emerald-400">₺{formatPrice(stock.weekHigh52)}</span>
              </div>
              <div className="relative h-2 bg-bist-border rounded-full">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full"
                  style={{
                    width: `${((stock.price - stock.weekLow52) / (stock.weekHigh52 - stock.weekLow52)) * 100}%`
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 shadow-lg"
                  style={{
                    left: `${((stock.price - stock.weekLow52) / (stock.weekHigh52 - stock.weekLow52)) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>
              <div className="text-center text-sm font-medium">
                ₺{formatPrice(stock.price)}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Önemli Göstergeler</h2>
            <div className="space-y-3">
              {[
                { label: 'Gelir Büyümesi', value: formatPercent(stock.revenueGrowth), positive: stock.revenueGrowth > 0 },
                { label: 'Kâr Büyümesi', value: formatPercent(stock.netIncomeGrowth), positive: stock.netIncomeGrowth > 0 },
                { label: 'Özsermaye Kârlılığı', value: `%${stock.roe.toFixed(1)}`, positive: stock.roe > 15 },
                { label: 'Net Kâr Marjı', value: `%${stock.netMargin.toFixed(1)}`, positive: stock.netMargin > 10 },
                { label: 'Borç/Özsermaye', value: stock.debtToEquity.toFixed(2), positive: stock.debtToEquity < 0.5 },
                { label: 'Cari Oran', value: stock.currentRatio.toFixed(1), positive: stock.currentRatio > 1.5 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-bist-textSecondary">{item.label}</span>
                  <span className={`text-xs font-medium ${item.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">30 Günlük Fiyat</h2>
            <MiniChart data={stock.priceHistory} width={300} height={120} />
          </div>
        </div>
      </div>
    </div>
  );
}
