import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>({});

  const handleMedicineTaken = (slotId: string) => {
    setTakenMeds(prev => ({
      ...prev,
      [slotId]: true
    }));
    toast.success(`${slotId.charAt(0).toUpperCase() + slotId.slice(1)} medicine marked as taken!`);
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
            disabled={takenMeds[slot.id]}
            className={`w-full ${takenMeds[slot.id] ? 'bg-green-500' : `bg-diabetic-${slot.id}`}`}
          >
            {takenMeds[slot.id] ? 'Taken ✓' : 'Mark as Taken'}
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default MedicineTracker;