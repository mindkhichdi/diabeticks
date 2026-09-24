import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfDay, isToday, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { localDateKey } from '@/lib/glucose';

export type SlotId = 'morning' | 'afternoon' | 'night';

export interface MedicineSlot {
  id: SlotId;
  defaultName: string;
  defaultTime: string;
  name: string;
  time: string;
  /** medicine_logs row id when taken */
  logId: string | null;
  takenAt: string | null;
}

const DEFAULT_SLOTS: { id: SlotId; defaultName: string; defaultTime: string }[] = [
  { id: 'morning', defaultName: 'Morning medicine', defaultTime: '08:00' },
  { id: 'afternoon', defaultName: 'Afternoon medicine', defaultTime: '14:00' },
  { id: 'night', defaultName: 'Night medicine', defaultTime: '20:00' },
];

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  return user.id;
};

export const formatSlotTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const useMedicineDay = (day: Date) => {
  const queryClient = useQueryClient();
  const dayKey = localDateKey(day);

  const prefs = useQuery({
    queryKey: ['medicine-preferences', 'all'],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('medicine_preferences')
        .select('slot_id, custom_name, custom_time')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
  });

  const logs = useQuery({
    queryKey: ['medicine-logs', dayKey],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('id, medicine_time, taken_at')
        .eq('user_id', userId)
        .gte('taken_at', startOfDay(day).toISOString())
        .lte('taken_at', endOfDay(day).toISOString())
        .order('taken_at');
      if (error) throw error;
      return data;
    },
  });

  const slots: MedicineSlot[] = DEFAULT_SLOTS.map((s) => {
    const pref = prefs.data?.find((p) => p.slot_id === s.id);
    const log = logs.data?.find((l) => l.medicine_time === s.id);
    return {
      ...s,
      name: pref?.custom_name || s.defaultName,
      time: pref?.custom_time?.slice(0, 5) || s.defaultTime,
      logId: log?.id ?? null,
      takenAt: log?.taken_at ?? null,
    };
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medicine-logs'] });

  const markTaken = useMutation({
    mutationFn: async (slot: MedicineSlot) => {
      const userId = await getUserId();
      // For past days, record the dose at its scheduled time on that day.
      let takenAt = new Date();
      if (!isToday(day)) {
        const [h, m] = slot.time.split(':').map(Number);
        takenAt = new Date(day);
        takenAt.setHours(h, m || 0, 0, 0);
      }
      const { error } = await supabase
        .from('medicine_logs')
        .insert([{ medicine_time: slot.id, user_id: userId, taken_at: takenAt.toISOString() }]);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't save that dose. Try again."),
  });

  const undoTaken = useMutation({
    mutationFn: async (slot: MedicineSlot) => {
      if (!slot.logId) return;
      const { error } = await supabase.from('medicine_logs').delete().eq('id', slot.logId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't undo that dose. Try again."),
  });

  return {
    slots,
    isLoading: prefs.isLoading || logs.isLoading,
    takenCount: slots.filter((s) => s.logId).length,
    markTaken,
    undoTaken,
  };
};

/** The next untaken slot today, if any — "due" once within an hour of its time or later. */
export const nextDue = (slots: MedicineSlot[], now = new Date()) => {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return slots
    .filter((s) => !s.logId)
    .map((s) => {
      const [h, m] = s.time.split(':').map(Number);
      const mins = h * 60 + (m || 0);
      return { slot: s, overdue: minutesNow > mins + 60, due: minutesNow >= mins - 60 };
    })
    .find((x) => x.due) ?? null;
};
