import { useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useDeleteReading, useReadings, useTargets } from '@/hooks/use-glucose';
import {
  DEFAULT_TARGETS, Reading, ReadingKind, kindLabel, localDateKey, statsFor, toPoints, zoneClass, zoneOf,
} from '@/lib/glucose';
import BloodSugarTrendChart from './BloodSugarTrendChart';
import RangeBar from './glucose/RangeBar';

const periods = [7, 30, 90] as const;

interface Props {
  onLogSugar: () => void;
}

const ReadingsLog = ({ onLogSugar }: Props) => {
  const { data: readings = [], isLoading } = useReadings();
  const { data: targets = DEFAULT_TARGETS } = useTargets();
  const deleteReading = useDeleteReading();
  const [days, setDays] = useState<(typeof periods)[number]>(30);
  const [toDelete, setToDelete] = useState<Reading | null>(null);

  const since = localDateKey(subDays(new Date(), days - 1));
  const inPeriod = readings.filter((r) => r.date >= since);
  const points = toPoints(inPeriod);
  const stats = statsFor(points, targets, days);
  const latestA1c = readings.find((r) => r.hba1c != null);

  const Chip = ({ kind, value }: { kind: ReadingKind; value: number }) => {
    const zone = zoneOf(value, kind, targets);
    return (
      <span className={cn('inline-flex items-baseline gap-1.5 rounded-xl px-3 py-1.5', zoneClass[zone].soft)}>
        <span className="text-xs text-muted-foreground">{kindLabel[kind]}</span>
        <span className={cn('font-bold tabular', zoneClass[zone].text)}>{value}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Time period" className="inline-flex gap-1 p-1 rounded-2xl bg-muted">
          {periods.map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={days === p}
              onClick={() => setDays(p)}
              className={cn(
                'h-10 px-4 rounded-xl text-sm font-bold transition-colors',
                days === p ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p} days
            </button>
          ))}
        </div>
        <Button onClick={onLogSugar}>
          <Plus /> Log blood sugar
        </Button>
      </div>

      {isLoading ? (
        <div className="h-72 rounded-2xl bg-muted animate-pulse" />
      ) : points.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="font-display text-2xl font-bold">No readings in the last {days} days</p>
          <p className="text-muted-foreground mt-2">Log a reading to start seeing your trend.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-bold text-foreground">{Math.round((stats.inRange / stats.count) * 100)}% in range</span>
                {' '}across {stats.count} reading{stats.count === 1 ? '' : 's'}
              </p>
              <RangeBar stats={stats} />
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-sm text-muted-foreground">Average</dt>
                <dd className="font-display text-3xl font-bold tabular">{stats.average}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{latestA1c ? 'Lab HbA1c' : 'Est. A1c'}</dt>
                <dd className="font-display text-3xl font-bold tabular">
                  {latestA1c ? `${latestA1c.hba1c}%` : stats.estimatedA1c != null ? `${stats.estimatedA1c}%` : '—'}
                </dd>
                {latestA1c && (
                  <dd className="text-xs text-muted-foreground">{format(parseISO(latestA1c.date), 'd MMM yyyy')}</dd>
                )}
              </div>
            </dl>
          </div>

          <BloodSugarTrendChart points={points} targets={targets} />
        </>
      )}

      {inPeriod.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3">History</h3>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {inPeriod.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 pl-4">
                <div className="w-16 shrink-0">
                  <p className="font-bold">{format(parseISO(r.date), 'd MMM')}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(r.date), 'EEEE')}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {r.fasting != null && <Chip kind="fasting" value={r.fasting} />}
                  {r.post_prandial != null && <Chip kind="post_prandial" value={r.post_prandial} />}
                  {r.hba1c != null && (
                    <span className="inline-flex items-baseline gap-1.5 rounded-xl px-3 py-1.5 bg-muted">
                      <span className="text-xs text-muted-foreground">HbA1c</span>
                      <span className="font-bold tabular">{r.hba1c}%</span>
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete reading from ${format(parseISO(r.date), 'd MMMM')}`}
                  onClick={() => setToDelete(r)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reading?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `The reading from ${format(parseISO(toDelete.date), 'd MMMM yyyy')} will be removed. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteReading.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete reading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReadingsLog;
