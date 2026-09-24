import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isToday, startOfDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localDateKey } from '@/lib/glucose';
import MedicineChecklist from './medicine/MedicineChecklist';
import PrescriptionManager from './PrescriptionManager';

const SLOTS_PER_DAY = 3;

/** Doses taken per day for the last 7 days. */
const useWeekAdherence = () =>
  useQuery({
    queryKey: ['medicine-logs', 'week', localDateKey()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const from = startOfDay(subDays(new Date(), 6));
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('medicine_time, taken_at')
        .eq('user_id', user.id)
        .gte('taken_at', from.toISOString());
      if (error) throw error;
      const perDay: Record<string, Set<string>> = {};
      for (const l of data) {
        const k = localDateKey(new Date(l.taken_at));
        (perDay[k] ??= new Set()).add(l.medicine_time);
      }
      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(from, i);
        return { day: d, taken: perDay[localDateKey(d)]?.size ?? 0 };
      });
    },
  });

const MedicineTracker = () => {
  const [day, setDay] = useState(new Date());
  const { data: week = [] } = useWeekAdherence();
  const today = isToday(day);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" aria-label="Previous day" onClick={() => setDay((d) => subDays(d, 1))}>
            <ChevronLeft className="!size-5" />
          </Button>
          <div className="text-center">
            <p className="font-display text-xl font-bold">{today ? 'Today' : format(day, 'EEEE')}</p>
            <p className="text-sm text-muted-foreground">{format(day, 'd MMMM yyyy')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next day"
            disabled={today}
            onClick={() => setDay((d) => addDays(d, 1))}
          >
            <ChevronRight className="!size-5" />
          </Button>
        </div>

        <MedicineChecklist day={day} editable />
        <p className="text-sm text-muted-foreground">
          Tap a dose to mark it taken, tap again to undo. Use the gear to rename a dose or change its time.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3">Last 7 days</h3>
        <div className="grid grid-cols-7 gap-2">
          {week.map(({ day: d, taken }) => {
            const selected = localDateKey(d) === localDateKey(day);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDay(d)}
                aria-label={`${format(d, 'EEEE d MMMM')}: ${taken} of ${SLOTS_PER_DAY} doses`}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl py-2 border-2 transition-colors',
                  selected ? 'border-primary' : 'border-transparent hover:bg-muted',
                )}
              >
                <span className="text-xs font-bold text-muted-foreground">{format(d, 'EEEEE')}</span>
                <span className="flex flex-col-reverse gap-1" aria-hidden="true">
                  {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
                    <span
                      key={i}
                      className={cn('w-5 h-2.5 rounded-full', i < taken ? 'bg-in-range' : 'bg-muted-foreground/20')}
                    />
                  ))}
                </span>
                <span className="text-xs tabular">{format(d, 'd')}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3">Prescriptions</h3>
        <PrescriptionManager />
      </section>
    </div>
  );
};

export default MedicineTracker;
