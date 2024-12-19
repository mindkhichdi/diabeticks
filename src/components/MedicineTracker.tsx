import React, { useState } from 'react';
import { Sun, Sunset, Moon, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MedicineTimeSlot from './medicine/MedicineTimeSlot';
import { TimeSlot, MedicineLog } from '@/types/medicine';
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const timeSlots: TimeSlot[] = [
  { id: 'morning', icon: <Sun className="w-6 h-6" />, label: 'Morning', time: '08:00' },
  { id: 'afternoon', icon: <Sunset className="w-6 h-6" />, label: 'Afternoon', time: '14:00' },
  { id: 'night', icon: <Moon className="w-6 h-6" />, label: 'Night', time: '20:00' },
];

const MedicineTracker = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const { data: medicineLogs = [] } = useQuery<MedicineLog[]>({
    queryKey: ['medicine-logs', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Fetching medicine logs for date:', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });
      
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', startOfDay.toISOString())
        .lte('taken_at', endOfDay.toISOString());
      
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
      const now = selectedDate.toISOString();
      
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
    if (isFutureDate(selectedDate)) {
      toast.error("Cannot mark medicine as taken for future dates");
      return;
    }
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
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const result = log.medicine_time === slotId && logDate === selectedDateStr;
      console.log(`Checking log:`, {
        slotId,
        logMedicineTime: log.medicine_time,
        logDate,
        selectedDateStr,
        isMatch: result
      });
      return result;
    });

    console.log(`Medicine status for ${slotId}:`, taken);
    return taken;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <div className="text-lg font-medium">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <Button variant="ghost" size="icon">
              {isCalendarOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          
          {isCalendarOpen && (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              disabled={(date) => isFutureDate(date)}
              className="rounded-md border"
            />
          )}
        </div>
      </Card>

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
            disabled={isFutureDate(selectedDate)}
          />
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Medicine History</h3>
        {Array.isArray(medicineLogs) && medicineLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Taken At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicineLogs.map((log, index) => {
                const takenAtDate = new Date(log.taken_at);
                return (
                  <TableRow key={index}>
                    <TableCell className="capitalize">
                      {log.medicine_time}
                    </TableCell>
                    <TableCell>
                      {takenAtDate.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Check className="h-4 w-4 text-green-500" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No medicine logs for this date.</p>
        )}
      </Card>
    </div>
  );
};

export default MedicineTracker;