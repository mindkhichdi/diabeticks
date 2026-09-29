import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MedicineSlot, formatSlotTime, useMedicineDay } from '@/hooks/use-medicine';
import { localDateKey } from '@/lib/glucose';

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Reminds the user (in-app, plus a system notification when allowed) once a dose's time has passed. */
const MedicineReminder = ({ onOpenMeds }: { onOpenMeds: () => void }) => {
  const [now, setNow] = useState(new Date());
  const { slots, markTaken, isLoading } = useMedicineDay(now);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const mins = now.getHours() * 60 + now.getMinutes();
    const dayKey = localDateKey(now);
    const missed = slots.filter((s) => !s.logId && mins >= minutesOf(s.time));
    missed.forEach((slot: MedicineSlot) => {
      const key = `med-reminded-${dayKey}-${slot.id}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      const body = `It's past ${formatSlotTime(slot.time)}. Have you taken it?`;
      toast.warning(`Time for your ${slot.name}`, {
        description: body,
        duration: 30_000,
        action: { label: 'Mark taken', onClick: () => markTaken.mutate(slot, { onSuccess: () => toast.success(`${slot.name} taken`) }) },
        cancel: { label: 'View', onClick: onOpenMeds },
      });
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(`Time for your ${slot.name}`, { body, icon: '/icon-192x192.png' }); } catch { /* unsupported */ }
      }
    });
  }, [now, slots, isLoading, markTaken, onOpenMeds]);

  // Ask once for permission to send system notifications (only works outside embedded previews).
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default' || window.top !== window.self) return;
    const ask = () => { Notification.requestPermission(); window.removeEventListener('click', ask); };
    window.addEventListener('click', ask);
    return () => window.removeEventListener('click', ask);
  }, []);

  return null;
};

export default MedicineReminder;
