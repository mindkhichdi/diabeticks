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

export interface MedicinePreference {
  id: string;
  user_id: string;
  slot_id: string;
  custom_name: string | null;
  custom_time: string | null;
  created_at: string;
}