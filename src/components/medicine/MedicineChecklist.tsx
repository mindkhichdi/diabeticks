import confetti from 'canvas-confetti';
import { Check, Moon, Sun, Sunset } from 'lucide-react';
import { isToday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MedicineSlot, SlotId, formatSlotTime, nextDue, useMedicineDay } from '@/hooks/use-medicine';
import MedicinePreferencesDialog from './MedicinePreferencesDialog';

const slotIcon: Record<SlotId, typeof Sun> = { morning: Sun, afternoon: Sunset, night: Moon };

const celebrate = () =>
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 }, zIndex: 999, disableForReducedMotion: true });

interface Props {
  day?: Date;
  /** Show the per-slot name/time settings */
  editable?: boolean;
}

const MedicineChecklist = ({ day = new Date(), editable = false }: Props) => {
  const { slots, markTaken, undoTaken, takenCount } = useMedicineDay(day);
  const today = isToday(day);
  const due = today ? nextDue(slots) : null;

  const toggle = (slot: MedicineSlot) => {
    if (slot.logId) {
      undoTaken.mutate(slot, { onSuccess: () => toast(`${slot.name} marked as not taken`) });
      return;
    }
    markTaken.mutate(slot, {
      onSuccess: () => {
        if (takenCount + 1 === slots.length) {
          celebrate();
          toast.success('All medicine taken for the day. Well done!');
        } else {
          toast.success(`${slot.name} taken`);
        }
      },
    });
  };

  const statusFor = (slot: MedicineSlot) => {
    if (slot.takenAt)
      return { text: `Taken at ${new Date(slot.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, cls: 'text-in-range' };
    if (due?.slot.id === slot.id)
      return due.overdue ? { text: 'Overdue', cls: 'text-low' } : { text: 'Due now', cls: 'text-primary' };
    if (!today) return { text: 'Not logged', cls: 'text-muted-foreground' };
    return { text: `Scheduled ${formatSlotTime(slot.time)}`, cls: 'text-muted-foreground' };
  };

  return (
    <ul className="space-y-2">
      {slots.map((slot) => {
        const Icon = slotIcon[slot.id];
        const taken = !!slot.logId;
        const status = statusFor(slot);
        const busy = (markTaken.isPending && markTaken.variables?.id === slot.id)
          || (undoTaken.isPending && undoTaken.variables?.id === slot.id);
        const isDue = due?.slot.id === slot.id;
        return (
          <li key={slot.id} className="flex items-center gap-2">
            <button
              onClick={() => toggle(slot)}
              disabled={busy}
              aria-pressed={taken}
              aria-label={`${slot.name}, ${status.text}. ${taken ? 'Tap to undo' : 'Tap to mark as taken'}`}
              className={cn(
                'flex-1 flex items-center gap-4 rounded-2xl border-2 p-3 pr-4 text-left transition-colors min-h-[72px]',
                taken ? 'border-transparent bg-in-range/10' : isDue ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:border-primary/50',
                busy && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid place-items-center w-11 h-11 rounded-full border-2 shrink-0 transition-colors',
                  taken ? 'bg-in-range border-in-range text-white' : 'border-muted-foreground/40 text-muted-foreground',
                )}
              >
                {taken ? <Check className="w-6 h-6 animate-pop" strokeWidth={3} /> : <Icon className="w-5 h-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block font-bold text-base truncate', taken && 'line-through decoration-2 decoration-in-range/60 text-muted-foreground')}>
                  {slot.name}
                </span>
                <span className={cn('block text-sm font-bold', status.cls)}>{status.text}</span>
              </span>
              {!taken && (
                <span className={cn('text-sm font-bold shrink-0', isDue ? 'text-primary' : 'text-muted-foreground')}>
                  Take
                </span>
              )}
            </button>
            {editable && (
              <MedicinePreferencesDialog slotId={slot.id} defaultName={slot.defaultName} defaultTime={slot.defaultTime} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MedicineChecklist;
