import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
  AreaChart, Area,
} from 'recharts';

// ─── Color Palette (Navy/Teal/Gold dark theme) ───
const COLORS = {
  bg: '#0B1120',
  card: '#111827',
  cardBorder: '#1E293B',
  text: '#E2E8F0',
  textMuted: '#7A8B99',
  textDim: '#475569',
  navy: '#1E3A5F',
  teal: '#0D9488',
  tealLight: '#2DD4BF',
  gold: '#C4A35A',
  goldLight: '#E5C97B',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  purple: '#8B5CF6',
  red: '#EF4444',
  redDark: '#7F1D1D',
  redMuted: '#DC2626',
  green: '#10B981',
  greenDark: '#064E3B',
  greenMuted: '#059669',
  orange: '#F59E0B',
  white: '#FFFFFF',
  gridLine: '#1E293B',
};

const SECTOR_COLORS = ['#3B82F6', '#0D9488', '#C4A35A', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1'];

// ─── Data ───
const sectorAllocation = [
  { name: 'Financial Services', value: 73, color: SECTOR_COLORS[0] },
  { name: 'Transport & Logistics', value: 11, color: SECTOR_COLORS[1] },
  { name: 'Energy', value: 10, color: SECTOR_COLORS[2] },
  { name: 'Technology & Telecom', value: 3, color: SECTOR_COLORS[3] },
  { name: 'Mining & Steel', value: 2, color: SECTOR_COLORS[4] },
  { name: 'Other', value: 1, color: SECTOR_COLORS[5] },
];

const months = ['Mar 25','Apr 25','May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26'];

const indexedPerformance = [
  { month: 'Mar 25', BIST100: 100, THYAO: 100, TTKOM: 100, HALKB: 100 },
  { month: 'Apr 25', BIST100: 103.2, THYAO: 104.1, TTKOM: 106.2, HALKB: 115.8 },
  { month: 'May 25', BIST100: 107.5, THYAO: 108.4, TTKOM: 111.1, HALKB: 131.6 },
  { month: 'Jun 25', BIST100: 110.8, THYAO: 112.9, TTKOM: 117.8, HALKB: 147.4 },
  { month: 'Jul 25', BIST100: 115.2, THYAO: 118.5, TTKOM: 122.2, HALKB: 157.9 },
  { month: 'Aug 25', BIST100: 112.3, THYAO: 115.7, TTKOM: 126.7, HALKB: 168.4 },
  { month: 'Sep 25', BIST100: 108.5, THYAO: 110.8, TTKOM: 131.1, HALKB: 178.9 },
  { month: 'Oct 25', BIST100: 113.7, THYAO: 121.3, TTKOM: 142.2, HALKB: 200.0 },
  { month: 'Nov 25', BIST100: 118.9, THYAO: 128.5, TTKOM: 151.1, HALKB: 215.8 },
  { month: 'Dec 25', BIST100: 120.4, THYAO: 130.1, TTKOM: 155.6, HALKB: 226.3 },
  { month: 'Jan 26', BIST100: 126.8, THYAO: 136.5, TTKOM: 164.4, HALKB: 242.1 },
  { month: 'Feb 26', BIST100: 131.2, THYAO: 141.4, TTKOM: 168.0, HALKB: 257.9 },
  { month: 'Mar 26', BIST100: 125.1, THYAO: 117.7, TTKOM: 131.1, HALKB: 252.6 },
];

const heatmapData = [
  { company: 'THYAO',  values: [4.1, 4.1, 4.2, 5.0, -2.4, -4.2, 9.5, 5.9, 1.2, 4.9, 3.6, -16.8] },
  { company: 'TTKOM',  values: [6.2, 4.6, 6.0, 3.7, 3.7, 3.5, 8.5, 6.3, 3.0, 5.7, 2.2, -22.0] },
  { company: 'HALKB',  values: [15.8, 13.7, 12.0, 7.1, 6.6, 6.2, 11.8, 7.9, 4.9, 7.0, 6.5, -2.1] },
  { company: 'VAKBN',  values: [10.2, 8.5, 9.0, 5.5, 4.8, 5.1, 9.2, 6.0, 3.5, 5.8, 4.2, -8.5] },
  { company: 'BIST100', values: [3.2, 4.2, 3.1, 4.0, -2.5, -3.4, 4.8, 4.6, 1.3, 5.3, 3.5, -4.7] },
];
const heatmapMonths = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const sectorContribution = [
  { sector: 'Financial Services', contribution: 15.2 },
  { sector: 'Transport & Logistics', contribution: 2.1 },
  { sector: 'Energy', contribution: 1.8 },
  { sector: 'Tech & Telecom', contribution: 1.5 },
  { sector: 'Mining & Steel', contribution: 0.4 },
  { sector: 'Other', contribution: 0.1 },
];

const macroData = [
  { month: 'Mar 25', rate: 42.5, cpi: 38.1, tryusd: 36.52, bond10y: 26.2 },
  { month: 'Apr 25', rate: 42.5, cpi: 35.2, tryusd: 37.10, bond10y: 26.8 },
  { month: 'May 25', rate: 42.5, cpi: 33.5, tryusd: 37.80, bond10y: 27.0 },
  { month: 'Jun 25', rate: 42.5, cpi: 32.0, tryusd: 38.40, bond10y: 27.5 },
  { month: 'Jul 25', rate: 42.5, cpi: 31.5, tryusd: 38.90, bond10y: 27.8 },
  { month: 'Aug 25', rate: 42.5, cpi: 32.0, tryusd: 39.50, bond10y: 28.0 },
  { month: 'Sep 25', rate: 40.0, cpi: 33.2, tryusd: 41.30, bond10y: 28.5 },
  { month: 'Oct 25', rate: 40.0, cpi: 35.8, tryusd: 41.80, bond10y: 29.0 },
  { month: 'Nov 25', rate: 39.5, cpi: 31.7, tryusd: 42.30, bond10y: 28.5 },
  { month: 'Dec 25', rate: 38.0, cpi: 30.9, tryusd: 42.80, bond10y: 28.0 },
  { month: 'Jan 26', rate: 37.0, cpi: 30.7, tryusd: 43.50, bond10y: 28.5 },
  { month: 'Feb 26', rate: 37.0, cpi: 31.5, tryusd: 43.90, bond10y: 30.5 },
  { month: 'Mar 26', rate: 37.0, cpi: 32.0, tryusd: 44.17, bond10y: 30.5 },
];

// ─── KPI Card Component ───
function KPICard({ label, value, subtext, color = COLORS.teal }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 8,
      padding: '20px 24px',
      minWidth: 180,
      flex: 1,
    }}>
      <div style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 300, fontFamily: "'Segoe UI Light', 'Segoe UI', sans-serif", lineHeight: 1.1 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 6 }}>{subtext}</div>
      )}
    </div>
  );
}

