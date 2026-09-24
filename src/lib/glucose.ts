import { format, subDays } from 'date-fns';

export type ReadingKind = 'fasting' | 'post_prandial';
export type GlucoseZone = 'very-low' | 'low' | 'in-range' | 'high' | 'very-high';

export interface Reading {
  id: string;
  date: string;
  hba1c: number | null;
  fasting: number | null;
  post_prandial: number | null;
  created_at: string;
}

export interface Targets {
  min: number;
  /** Upper bound for fasting / before-meal readings */
  fastingMax: number;
  /** Upper bound for readings 1–2h after a meal */
  postMealMax: number;
}

// ADA-style defaults, overridden by user_stats when the user has set them.
export const DEFAULT_TARGETS: Targets = { min: 80, fastingMax: 130, postMealMax: 180 };

export const SCALE_MIN = 40;
export const SCALE_MAX = 300;
export const VERY_LOW = 54;
export const LOW = 70;
export const VERY_HIGH = 250;

export const kindLabel: Record<ReadingKind, string> = {
  fasting: 'Fasting',
  post_prandial: 'After meal',
};

export const upperFor = (kind: ReadingKind, t: Targets) =>
  kind === 'fasting' ? t.fastingMax : t.postMealMax;

export const zoneOf = (value: number, kind: ReadingKind, t: Targets): GlucoseZone => {
  if (value < VERY_LOW) return 'very-low';
  if (value < LOW) return 'low';
  if (value > VERY_HIGH) return 'very-high';
  if (value > upperFor(kind, t)) return 'high';
  return 'in-range';
};

// Literal class names so Tailwind can see them.
export const zoneClass: Record<GlucoseZone, { bg: string; text: string; soft: string; border: string }> = {
  'very-low': { bg: 'bg-very-low', text: 'text-very-low', soft: 'bg-very-low/10', border: 'border-very-low' },
  low: { bg: 'bg-low', text: 'text-low', soft: 'bg-low/10', border: 'border-low' },
  'in-range': { bg: 'bg-in-range', text: 'text-in-range', soft: 'bg-in-range/10', border: 'border-in-range' },
  high: { bg: 'bg-high', text: 'text-high', soft: 'bg-high/10', border: 'border-high' },
  'very-high': { bg: 'bg-very-high', text: 'text-very-high', soft: 'bg-very-high/10', border: 'border-very-high' },
};

export const zoneMeta: Record<GlucoseZone, { label: string; advice: string }> = {
  'very-low': {
    label: 'Very low',
    advice: 'Treat this now: take 15g of fast sugar and recheck in 15 minutes. Get help if you feel unwell.',
  },
  low: {
    label: 'Low',
    advice: 'Take 15g of fast sugar (half a cup of juice or 3–4 glucose tablets), then recheck in 15 minutes.',
  },
  'in-range': {
    label: 'In range',
    advice: 'Nicely done. Keep your usual routine.',
  },
  high: {
    label: 'Above range',
    advice: 'Drink water and consider a short walk. Recheck later and note what you ate.',
  },
  'very-high': {
    label: 'Very high',
    advice: 'Recheck soon. If it stays high or you feel unwell, follow your care plan or contact your doctor.',
  },
};

/** Position of a value on the ribbon, 0–100 (%). */
export const toPct = (v: number) =>
  ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

export interface GlucosePoint {
  id: string;
  date: string;
  kind: ReadingKind;
  value: number;
  created_at: string;
}

/** Flatten rows (which may hold a fasting and an after-meal value) into single points, newest first. */
export const toPoints = (readings: Reading[]): GlucosePoint[] =>
  readings.flatMap((r) => {
    const pts: GlucosePoint[] = [];
    if (r.post_prandial != null)
      pts.push({ id: r.id, date: r.date, kind: 'post_prandial', value: r.post_prandial, created_at: r.created_at });
    if (r.fasting != null)
      pts.push({ id: r.id, date: r.date, kind: 'fasting', value: r.fasting, created_at: r.created_at });
    return pts;
  });

export interface RangeStats {
  count: number;
  average: number | null;
  inRange: number;
  low: number;
  high: number;
  /** GMI-style estimate; only meaningful with enough readings */
  estimatedA1c: number | null;
}

export const statsFor = (points: GlucosePoint[], t: Targets, days: number): RangeStats => {
  const since = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const recent = points.filter((p) => p.date >= since);
  const count = recent.length;
  if (!count) return { count, average: null, inRange: 0, low: 0, high: 0, estimatedA1c: null };
  let low = 0, high = 0, sum = 0;
  for (const p of recent) {
    sum += p.value;
    const z = zoneOf(p.value, p.kind, t);
    if (z === 'low' || z === 'very-low') low++;
    else if (z === 'high' || z === 'very-high') high++;
  }
  const average = Math.round(sum / count);
  return {
    count,
    average,
    inRange: count - low - high,
    low,
    high,
    estimatedA1c: count >= 5 ? Math.round(((average + 46.7) / 28.7) * 10) / 10 : null,
  };
};

export const localDateKey = (d: Date = new Date()) => format(d, 'yyyy-MM-dd');
