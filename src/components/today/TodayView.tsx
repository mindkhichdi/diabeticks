import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Activity, ChevronRight, FileText, Plus, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReadings, useTargets } from '@/hooks/use-glucose';
import { useMedicineDay } from '@/hooks/use-medicine';
import { DEFAULT_TARGETS, kindLabel, statsFor, toPoints, zoneClass, zoneMeta, zoneOf } from '@/lib/glucose';
import RangeRibbon from '@/components/glucose/RangeRibbon';
import MedicineChecklist from '@/components/medicine/MedicineChecklist';
import RangeBar from '@/components/glucose/RangeBar';

type Tab = 'today' | 'sugar' | 'meds' | 'food' | 'move';

interface Props {
  onLogSugar: () => void;
  onNavigate: (tab: Tab) => void;
}

const whenLabel = (date: string) => {
  const days = differenceInCalendarDays(new Date(), parseISO(date));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(parseISO(date), 'd MMM');
};

const TodayView = ({ onLogSugar, onNavigate }: Props) => {
  const { data: readings = [], isLoading } = useReadings();
  const { data: targets = DEFAULT_TARGETS } = useTargets();
  const { takenCount, slots } = useMedicineDay(new Date());

  const points = toPoints(readings);
  const latest = points[0];
  const zone = latest ? zoneOf(latest.value, latest.kind, targets) : null;
  const stale = latest && differenceInCalendarDays(new Date(), parseISO(latest.date)) > 0;
  const stats = statsFor(points, targets, 14);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Latest sugar */}
      <section
        aria-labelledby="latest-heading"
        className={cn(
          'lg:col-span-3 rounded-3xl bg-card border border-border p-5 sm:p-7 animate-slide-up',
          zone && (zone === 'low' || zone === 'very-low') && !stale && 'border-2 border-low',
        )}
      >
        <div className="flex items-center justify-between">
          <h2 id="latest-heading" className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Latest blood sugar
          </h2>
          {latest && (
            <span className="text-sm text-muted-foreground">
              {kindLabel[latest.kind]} · {whenLabel(latest.date)}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-muted mt-4" />
        ) : latest && zone ? (
          <>
            <div className="flex items-end gap-3 mt-3">
              <p className={cn('font-display font-bold text-[5.5rem] sm:text-8xl leading-[0.85] tabular', zoneClass[zone].text)}>
                {latest.value}
              </p>
              <div className="pb-1">
                <p className="text-muted-foreground text-sm">mg/dL</p>
                <p className={cn('inline-flex items-center gap-1.5 font-bold', zoneClass[zone].text)}>
                  <span className={cn('w-2.5 h-2.5 rounded-full', zoneClass[zone].bg)} />
                  {zoneMeta[zone].label}
                </p>
              </div>
            </div>
            <RangeRibbon value={latest.value} kind={latest.kind} targets={targets} className="mt-4" />
            <p className="mt-3 text-[0.95rem]">
              {stale ? "You haven't logged a reading today yet." : zoneMeta[zone].advice}
            </p>
          </>
        ) : (
          <div className="py-6">
            <p className="font-display text-3xl font-bold">No readings yet</p>
            <p className="text-muted-foreground mt-2">
              Log your first reading to see where you are in your target range.
            </p>
          </div>
        )}

        <Button size="lg" className="w-full sm:w-auto mt-5" onClick={onLogSugar}>
          <Plus className="!size-5" />
          Log blood sugar
        </Button>
      </section>

      {/* Medicine */}
      <section aria-labelledby="meds-heading" className="lg:col-span-2 lg:row-span-2 rounded-3xl bg-card border border-border p-5 sm:p-6 animate-slide-up [animation-delay:60ms]">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="meds-heading" className="text-xl font-bold">Today's medicine</h2>
          <span className="text-sm font-bold text-muted-foreground tabular">
            {takenCount} of {slots.length} taken
          </span>
        </div>
        <MedicineChecklist />
        <button
          onClick={() => onNavigate('meds')}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          History and dose settings <ChevronRight className="w-4 h-4" />
        </button>
      </section>

      {/* Two-week summary */}
      <section aria-labelledby="summary-heading" className="lg:col-span-3 rounded-3xl bg-card border border-border p-5 sm:p-6 animate-slide-up [animation-delay:120ms]">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="summary-heading" className="text-xl font-bold">Last 14 days</h2>
          <button onClick={() => onNavigate('sugar')} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            See trends <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {stats.count ? (
          <>
            <RangeBar stats={stats} />
            <dl className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <dt className="text-sm text-muted-foreground">In range</dt>
                <dd className="font-display text-3xl font-bold tabular text-in-range">
                  {Math.round((stats.inRange / stats.count) * 100)}%
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Average <span className="text-xs">mg/dL</span></dt>
                <dd className="font-display text-3xl font-bold tabular">{stats.average}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Est. A1c</dt>
                <dd className="font-display text-3xl font-bold tabular">
                  {stats.estimatedA1c != null ? `${stats.estimatedA1c}%` : '—'}
                </dd>
              </div>
            </dl>
            {stats.estimatedA1c == null && (
              <p className="text-xs text-muted-foreground mt-2">Est. A1c appears after 5 readings.</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Your time in range will show here once you log a few readings.</p>
        )}
      </section>

      {/* Other logs */}
      <nav aria-label="Other logs" className="lg:col-span-5 grid grid-cols-3 gap-3 animate-slide-up [animation-delay:180ms]">
        {([
          { tab: 'food', icon: Utensils, label: 'Log a meal' },
          { tab: 'move', icon: Activity, label: 'Log activity' },
          { tab: 'meds', icon: FileText, label: 'Prescriptions' },
        ] as const).map(({ tab, icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="flex flex-col items-start gap-3 rounded-2xl bg-card border border-border p-3 sm:p-4 text-left min-w-0 font-bold hover:border-primary/60 transition-colors"
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary">
              <Icon className="w-5 h-5" />
            </span>
            <span className="leading-tight text-sm sm:text-base break-words">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TodayView;