// ─── Heatmap Cell ───
function getHeatColor(val) {
  if (val >= 10) return '#059669';
  if (val >= 5) return '#10B981';
  if (val >= 2) return '#34D399';
  if (val >= 0) return '#6EE7B7';
  if (val >= -3) return '#FCA5A5';
  if (val >= -8) return '#EF4444';
  return '#DC2626';
}

function getHeatTextColor(val) {
  if (val >= 5 || val <= -8) return '#FFFFFF';
  return '#1F2937';
}

// ─── Custom Tooltip ───
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: 6,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: COLORS.text, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, marginBottom: 2 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </div>
      ))}
    </div>
  );
}

// ─── Sector Filter ───
function SectorFilter({ sectors, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {sectors.map((s) => (
        <button
          key={s}
          onClick={() => onToggle(s)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: `1px solid ${selected.includes(s) ? COLORS.teal : COLORS.cardBorder}`,
            background: selected.includes(s) ? 'rgba(13,148,136,0.15)' : 'transparent',
            color: selected.includes(s) ? COLORS.tealLight : COLORS.textMuted,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───
export default function TVFDashboard() {
  const allSectors = sectorAllocation.map(s => s.name);
  const [selectedSectors, setSelectedSectors] = useState(allSectors);
  const [hoveredSector, setHoveredSector] = useState(null);

  const toggleSector = (sector) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const filteredAllocation = useMemo(
    () => sectorAllocation.filter(s => selectedSectors.includes(s.name)),
    [selectedSectors]
  );

  const filteredContribution = useMemo(
    () => sectorContribution.filter(s => selectedSectors.some(sel => s.sector.startsWith(sel.substring(0, 5)))),
    [selectedSectors]
  );

  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: '100vh',
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: COLORS.white, margin: 0, fontFamily: "'Segoe UI Light', sans-serif" }}>
              Turkiye Wealth Fund
            </h1>
            <div style={{ color: COLORS.gold, fontSize: 14, fontWeight: 500, marginTop: 4, letterSpacing: 1 }}>
              EXECUTIVE DASHBOARD — MARCH 2026
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Last Updated</div>
            <div style={{ color: COLORS.text, fontSize: 16, fontWeight: 300 }}>17 March 2026</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPICard label="Total AUM" value="$360B" subtext="TRY 12.7 trillion" color={COLORS.white} />
        <KPICard label="YoY AUM Change" value="+36%" subtext="From $318B (2023)" color={COLORS.green} />
        <KPICard label="Best Performer" value="HALKB" subtext="+152.6% (12M)" color={COLORS.green} />
        <KPICard label="Worst Performer" value="THYAO" subtext="+17.7% (12M)" color={COLORS.orange} />
        <KPICard label="TRY/USD" value="44.17" subtext="-21.1% (12M)" color={COLORS.red} />
        <KPICard label="Policy Rate" value="37.0%" subtext="On hold (Mar)" color={COLORS.gold} />
        <KPICard label="Inflation (CPI)" value="31.5%" subtext="Feb 2026 YoY" color={COLORS.orange} />
      </div>

      {/* Sector Filter */}
      <SectorFilter sectors={allSectors} selected={selectedSectors} onToggle={toggleSector} />

      {/* Row 1: Donut + Line Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        {/* Donut Chart — Sector Allocation */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>
            Portfolio Allocation
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={filteredAllocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {filteredAllocation.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={hoveredSector && hoveredSector !== entry.name ? 0.3 : 1}
                    onMouseEnter={() => setHoveredSector(entry.name)}
                    onMouseLeave={() => setHoveredSector(null)}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ color: d.color, fontWeight: 600 }}>{d.name}</div>
                      <div style={{ color: COLORS.text }}>{d.value}%</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {filteredAllocation.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ color: COLORS.textMuted }}>{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart — Indexed Performance */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>
            12-Month Indexed Performance (Rebased to 100)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={indexedPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.gridLine }} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.gridLine }} domain={[80, 280]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="BIST100" stroke={COLORS.textMuted} strokeWidth={2} dot={false} strokeDasharray="5 5" name="BIST-100" />
              <Line type="monotone" dataKey="THYAO" stroke={COLORS.teal} strokeWidth={2} dot={false} name="THY" />
              <Line type="monotone" dataKey="TTKOM" stroke={COLORS.purple} strokeWidth={2} dot={false} name="Turk Telekom" />
              <Line type="monotone" dataKey="HALKB" stroke={COLORS.gold} strokeWidth={2} dot={false} name="Halkbank" />
              <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Heatmap + Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
        {/* Heatmap — Monthly Returns */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>
            12-Month Performance Heatmap (% Monthly Return)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: COLORS.textMuted, fontWeight: 500, borderBottom: `1px solid ${COLORS.cardBorder}` }}>Company</th>
                  {heatmapMonths.map(m => (
                    <th key={m} style={{ textAlign: 'center', padding: '6px 6px', color: COLORS.textMuted, fontWeight: 500, borderBottom: `1px solid ${COLORS.cardBorder}`, minWidth: 44 }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.company}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: COLORS.text, borderBottom: `1px solid ${COLORS.cardBorder}` }}>{row.company}</td>
                    {row.values.map((val, i) => (
                      <td
                        key={i}
                        title={`${row.company} ${heatmapMonths[i]}: ${val > 0 ? '+' : ''}${val}%`}
                        style={{
                          textAlign: 'center',
                          padding: '6px 4px',
                          background: getHeatColor(val),
                          color: getHeatTextColor(val),
                          fontWeight: 600,
                          fontSize: 11,
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          borderLeft: `1px solid ${COLORS.bg}`,
                          cursor: 'default',
                          transition: 'transform 0.1s',
                        }}
                      >
                        {val > 0 ? '+' : ''}{val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar Chart — Sector Contribution */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>
            Sector Contribution to Portfolio Return
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filteredContribution} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.gridLine }} unit="%" />
              <YAxis type="category" dataKey="sector" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.gridLine }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="contribution" name="Contribution %" radius={[0, 4, 4, 0]}>
                {filteredContribution.map((entry, index) => (
                  <Cell key={entry.sector} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Macro Indicators — Small Multiples */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>
          Macro Indicators — 12-Month Trend
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {/* CBRT Rate */}
          <div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>CBRT Policy Rate</div>
            <div style={{ color: COLORS.blue, fontSize: 22, fontWeight: 300, marginBottom: 8 }}>37.0%</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={macroData}>
                <defs>
                  <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="stepAfter" dataKey="rate" stroke={COLORS.blue} fill="url(#gradRate)" strokeWidth={2} dot={false} />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* CPI */}
          <div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>CPI Inflation (YoY)</div>
            <div style={{ color: COLORS.orange, fontSize: 22, fontWeight: 300, marginBottom: 8 }}>31.5%</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={macroData}>
                <defs>
                  <linearGradient id="gradCpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="cpi" stroke={COLORS.orange} fill="url(#gradCpi)" strokeWidth={2} dot={false} />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* TRY/USD */}
          <div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>TRY/USD</div>
            <div style={{ color: COLORS.red, fontSize: 22, fontWeight: 300, marginBottom: 8 }}>44.17</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={macroData}>
                <defs>
                  <linearGradient id="gradFx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="tryusd" stroke={COLORS.red} fill="url(#gradFx)" strokeWidth={2} dot={false} />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 10Y Bond Yield */}
          <div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>10Y Bond Yield</div>
            <div style={{ color: COLORS.purple, fontSize: 22, fontWeight: 300, marginBottom: 8 }}>30.5%</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={macroData}>
                <defs>
                  <linearGradient id="gradBond" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="bond10y" stroke={COLORS.purple} fill="url(#gradBond)" strokeWidth={2} dot={false} />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, padding: '16px 0', borderTop: `1px solid ${COLORS.cardBorder}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ color: COLORS.textDim, fontSize: 11 }}>
          Sources: TWF Official, CBRT, TurkStat, Trading Economics, Yahoo Finance, Investing.com
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 11 }}>
          Disclaimer: This dashboard is for informational purposes only and does not constitute financial advice.
        </div>
      </div>
    </div>
  );
}
