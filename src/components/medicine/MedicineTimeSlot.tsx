import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface MedicineTimeSlotProps {
  icon: React.ReactNode;
  time: string;
  label: string;
  isTaken: boolean;
  onMedicineTaken: () => void;
  colorClass: string;
}

const MedicineTimeSlot = ({
  icon,
  time,
  label,
  isTaken,
  onMedicineTaken,
  colorClass
}: MedicineTimeSlotProps) => {
  return (
    <Card className="p-6 animate-slideIn">
      <div className={`flex items-center justify-between mb-4 ${colorClass}`}>
        {icon}
        <Clock className="w-5 h-5" />
        <span className="font-semibold">{time}</span>
      </div>
      <h3 className="text-lg font-semibold mb-4">{label} Medicine</h3>
      <Button
        onClick={onMedicineTaken}
        disabled={isTaken}
        className={`w-full ${
          isTaken 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {isTaken ? 'Done' : 'Mark as Taken'}
      </Button>
    </Card>
  );
};

export default MedicineTimeSlot;