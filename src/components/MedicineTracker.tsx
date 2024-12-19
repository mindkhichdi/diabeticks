import React from 'react';
import { Sun, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MedicineTimeSlot from './medicine/MedicineTimeSlot';
import { TimeSlot } from '@/types/medicine';

const timeSlots: TimeSlot[] = [
  { id: 'morning', icon: <Sun className="w-6 h-6" />, label: 'Morning', time: '08:00' },
  { id: 'afternoon', icon: <Sunset className="w-6 h-6" />, label: 'Afternoon', time: '14:00' },
  { id: 'night', icon: <Moon className="w-6 h-6" />, label: 'Night', time: '20:00' },
];

const MedicineTracker = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: medicineLogs } = useQuery({
    queryKey: ['medicine-logs', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('taken_at::date', today)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  const logMedicine = useMutation({
    mutationFn: async (slotId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('medicine_logs')
        .insert([{ 
          medicine_time: slotId,
          user_id: user.id
        }]);
      
      if (error) throw error;
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
    return medicineLogs?.some(log => log.medicine_time === slotId) ?? false;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
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