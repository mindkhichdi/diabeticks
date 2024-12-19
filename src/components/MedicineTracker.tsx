import React from 'react';
import { Sun, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MedicineTimeSlot from './medicine/MedicineTimeSlot';
import { TimeSlot, MedicineLog } from '@/types/medicine';

const timeSlots: TimeSlot[] = [
  { id: 'morning', icon: <Sun className="w-6 h-6" />, label: 'Morning', time: '08:00' },
  { id: 'afternoon', icon: <Sunset className="w-6 h-6" />, label: 'Afternoon', time: '14:00' },
  { id: 'night', icon: <Moon className="w-6 h-6" />, label: 'Night', time: '20:00' },
];

const MedicineTracker = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: medicineLogs = [] } = useQuery<MedicineLog[]>({
    queryKey: ['medicine-logs', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Current user ID:', user.id);
      console.log('Fetching medicine logs for today:', today);
      
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', `${today}T00:00:00`)
        .lte('taken_at', `${today}T23:59:59`);
      
      if (error) {
        console.error('Error fetching medicine logs:', error);
        throw error;
      }

      console.log('Raw medicine logs data:', data);
      return data || [];
    },
  });

  const logMedicine = useMutation({
    mutationFn: async (slotId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Logging medicine for user:', user.id);
      const now = new Date().toISOString();
      
      const { error, data } = await supabase
        .from('medicine_logs')
        .insert([{ 
          medicine_time: slotId,
          user_id: user.id,
          taken_at: now
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting medicine log:', error);
        throw error;
      }

      console.log('Successfully logged medicine:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-logs'] });
    },
    onError: (error) => {
      console.error('Error logging medicine:', error);
      toast.error('Failed to log medicine. Please try again.');
    },
  });

  const handleMedicineTaken = (slotId: string) => {
    logMedicine.mutate(slotId);
    toast.success(`${slotId.charAt(0).toUpperCase() + slotId.slice(1)} medicine marked as taken!`);
  };

  const isTaken = (slotId: string) => {
    if (!Array.isArray(medicineLogs)) {
      console.warn('medicineLogs is not an array:', medicineLogs);
      return false;
    }
    
    const taken = medicineLogs.some(log => {
      const logDate = new Date(log.taken_at).toISOString().split('T')[0];
      const result = log.medicine_time === slotId && logDate === today;
      console.log(`Checking log:`, {
        slotId,
        logMedicineTime: log.medicine_time,
        logDate,
        today,
        isMatch: result
      });
      return result;
    });

    console.log(`Medicine status for ${slotId}:`, taken);
    return taken;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 bg-white p-4 rounded-lg shadow-sm">
      {timeSlots.map((slot) => (
        <MedicineTimeSlot
          key={slot.id}
          icon={slot.icon}
          time={slot.time}
          label={slot.label}
          isTaken={isTaken(slot.id)}
          onMedicineTaken={() => handleMedicineTaken(slot.id)}
          colorClass={`text-diabetic-${slot.id}`}
        />
      ))}
    </div>
  );
};

export default MedicineTracker;