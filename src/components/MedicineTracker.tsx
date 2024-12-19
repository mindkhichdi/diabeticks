import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TimeSlot {
  id: 'morning' | 'afternoon' | 'night';
  icon: React.ReactNode;
  label: string;
  time: string;
}

const timeSlots: TimeSlot[] = [
  { id: 'morning', icon: <Sun className="w-6 h-6" />, label: 'Morning', time: '08:00' },
  { id: 'afternoon', icon: <Sunset className="w-6 h-6" />, label: 'Afternoon', time: '14:00' },
  { id: 'night', icon: <Moon className="w-6 h-6" />, label: 'Night', time: '20:00' },
];

const MedicineTracker = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's medicine logs
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

  // Create mutation for logging medicine
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
    return medicineLogs?.some(log => log.medicine_time === slotId);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {timeSlots.map((slot) => (
        <Card key={slot.id} className="p-6 animate-slideIn">
          <div className={`flex items-center justify-between mb-4 text-diabetic-${slot.id}`}>
            {slot.icon}
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{slot.time}</span>
          </div>
          <h3 className="text-lg font-semibold mb-4">{slot.label} Medicine</h3>
          <Button
            onClick={() => handleMedicineTaken(slot.id)}
            disabled={isTaken(slot.id)}
            className={`w-full ${isTaken(slot.id) ? 'bg-green-500' : `bg-diabetic-${slot.id}`}`}
          >
            {isTaken(slot.id) ? 'Taken ✓' : 'Mark as Taken'}
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default MedicineTracker;