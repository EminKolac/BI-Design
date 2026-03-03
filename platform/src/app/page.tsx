'use client';

import { stocks, getTopGainers, getTopLosers, getMostActive, getHighestDividend, getTopScored } from '@/data/stocks';
import { indices, marketSummary } from '@/data/indices';
import { calendarEvents } from '@/data/calendar';
import { formatNumber, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import IndexCard from '@/components/IndexCard';
import KPICard from '@/components/KPICard';
import StockTable from '@/components/StockTable';
import MiniChart from '@/components/MiniChart';
import Link from 'next/link';
import { useState } from 'react';

type TabKey = 'gainers' | 'losers' | 'active' | 'dividend' | 'topScore';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('gainers');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'gainers', label: 'En Çok Yükselen' },
    { key: 'losers', label: 'En Çok Düşen' },
    { key: 'active', label: 'En Yüksek Hacim' },
    { key: 'dividend', label: 'En Yüksek Temettü' },
    { key: 'topScore', label: 'En Yüksek Skor' },
  ];

  const tabData: Record<TabKey, typeof stocks> = {
    gainers: getTopGainers(8),
    losers: getTopLosers(8),
    active: getMostActive(8),
    dividend: getHighestDividend(8),
    topScore: getTopScored(8),
  };

  const upcomingEvents = calendarEvents.slice(0, 5);

  return (
    <div className="container-main py-6 space-y-6">
      {/* Market Summary Banner */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Borsa İstanbul</h1>
            <p className="text-sm text-bist-textSecondary">Piyasa verilerini takip edin, hisse analizi yapın, portföyünüzü yönetin</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-bist-textMuted text-xs">Yükselenler</span>
              <div className="text-emerald-400 font-bold text-lg">{marketSummary.advancers}</div>
            </div>
            <div className="w-px h-10 bg-bist-border"></div>
            <div>
              <span className="text-bist-textMuted text-xs">Düşenler</span>
              <div className="text-red-400 font-bold text-lg">{marketSummary.decliners}</div>
            </div>
            <div className="w-px h-10 bg-bist-border"></div>
            <div>
              <span className="text-bist-textMuted text-xs">Sabit</span>
              <div className="text-slate-400 font-bold text-lg">{marketSummary.unchanged}</div>
            </div>
            <div className="w-px h-10 bg-bist-border hidden sm:block"></div>
            <div className="hidden sm:block">
              <span className="text-bist-textMuted text-xs">Toplam Hacim</span>
              <div className="text-bist-text font-bold text-lg">₺{formatNumber(marketSummary.totalVolume)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {indices.map((index) => (
          <IndexCard key={index.name} index={index} />
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Toplam Piyasa Değeri"
          value={formatCurrency(marketSummary.totalMarketCap)}
          change={1.74}
          changeLabel="bugün"
          icon="◈"
          accentColor="#3b82f6"
        />
        <KPICard
          title="USD/TRY"
          value={marketSummary.usdTry.toFixed(2)}
          change={-0.35}
          changeLabel="bugün"
          icon="$"
          suffix="₺"
          accentColor="#10b981"
        />
        <KPICard
          title="Altın (gr)"
          value={`₺${formatNumber(marketSummary.goldTry)}`}
          change={1.25}
          changeLabel="bugün"
          icon="●"
          accentColor="#f59e0b"
        />
        <KPICard
          title="Brent Petrol"
          value={`$${marketSummary.brentOil.toFixed(2)}`}
          change={-0.82}
          changeLabel="bugün"
          icon="▲"
          accentColor="#8b5cf6"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Rankings - Left 2/3 */}
        <div className="lg:col-span-2 bg-bist-card border border-bist-border rounded-xl">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-4 pb-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-bist-textSecondary hover:text-bist-text hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="p-4">
            <StockTable
              stocks={tabData[activeTab]}
              columns={['symbol', 'price', 'change', 'volume', 'marketCap', 'pe', 'score', 'chart']}
              compact
            />
          </div>

          <div className="px-4 pb-4">
            <Link href="/hisseler" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              Tüm hisseleri görüntüle →
            </Link>
          </div>
        </div>

        {/* Right Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Yaklaşan Olaylar</h3>
              <Link href="/takvim" className="text-xs text-blue-400 hover:text-blue-300">
                Tümü →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    event.type === 'earnings' ? 'bg-blue-500/15 text-blue-400' :
                    event.type === 'dividend' ? 'bg-emerald-500/15 text-emerald-400' :
                    event.type === 'macro' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-slate-500/15 text-slate-400'
                  }`}>
                    {event.date.split('-')[2]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{event.title}</div>
                    <div className="text-[10px] text-bist-textMuted mt-0.5">
                      {new Date(event.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                    event.impact === 'high' ? 'bg-red-500/15 text-red-400' :
                    event.impact === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-slate-500/15 text-slate-400'
                  }`}>
                    {event.impact === 'high' ? 'Yüksek' : event.impact === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Scored Stocks */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">En Yüksek Skorlu Hisseler</h3>
            <div className="space-y-2">
              {getTopScored(5).map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/hisseler/${stock.symbol}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-bist-border flex items-center justify-center">
                      <span className="text-[9px] font-bold text-blue-400">{stock.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium">{stock.symbol}</div>
                      <div className="text-[10px] text-bist-textMuted">{stock.sector}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${getChangeColor(stock.changePercent)}`}>
                      {formatPercent(stock.changePercent)}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      stock.score.overall >= 70 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {stock.score.overall}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Macros */}
          <div className="bg-bist-card border border-bist-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4">Makro Göstergeler</h3>
            <div className="space-y-3">
              {[
                { label: 'USD/TRY', value: '38.42', change: -0.35 },
                { label: 'EUR/TRY', value: '41.85', change: 0.22 },
                { label: 'Altın (gram/TRY)', value: '3,245', change: 1.25 },
                { label: 'Brent Petrol', value: '$82.45', change: -0.82 },
                { label: 'DXY', value: '103.85', change: 0.15 },
                { label: 'Bitcoin', value: '$95,420', change: 2.45 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-bist-textSecondary">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{item.value}</span>
                    <span className={`text-[10px] font-medium ${getChangeColor(item.change)}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
