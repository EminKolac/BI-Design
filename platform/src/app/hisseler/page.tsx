'use client';

import { useState, useMemo } from 'react';
import { stocks } from '@/data/stocks';
import StockTable from '@/components/StockTable';

type SortKey = 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'pe' | 'pb' | 'dividendYield' | 'roe' | 'score';

export default function HisselerPage() {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sectors = useMemo(() => {
    const s = new Set(stocks.map(st => st.sector));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    let result = [...stocks];

    if (search) {
      const q = search.toUpperCase();
      result = result.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
    }

    if (sectorFilter) {
      result = result.filter(s => s.sector === sectorFilter);
    }

    result.sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortBy === 'symbol') {
        return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (sortBy === 'score') {
        aVal = a.score.overall;
        bVal = b.score.overall;
      } else {
        aVal = a[sortBy] as number;
        bVal = b[sortBy] as number;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [search, sectorFilter, sortBy, sortDir]);

  return (
    <div className="container-main py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hisseler</h1>
        <p className="text-sm text-bist-textSecondary mt-1">Borsa İstanbul&apos;da işlem gören tüm hisseler</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-bist-card border border-bist-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hisse adı veya kodu ara..."
              className="w-full bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text placeholder-bist-textMuted focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text focus:outline-none focus:border-blue-500/50 transition-all"
          >
            <option value="">Tüm Sektörler</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text focus:outline-none focus:border-blue-500/50 transition-all"
          >
            <option value="marketCap">Piyasa Değeri</option>
            <option value="changePercent">Değişim %</option>
            <option value="volume">Hacim</option>
            <option value="pe">F/K Oranı</option>
            <option value="pb">PD/DD</option>
            <option value="dividendYield">Temettü Verimi</option>
            <option value="roe">ROE</option>
            <option value="score">Skor</option>
            <option value="symbol">Sembol</option>
          </select>

          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition-all"
          >
            {sortDir === 'desc' ? '↓ Azalan' : '↑ Artan'}
          </button>

          {/* Count */}
          <div className="text-xs text-bist-textMuted ml-auto">
            {filtered.length} hisse
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-bist-card border border-bist-border rounded-xl overflow-hidden">
        <StockTable
          stocks={filtered}
          columns={['symbol', 'price', 'change', 'volume', 'marketCap', 'pe', 'pb', 'dividendYield', 'roe', 'score', 'chart']}
        />
      </div>
    </div>
  );
}
