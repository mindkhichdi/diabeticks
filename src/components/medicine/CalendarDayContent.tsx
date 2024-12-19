import React from 'react';
import { Check } from 'lucide-react';
import { MedicineStatus } from '@/types/medicine';

interface CalendarDayContentProps {
  date: Date;
  selectedDate: Date | undefined;
  medicineStatus: MedicineStatus | undefined;
}

const CalendarDayContent = ({ date, selectedDate, medicineStatus }: CalendarDayContentProps) => {
  const isSameDate = (date1: Date, date2: Date | undefined): boolean => {
    if (!date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  console.log('Rendering CalendarDayContent:', {
    date: date.toISOString(),
    selectedDate: selectedDate?.toISOString(),
    medicineStatus,
    isSameDate: selectedDate ? isSameDate(date, selectedDate) : false
  });

  if (!selectedDate || !isSameDate(date, selectedDate)) {
    return <div>{date.getDate()}</div>;
  }

  if (!medicineStatus) {
    return (
      <div>
        <div>{date.getDate()}</div>
      </div>
    );
  }

  const allTaken = medicineStatus.morning && 
                  medicineStatus.afternoon && 
                  medicineStatus.night;

  return (
    <div>
      <div>{date.getDate()}</div>
      <div className={`mt-1 border-b-2 ${allTaken ? 'border-green-500' : 'border-gray-300'}`}>
        <div className="flex justify-center gap-1">
          {medicineStatus.morning && (
            <Check className="h-3 w-3 text-diabetic-morning" />
          )}
          {medicineStatus.afternoon && (
            <Check className="h-3 w-3 text-diabetic-afternoon" />
          )}
          {medicineStatus.night && (
            <Check className="h-3 w-3 text-diabetic-night" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarDayContent;