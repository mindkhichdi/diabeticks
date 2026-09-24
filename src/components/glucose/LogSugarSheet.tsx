import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAddReading, useReadings, useTargets } from '@/hooks/use-glucose';
import {
  DEFAULT_TARGETS, ReadingKind, SCALE_MAX, SCALE_MIN, localDateKey, toPoints, zoneClass, zoneMeta, zoneOf,
} from '@/lib/glucose';
import RangeRibbon from './RangeRibbon';

type Kind = ReadingKind | 'hba1c';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: Kind;
}

const kinds: { value: Kind; label: string; hint: string }[] = [
  { value: 'fasting', label: 'Fasting', hint: 'Before eating, usually in the morning' },
  { value: 'post_prandial', label: 'After meal', hint: '1–2 hours after you started eating' },
  { value: 'hba1c', label: 'HbA1c', hint: 'Your 3-month average from a lab test' },
];

const guessKind = (): ReadingKind => (new Date().getHours() < 10 ? 'fasting' : 'post_prandial');

const LogSugarSheet = ({ open, onOpenChange, initialKind }: Props) => {
  const { data: readings = [] } = useReadings();
  const { data: targets = DEFAULT_TARGETS } = useTargets();
  const addReading = useAddReading();

  const [kind, setKind] = useState<Kind>('fasting');
  const [value, setValue] = useState(110);
  const [a1c, setA1c] = useState(7.0);
  const [date, setDate] = useState(localDateKey());

  // Start each log from a sensible place: the right kind for the time of day, and the last value of that kind.
  useEffect(() => {
    if (!open) return;
    const k = initialKind ?? guessKind();
    setKind(k);
    setDate(localDateKey());
    const last = toPoints(readings).find((p) => p.kind === k);
    setValue(last?.value ?? 110);
    const lastA1c = readings.find((r) => r.hba1c != null)?.hba1c;
    setA1c(lastA1c ?? 7.0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isGlucose = kind !== 'hba1c';
  const zone = isGlucose ? zoneOf(value, kind, targets) : null;
  const clamp = (v: number) => Math.min(600, Math.max(20, v));

  const save = () => {
    const payload = isGlucose ? { kind, value, date } : { kind, value: a1c, date };
    addReading.mutate(payload, {
      onSuccess: () => {
        toast.success(isGlucose ? `Saved ${value} mg/dL · ${zoneMeta[zone!].label}` : `Saved HbA1c ${a1c}%`);
        onOpenChange(false);
      },
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg mx-auto">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="font-display text-2xl">Log blood sugar</DrawerTitle>
          <DrawerDescription>{kinds.find((k) => k.value === kind)?.hint}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-5">
          {/* Reading type */}
          <div role="radiogroup" aria-label="Reading type" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-muted">
            {kinds.map((k) => (
              <button
                key={k.value}
                role="radio"
                aria-checked={kind === k.value}
                onClick={() => {
                  setKind(k.value);
                  if (k.value !== 'hba1c') {
                    const last = toPoints(readings).find((p) => p.kind === k.value);
                    if (last) setValue(last.value);
                  }
                }}
                className={cn(
                  'h-11 rounded-xl text-sm font-bold transition-colors',
                  kind === k.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Value */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="icon"
              className="h-16 w-16 rounded-2xl shrink-0"
              aria-label="Decrease"
              onClick={() => (isGlucose ? setValue((v) => clamp(v - 1)) : setA1c((v) => Math.max(3, +(v - 0.1).toFixed(1))))}
            >
              <Minus className="!size-6" />
            </Button>
            <label className="flex-1 text-center">
              <span className="sr-only">{isGlucose ? 'Blood sugar in mg/dL' : 'HbA1c percent'}</span>
              <input
                type="number"
                inputMode={isGlucose ? 'numeric' : 'decimal'}
                step={isGlucose ? 1 : 0.1}
                value={isGlucose ? value : a1c}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isNaN(n)) return;
                  if (isGlucose) setValue(Math.round(n));
                  else setA1c(n);
                }}
                className={cn(
                  'w-full bg-transparent text-center font-display font-bold text-7xl leading-none tabular outline-none',
                  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                  zone && zoneClass[zone].text,
                )}
              />
              <span className="block text-sm text-muted-foreground mt-1">{isGlucose ? 'mg/dL' : '%'}</span>
            </label>
            <Button
              variant="secondary"
              size="icon"
              className="h-16 w-16 rounded-2xl shrink-0"
              aria-label="Increase"
              onClick={() => (isGlucose ? setValue((v) => clamp(v + 1)) : setA1c((v) => Math.min(20, +(v + 0.1).toFixed(1))))}
            >
              <Plus className="!size-6" />
            </Button>
          </div>

          {isGlucose && zone && (
            <>
              <div data-vaul-no-drag>
                <RangeRibbon value={value} kind={kind} targets={targets} onChange={setValue} />
                <p className="text-xs text-muted-foreground text-center mt-1">Drag the scale or use − and + to adjust</p>
              </div>
              <div
                aria-live="polite"
                className={cn('rounded-2xl p-4 border-l-4', zoneClass[zone].soft, zoneClass[zone].border)}
              >
                <p className={cn('font-bold', zoneClass[zone].text)}>{zoneMeta[zone].label}</p>
                <p className="text-sm mt-1">{zoneMeta[zone].advice}</p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 text-sm">
            <label htmlFor="reading-date" className="text-muted-foreground">Date</label>
            <input
              id="reading-date"
              type="date"
              value={date}
              max={localDateKey()}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl border border-input bg-card px-3 font-bold"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={save}
            disabled={addReading.isPending || (isGlucose ? value < SCALE_MIN / 2 : a1c <= 0)}
          >
            {addReading.isPending ? 'Saving…' : 'Save reading'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LogSugarSheet;
