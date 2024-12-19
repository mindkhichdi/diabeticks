export interface TimeSlot {
  id: 'morning' | 'afternoon' | 'night';
  icon: React.ReactNode;
  label: string;
  time: string;
}

export interface MedicineStatus {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface MedicineLog {
  medicine_time: string;
  taken_at: string;
}