export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

export function formatCurrency(num: number, currency: string = 'TRY'): string {
  if (currency === 'TRY') {
    return '₺' + formatNumber(num);
  }
  return '$' + formatNumber(num);
}

export function formatPercent(num: number): string {
  const prefix = num >= 0 ? '+' : '';
  return prefix + num.toFixed(2) + '%';
}

export function formatPrice(num: number): string {
  if (num >= 1000) return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num >= 100) return num.toFixed(2);
  if (num >= 10) return num.toFixed(2);
  return num.toFixed(2);
}

export function formatVolume(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
  return num.toString();
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 60) return 'bg-blue-500/20 border-blue-500/30';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/30';
  if (score >= 20) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function getChangeBgColor(value: number): string {
  if (value > 0) return 'bg-emerald-500/10';
  if (value < 0) return 'bg-red-500/10';
  return 'bg-slate-500/10';
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateSparkline(basePrice: number, points: number = 20): number[] {
  const data: number[] = [basePrice];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.48) * basePrice * 0.03;
    data.push(Math.max(data[i - 1] + change, basePrice * 0.85));
  }
  return data;
}
