'use client';

import { useState, useMemo } from 'react';
import { stocks } from '@/data/stocks';
import { FilterCriteria } from '@/types';
import StockTable from '@/components/StockTable';

interface FilterDef {
  key: keyof FilterCriteria;
  label: string;
  type: 'range' | 'select';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
}

const filterDefinitions: FilterDef[] = [
  { key: 'sector', label: 'Sektör', type: 'select', options: [] },
  { key: 'minPE', label: 'Min F/K', type: 'range', min: 0, max: 100, step: 0.5, unit: '' },
  { key: 'maxPE', label: 'Max F/K', type: 'range', min: 0, max: 100, step: 0.5, unit: '' },
  { key: 'minPB', label: 'Min PD/DD', type: 'range', min: 0, max: 20, step: 0.1, unit: '' },
  { key: 'maxPB', label: 'Max PD/DD', type: 'range', min: 0, max: 20, step: 0.1, unit: '' },
  { key: 'minROE', label: 'Min ROE (%)', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'minDividendYield', label: 'Min Temettü (%)', type: 'range', min: 0, max: 20, step: 0.5, unit: '%' },
  { key: 'minNetMargin', label: 'Min Net Marj (%)', type: 'range', min: 0, max: 60, step: 1, unit: '%' },
  { key: 'maxDebtToEquity', label: 'Max Borç/Öz', type: 'range', min: 0, max: 5, step: 0.1, unit: '' },
  { key: 'minScore', label: 'Min Skor', type: 'range', min: 0, max: 100, step: 5, unit: '' },
];

const presets = [
  { name: 'Değer Yatırımı', criteria: { maxPE: 10, minDividendYield: 4, minROE: 15 } },
  { name: 'Büyüme Hisseleri', criteria: { minROE: 25, minNetMargin: 10, minScore: 70 } },
  { name: 'Temettü Avcısı', criteria: { minDividendYield: 5, maxDebtToEquity: 0.5 } },
  { name: 'Düşük Borçlu', criteria: { maxDebtToEquity: 0.3, minScore: 60 } },
  { name: 'Yüksek Kalite', criteria: { minScore: 75, minROE: 20, minNetMargin: 10 } },
];

export default function RadarPage() {
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [activePreset, setActivePreset] = useState<string>('');

  const sectors = useMemo(() => {
    const s = new Set(stocks.map(st => st.sector));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    return stocks.filter(stock => {
      if (filters.sector && stock.sector !== filters.sector) return false;
      if (filters.minPE !== undefined && stock.pe < filters.minPE) return false;
      if (filters.maxPE !== undefined && stock.pe > filters.maxPE) return false;
      if (filters.minPB !== undefined && stock.pb < filters.minPB) return false;
      if (filters.maxPB !== undefined && stock.pb > filters.maxPB) return false;
      if (filters.minROE !== undefined && stock.roe < filters.minROE) return false;
      if (filters.minDividendYield !== undefined && stock.dividendYield < filters.minDividendYield) return false;
      if (filters.minNetMargin !== undefined && stock.netMargin < filters.minNetMargin) return false;
      if (filters.maxDebtToEquity !== undefined && stock.debtToEquity > filters.maxDebtToEquity) return false;
      if (filters.minScore !== undefined && stock.score.overall < filters.minScore) return false;
      return true;
    });
  }, [filters]);

  const updateFilter = (key: keyof FilterCriteria, value: string) => {
    setActivePreset('');
    if (value === '' || value === undefined) {
      const next = { ...filters };
      delete next[key];
      setFilters(next);
    } else if (key === 'sector') {
      setFilters({ ...filters, sector: value });
    } else {
      setFilters({ ...filters, [key]: parseFloat(value) });
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setActivePreset(preset.name);
    setFilters(preset.criteria as FilterCriteria);
  };

  const clearFilters = () => {
    setFilters({});
    setActivePreset('');
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k as keyof FilterCriteria] !== undefined).length;

  return (
    <div className="container-main py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Radar</h1>
        <p className="text-sm text-bist-textSecondary mt-1">
          Onlarca kriter arasından seçim yaparak kriterlerinize uyan şirketleri saniyeler içinde bulun
        </p>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-bist-textMuted shrink-0">Hazır Filtreler:</span>
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              activePreset === preset.name
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-white/5 text-bist-textSecondary border-bist-border hover:text-bist-text hover:bg-white/10'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Filter Grid */}
      <div className="bg-bist-card border border-bist-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Filtreler</h2>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                {activeFilterCount} aktif filtre
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-bist-textMuted hover:text-bist-text transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filterDefinitions.map((def) => (
            <div key={def.key} className="space-y-1.5">
              <label className="text-xs text-bist-textMuted">{def.label}</label>
              {def.key === 'sector' ? (
                <select
                  value={(filters.sector as string) || ''}
                  onChange={(e) => updateFilter('sector', e.target.value)}
                  className="w-full bg-white/5 border border-bist-border rounded-lg px-2 py-1.5 text-sm text-bist-text focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Tümü</option>
                  {sectors.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={filters[def.key] !== undefined ? String(filters[def.key]) : ''}
                  onChange={(e) => updateFilter(def.key, e.target.value)}
                  placeholder={`${def.min || 0}`}
                  step={def.step}
                  min={def.min}
                  max={def.max}
                  className="w-full bg-white/5 border border-bist-border rounded-lg px-2 py-1.5 text-sm text-bist-text focus:outline-none focus:border-blue-500/50"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="bg-bist-card border border-bist-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-bist-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Sonuçlar</h2>
          <span className="text-xs text-bist-textMuted">{filtered.length} hisse bulundu</span>
        </div>
        {filtered.length > 0 ? (
          <StockTable
            stocks={filtered}
            columns={['symbol', 'price', 'change', 'pe', 'pb', 'dividendYield', 'roe', 'netMargin', 'debtToEquity', 'score', 'chart']}
          />
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">◎</div>
            <p className="text-sm text-bist-textSecondary">Belirlenen kriterlere uygun hisse bulunamadı.</p>
            <p className="text-xs text-bist-textMuted mt-1">Filtreleri genişletmeyi deneyin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
