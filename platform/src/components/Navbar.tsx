'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Pano', icon: '◈' },
  { href: '/hisseler', label: 'Hisseler', icon: '◉' },
  { href: '/radar', label: 'Radar', icon: '◎' },
  { href: '/sektorler', label: 'Sektörler', icon: '▦' },
  { href: '/portfoy', label: 'Portföy', icon: '◧' },
  { href: '/takvim', label: 'Takvim', icon: '▣' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-bist-border">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              BM
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">BIST Monitor</span>
              <span className="hidden sm:inline text-xs text-bist-textMuted ml-2">Borsa İstanbul</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'text-bist-textSecondary hover:text-bist-text hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Market Status */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow"></span>
                <span className="text-emerald-400 font-medium">Piyasa Açık</span>
              </div>
              <span className="text-bist-textMuted">|</span>
              <span className="text-bist-textSecondary">USD/TRY: <span className="text-bist-text font-medium">38.42</span></span>
              <span className="text-bist-textMuted">|</span>
              <span className="text-bist-textSecondary">EUR/TRY: <span className="text-bist-text font-medium">41.85</span></span>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Hisse ara... (THYAO)"
                className="w-44 lg:w-56 bg-white/5 border border-bist-border rounded-lg px-3 py-2 text-sm text-bist-text placeholder-bist-textMuted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-bist-textMuted text-xs">⌘K</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-bist-textSecondary hover:text-bist-text'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
