import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TARGETS, Reading, ReadingKind, Targets, localDateKey } from '@/lib/glucose';

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  return user.id;
};

export const READINGS_KEY = ['blood-sugar-readings'];

export const useReadings = () =>
  useQuery({
    queryKey: READINGS_KEY,
    queryFn: async (): Promise<Reading[]> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('blood_sugar_readings')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Reading[];
    },
  });

export const useTargets = () =>
  useQuery({
    queryKey: ['glucose-targets'],
    queryFn: async (): Promise<Targets> => {
      const userId = await getUserId();
      const { data } = await supabase
        .from('user_stats')
        .select('blood_sugar_target_min, blood_sugar_target_max')
        .eq('user_id', userId)
        .maybeSingle();
      return {
        ...DEFAULT_TARGETS,
        min: data?.blood_sugar_target_min ?? DEFAULT_TARGETS.min,
        fastingMax: data?.blood_sugar_target_max ?? DEFAULT_TARGETS.fastingMax,
      };
    },
    placeholderData: DEFAULT_TARGETS,
  });

export interface NewReading {
  kind: ReadingKind | 'hba1c';
  value: number;
  date?: string;
}

export const useAddReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, value, date = localDateKey() }: NewReading) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from('blood_sugar_readings')
        .insert([{ date, user_id: userId, [kind]: value }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: READINGS_KEY }),
    onError: () => toast.error("Couldn't save the reading. Check your connection and try again."),
  });
};

export const useDeleteReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blood_sugar_readings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: READINGS_KEY });
      toast.success('Reading deleted');
    },
    onError: () => toast.error("Couldn't delete the reading. Try again."),
  });
};
