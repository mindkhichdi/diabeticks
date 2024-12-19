import React from 'react';
import { Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MedicineLog } from '@/types/medicine';

interface MedicineHistoryTableProps {
  logs: MedicineLog[];
  selectedDate: Date;
}

const MedicineHistoryTable = ({ logs, selectedDate }: MedicineHistoryTableProps) => {
  if (!logs?.length) return null;

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-4">
        Medicine Status for {selectedDate.toLocaleDateString()}
      </h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={index}>
              <TableCell>
                {new Date(log.taken_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(log.taken_at).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <Check className="h-4 w-4 text-green-500" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MedicineHistoryTable;