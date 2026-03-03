'use client';

import { useState, useMemo } from 'react';
import { calendarEvents } from '@/data/calendar';
import { CalendarEvent } from '@/types';

type EventFilter = 'all' | 'earnings' | 'dividend' | 'macro' | 'ipo' | 'general';

const eventTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  earnings: { label: 'Bilanço', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  dividend: { label: 'Temettü', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  macro: { label: 'Makro', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/20' },
  ipo: { label: 'Halka Arz', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20' },
  general: { label: 'Genel', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/20' },
};

const impactLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'Yüksek Etki', color: 'text-red-400' },
  medium: { label: 'Orta Etki', color: 'text-yellow-400' },
  low: { label: 'Düşük Etki', color: 'text-slate-400' },
};

export default function TakvimPage() {
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filtered = useMemo(() => {
    let events = [...calendarEvents];
    if (filter !== 'all') {
      events = events.filter(e => e.type === filter);
    }
    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate);
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [filter, selectedDate]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    filtered.forEach(event => {
      const list = groups.get(event.date) || [];
      list.push(event);
      groups.set(event.date, list);
    });
    return Array.from(groups.entries());
  }, [filtered]);

  // Calendar month data
  const calendarDays = useMemo(() => {
    const year = 2026;
    const month = 2; // March (0-indexed)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; hasEvents: boolean; eventCount: number; date: string }[] = [];

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ day: 0, hasEvents: false, eventCount: 0, date: '' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter(e => e.date === dateStr);
      days.push({
        day,
        hasEvents: dayEvents.length > 0,
        eventCount: dayEvents.length,
        date: dateStr,
      });
    }

    return days;
  }, []);

  const filterTabs: { key: EventFilter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'earnings', label: 'Bilanço' },
    { key: 'dividend', label: 'Temettü' },
    { key: 'macro', label: 'Makro' },
    { key: 'general', label: 'Genel' },
  ];

  return (
    <div className="container-main py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ekonomik Takvim</h1>
        <p className="text-sm text-bist-textSecondary mt-1">
          Bilanço açıklamaları, temettü dağıtımları, makroekonomik veriler ve daha fazlası
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - Left */}
        <div className="bg-bist-card border border-bist-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">Mart 2026</h2>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="text-center text-[10px] text-bist-textMuted font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              if (d.day === 0) return <div key={`empty-${i}`} />;

              const isToday = d.date === '2026-03-03';
              const isSelected = d.date === selectedDate;

              return (
                <button
                  key={d.day}
                  onClick={() => setSelectedDate(selectedDate === d.date ? '' : d.date)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isToday
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : d.hasEvents
                      ? 'hover:bg-white/10 text-bist-text'
                      : 'text-bist-textMuted hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-medium">{d.day}</span>
                  {d.hasEvents && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(d.eventCount, 3) }).map((_, j) => (
                        <div key={j} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-bist-border">
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Tüm tarihleri göster →
              </button>
            </div>
          )}
        </div>

        {/* Events List - Right 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  filter === tab.key
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                    : 'text-bist-textSecondary hover:text-bist-text hover:bg-white/5 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="text-xs text-bist-textMuted ml-auto">
              {filtered.length} etkinlik
            </span>
          </div>

          {/* Events by date */}
          {groupedEvents.length > 0 ? (
            <div className="space-y-4">
              {groupedEvents.map(([date, events]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      date === '2026-03-03' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-bist-textSecondary'
                    }`}>
                      {new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {date === '2026-03-03' && (
                      <span className="text-[10px] text-blue-400 font-medium">Bugün</span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-2">
                    {events.map((event, i) => {
                      const typeInfo = eventTypeLabels[event.type] || eventTypeLabels.general;
                      const impactInfo = impactLabels[event.impact];
                      return (
                        <div
                          key={i}
                          className="bg-bist-card border border-bist-border rounded-xl p-4 card-hover"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeInfo.bg} ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                <span className={`text-[10px] font-medium ${impactInfo.color}`}>
                                  ● {impactInfo.label}
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold mt-2">{event.title}</h3>
                              <p className="text-xs text-bist-textSecondary mt-1">{event.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bist-card border border-bist-border rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">▣</div>
              <p className="text-sm text-bist-textSecondary">Bu kriterlere uygun etkinlik bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
