import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'BIST Monitor - Borsa İstanbul Veri Platformu',
  description: 'Borsa İstanbul hisse senedi takip, analiz ve portföy yönetim platformu. Anlık veriler, finansal tablolar, sektör analizleri.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
