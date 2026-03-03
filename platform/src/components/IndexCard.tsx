'use client';

import { IndexData } from '@/types';
import { formatNumber, getChangeColor } from '@/lib/utils';
import MiniChart from './MiniChart';

interface IndexCardProps {
  index: IndexData;
}

export default function IndexCard({ index }: IndexCardProps) {
  const isPositive = index.changePercent >= 0;

  return (
    <div className="bg-bist-card border border-bist-border rounded-xl p-4 card-hover min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-bist-textMuted">{index.name}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {isPositive ? '▲' : '▼'} {Math.abs(index.changePercent).toFixed(2)}%
        </span>
      </div>
      <div className="text-xl font-bold mb-1">{formatNumber(index.value)}</div>
      <div className={`text-xs ${getChangeColor(index.change)} mb-3`}>
        {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
      </div>
      <div className="h-8">
        <MiniChart data={index.sparkline} width={180} height={32} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-bist-textMuted">
        <span>Hacim: ₺{formatNumber(index.volume)}</span>
        <span>{formatNumber(index.low)} - {formatNumber(index.high)}</span>
      </div>
    </div>
  );
}
