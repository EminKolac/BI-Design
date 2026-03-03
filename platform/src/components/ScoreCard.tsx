'use client';

import { StockScore } from '@/types';
import { getScoreColor } from '@/lib/utils';

interface ScoreCardProps {
  score: StockScore;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreCard({ score, size = 'md' }: ScoreCardProps) {
  const dimensions = {
    sm: { svgSize: 64, radius: 26, strokeWidth: 4, fontSize: 'text-lg' },
    md: { svgSize: 96, radius: 38, strokeWidth: 5, fontSize: 'text-2xl' },
    lg: { svgSize: 128, radius: 52, strokeWidth: 6, fontSize: 'text-3xl' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const progress = (score.overall / 100) * circumference;
  const dashOffset = circumference - progress;

  const categories = [
    { label: 'Kârlılık', value: score.profitability, color: '#10b981' },
    { label: 'Büyüme', value: score.growth, color: '#3b82f6' },
    { label: 'Finansal', value: score.financial, color: '#8b5cf6' },
    { label: 'Değerleme', value: score.valuation, color: '#f59e0b' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Score Circle */}
      <div className="relative">
        <svg width={dimensions.svgSize} height={dimensions.svgSize} className="-rotate-90">
          <circle
            cx={dimensions.svgSize / 2}
            cy={dimensions.svgSize / 2}
            r={dimensions.radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={dimensions.strokeWidth}
          />
          <circle
            cx={dimensions.svgSize / 2}
            cy={dimensions.svgSize / 2}
            r={dimensions.radius}
            fill="none"
            stroke={score.overall >= 70 ? '#10b981' : score.overall >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={dimensions.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="score-ring"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${dimensions.fontSize} font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}
          </span>
        </div>
      </div>

      {/* Category Scores */}
      <div className="w-full space-y-2">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2">
            <span className="text-xs text-bist-textSecondary w-20">{cat.label}</span>
            <div className="flex-1 h-1.5 bg-bist-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right" style={{ color: cat.color }}>
              {cat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
