'use client';

import { getChangeColor, getChangeBgColor } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  suffix?: string;
  accentColor?: string;
}

export default function KPICard({ title, value, change, changeLabel, icon, suffix, accentColor }: KPICardProps) {
  return (
    <div className="bg-bist-card border border-bist-border rounded-xl p-4 card-hover">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-bist-textMuted uppercase tracking-wider">{title}</span>
        {icon && (
          <span className="text-lg" style={{ color: accentColor }}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight" style={{ color: accentColor }}>
          {value}
        </span>
        {suffix && <span className="text-sm text-bist-textMuted mb-0.5">{suffix}</span>}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md w-fit ${getChangeBgColor(change)}`}>
          <span className={`text-xs font-medium ${getChangeColor(change)}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-[10px] text-bist-textMuted">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
