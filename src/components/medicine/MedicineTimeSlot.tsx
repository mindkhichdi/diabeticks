import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from 'lucide-react';
import MedicinePreferencesDialog from './MedicinePreferencesDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface MedicineTimeSlotProps {
  icon: React.ReactNode;
  time: string;
  label: string;
  isTaken: boolean;
  onMedicineTaken: () => void;
  colorClass: string;
  disabled?: boolean;
  slotId: string;
}

const MedicineTimeSlot = ({
  icon,
  time,
  label,
  isTaken,
  onMedicineTaken,
  colorClass,
  disabled,
  slotId
}: MedicineTimeSlotProps) => {
  const { data: preference } = useQuery({
    queryKey: ['medicine-preferences', slotId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Fetching medicine preferences for slot:', slotId);
      
      const { data, error } = await supabase
        .from('medicine_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('slot_id', slotId)
        .maybeSingle(); // Changed from .single() to handle no preferences case

      if (error) {
        console.error('Error fetching preferences:', error);
        throw error;
      }

      console.log('Fetched preference:', data);
      return data;
    },
  });

  const displayName = preference?.custom_name || label;
  const displayTime = preference?.custom_time || time;

  return (
    <Card className="p-6 border-2 hover:border-primary transition-all duration-200 animate-slideIn">
      <div className={`flex items-center justify-between mb-4 ${colorClass}`}>
        {icon}
        <Clock className="w-5 h-5" />
        <span className="font-semibold">{displayTime}</span>
        <MedicinePreferencesDialog
          slotId={slotId}
          defaultName={label}
          defaultTime={time}
        />
      </div>
      <h3 className="text-lg font-semibold mb-4">{displayName}</h3>
      <Button
        onClick={onMedicineTaken}
        disabled={isTaken || disabled}
        variant={isTaken ? "success" : "default"}
        className={`w-full ${
          isTaken 
            ? 'bg-green-500 hover:bg-green-600 cursor-not-allowed' 
            : disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : `bg-diabetic-${slotId} hover:bg-diabetic-${slotId}/90`
        }`}
      >
        {isTaken ? 'Done' : 'Mark as Taken'}
      </Button>
    </Card>
  );
};

export default MedicineTimeSlot;