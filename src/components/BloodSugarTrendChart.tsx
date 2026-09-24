import { format, parseISO } from 'date-fns';
import {
  CartesianGrid, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from 'recharts';
import { GlucosePoint, LOW, Targets, kindLabel, zoneMeta, zoneOf } from '@/lib/glucose';

interface Props {
  points: GlucosePoint[];
  targets: Targets;
}

const ZONE_VAR: Record<string, string> = {
  'very-low': 'var(--very-low)', low: 'var(--low)', 'in-range': 'var(--in-range)', high: 'var(--high)', 'very-high': 'var(--very-high)',
};

// Rows only carry a date, so place fasting readings in the morning and after-meal readings in the afternoon.
const toX = (p: GlucosePoint) => parseISO(p.date).getTime() + (p.kind === 'fasting' ? 8 : 14) * 3600_000;

type Datum = { x: number; y: number; point: GlucosePoint; zone: ReturnType<typeof zoneOf> };

const BloodSugarTrendChart = ({ points, targets }: Props) => {
  const toData = (kind: GlucosePoint['kind']): Datum[] =>
    points
      .filter((p) => p.kind === kind)
      .map((p) => ({ x: toX(p), y: p.value, point: p, zone: zoneOf(p.value, p.kind, targets) }))
      .sort((a, b) => a.x - b.x);

  const fasting = toData('fasting');
  const afterMeal = toData('post_prandial');
  const maxY = Math.max(250, ...points.map((p) => p.value + 20));

  const Dot = (hollow: boolean) => (props: { cx?: number; cy?: number; payload?: Datum }) => {
    const { cx = 0, cy = 0, payload } = props;
    const color = `hsl(${ZONE_VAR[payload!.zone]})`;
    return (
      <circle cx={cx} cy={cy} r={6} fill={hollow ? 'hsl(var(--card))' : color} stroke={color} strokeWidth={hollow ? 3 : 2} />
    );
  };

  return (
    <figure>
      <div className="h-[280px] sm:h-[340px] w-full -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <ReferenceArea
              y1={LOW}
              y2={targets.postMealMax}
              fill="hsl(var(--in-range))"
              fillOpacity={0.08}
              ifOverflow="extendDomain"
            />
            <ReferenceLine y={LOW} stroke="hsl(var(--low))" strokeDasharray="4 4" />
            <ReferenceLine y={targets.fastingMax} stroke="hsl(var(--in-range))" strokeDasharray="4 4" />
            <ReferenceLine y={targets.postMealMax} stroke="hsl(var(--high))" strokeDasharray="4 4" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin - 43200000', 'dataMax + 43200000']}
              tickFormatter={(t) => format(new Date(t), 'd MMM')}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              scale="time"
              tickCount={5}
            />
            <YAxis
              dataKey="y"
              domain={[40, maxY]}
              ticks={[LOW, targets.fastingMax, targets.postMealMax, 250].filter((t) => t <= maxY)}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              width={44}
            />
            <Tooltip
              cursor={false}
              content={({ payload }) => {
                const d = payload?.[0]?.payload as Datum | undefined;
                if (!d) return null;
                return (
                  <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg text-sm">
                    <p className="font-bold tabular text-base">{d.y} mg/dL</p>
                    <p className="text-muted-foreground">
                      {kindLabel[d.point.kind]} · {format(parseISO(d.point.date), 'EEE d MMM')}
                    </p>
                    <p className="font-bold" style={{ color: `hsl(${ZONE_VAR[d.zone]})` }}>{zoneMeta[d.zone].label}</p>
                  </div>
                );
              }}
            />
            <Scatter name="Fasting" data={fasting} line={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} shape={Dot(false)} isAnimationActive={false} />
            <Scatter name="After meal" data={afterMeal} line={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '6 4' }} shape={Dot(true)} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mt-2">
        <span className="inline-flex items-center gap-2">
          <svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" stroke="hsl(var(--primary))" strokeWidth="2" /><circle cx="13" cy="5" r="4" fill="hsl(var(--primary))" /></svg>
          Fasting
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="6 4" /><circle cx="13" cy="5" r="3.5" fill="hsl(var(--card))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" /></svg>
          After meal
        </span>
        <span>Shaded band: {LOW}–{targets.postMealMax} mg/dL · dot colour shows the zone</span>
      </figcaption>
    </figure>
  );
};

export default BloodSugarTrendChart;
