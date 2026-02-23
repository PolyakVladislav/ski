import { useState } from 'react';
import type { Trip, Expense } from '../types';

interface Rates {
  eurIls: number;
  usdIls: number;
}

function toEur(amount: number, currency: string, r: Rates): number {
  if (currency === 'EUR') return amount;
  if (currency === 'ILS') return amount / r.eurIls;
  return amount * (r.usdIls / r.eurIls);
}

function getExpRates(exp: Expense, fallback: Rates): Rates {
  return {
    eurIls: exp.rateEurIls ?? fallback.eurIls,
    usdIls: exp.rateUsdIls ?? fallback.usdIls,
  };
}

const CHART_COLORS = [
  '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b',
  '#10b981', '#06b6d4', '#ec4899', '#6366f1',
];

const CATEGORY_MAP: Record<string, string> = {
  apartment: 'דירה',
  tickets: 'טיסות',
  insurance: 'ביטוח',
  transfer: 'הסעה',
  skipass: 'סקי פס',
  rental: 'ציוד',
};

function categorize(exp: Expense): string {
  if (exp.fixedType) return CATEGORY_MAP[exp.fixedType] ?? exp.fixedType;
  const desc = exp.description.toLowerCase();
  if (desc.includes('ארוחת') || desc.includes('אוכל')) return 'אוכל';
  if (desc.includes('שתייה') || desc.includes('אלכוהול') || desc.includes('בירה')) return 'שתייה';
  if (desc.includes('סופר') || desc.includes('קניות')) return 'קניות';
  return 'אחר';
}

type ChartView = 'categories' | 'people';

interface Props {
  trip: Trip;
  rates: Rates;
}

export function ExpenseCharts({ trip, rates }: Props) {
  const [view, setView] = useState<ChartView>('categories');

  if (trip.expenses.length === 0) return null;

  return (
    <div className="ios-card overflow-hidden animate-fade-in-up stagger-2">
      <div className="px-4 pt-3 pb-2">
        <div className="flex bg-ios-gray5 rounded-[9px] p-[2px]">
          <button
            onClick={() => setView('categories')}
            className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-semibold text-center transition-all ${
              view === 'categories' ? 'bg-ios-card text-ios-label shadow-sm' : 'text-ios-gray'
            }`}
          >
            לפי קטגוריה
          </button>
          <button
            onClick={() => setView('people')}
            className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-semibold text-center transition-all ${
              view === 'people' ? 'bg-ios-card text-ios-label shadow-sm' : 'text-ios-gray'
            }`}
          >
            לפי משתתף
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        {view === 'categories' ? (
          <CategoryDonut trip={trip} rates={rates} />
        ) : (
          <PeopleChart trip={trip} rates={rates} />
        )}
      </div>
    </div>
  );
}

function CategoryDonut({ trip, rates }: Props) {
  const categoryTotals = new Map<string, number>();
  for (const exp of trip.expenses) {
    const cat = categorize(exp);
    const eur = toEur(exp.amount, exp.currency ?? 'ILS', getExpRates(exp, rates));
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + eur);
  }

  const sorted = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const size = 120;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs = sorted.map(([label, value], i) => {
    const pct = value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const currentOffset = offset;
    offset += dash;
    return { label, value, pct, dash, gap, offset: currentOffset, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-[13px] text-ios-label truncate flex-1">{arc.label}</span>
            <span className="text-[13px] font-semibold text-ios-label tabular-nums shrink-0" dir="ltr">
              €{Math.round(arc.value).toLocaleString()}
            </span>
            <span className="text-[11px] text-ios-gray w-8 text-left shrink-0" dir="ltr">
              {Math.round(arc.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeopleChart({ trip, rates }: Props) {
  const personTotals = new Map<string, number>();
  for (const exp of trip.expenses) {
    const eur = toEur(exp.amount, exp.currency ?? 'ILS', getExpRates(exp, rates));
    const share = eur / exp.splitBetween.length;
    for (const pid of exp.splitBetween) {
      personTotals.set(pid, (personTotals.get(pid) ?? 0) + share);
    }
  }

  const items = trip.people.map((p, i) => ({
    name: p.name,
    value: personTotals.get(p.id) ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-ios-label font-medium">{item.name}</span>
            <span className="text-[13px] font-semibold text-ios-label tabular-nums" dir="ltr">
              €{Math.round(item.value).toLocaleString()}
            </span>
          </div>
          <div className="w-full h-[8px] bg-ios-gray5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
