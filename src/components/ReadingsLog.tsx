import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import BloodSugarTrendChart from './BloodSugarTrendChart';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface Reading {
  id?: string;
  date: string;
  hba1c?: number | null;
  fasting?: number | null;
  post_prandial?: number | null;
  created_at?: string;
  user_id?: string | null;
}
const ReadingsLog = () => {
  const queryClient = useQueryClient();
  const [newReading, setNewReading] = useState<Reading>({
    date: new Date().toISOString().split('T')[0]
  });
  const [readingToDelete, setReadingToDelete] = useState<Reading | null>(null);

  // Fetch readings
  const {
    data: readings = [],
    refetch
  } = useQuery({
    queryKey: ['blood-sugar-readings'],
    queryFn: async () => {
      console.log('Fetching readings...');
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const {
        data,
        error
      } = await supabase.from('blood_sugar_readings').select('*').eq('user_id', user.id).order('date', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching readings:', error);
        throw error;
      }
      console.log('Fetched readings:', data);
      return data;
    }
  });

  // Create mutation for adding readings
  const addReading = useMutation({
    mutationFn: async (reading: Reading) => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const {
        error
      } = await supabase.from('blood_sugar_readings').insert([{
        date: reading.date,
        hba1c: reading.hba1c ? parseFloat(reading.hba1c.toString()) : null,
        fasting: reading.fasting ? parseInt(reading.fasting.toString()) : null,
        post_prandial: reading.post_prandial ? parseInt(reading.post_prandial.toString()) : null,
        user_id: user.id
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['blood-sugar-readings']
      });
      setNewReading({
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Reading added successfully!');
    },
    onError: error => {
      console.error('Error adding reading:', error);
      toast.error('Failed to add reading. Please try again.');
    }
  });

  // Delete mutation
  const deleteReading = useMutation({
    mutationFn: async (readingId: string) => {
      console.log('Deleting reading with ID:', readingId);
      const {
        error
      } = await supabase.from('blood_sugar_readings').delete().eq('id', readingId);
      if (error) {
        console.error('Error deleting reading:', error);
        throw error;
      }
      console.log('Reading deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['blood-sugar-readings']
      });
      refetch(); // Explicitly refetch the data
      toast.success('Reading deleted successfully!');
      setReadingToDelete(null);
    },
    onError: error => {
      console.error('Error deleting reading:', error);
      toast.error('Failed to delete reading. Please try again.');
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReading.mutate(newReading);
  };
  const handleDelete = (reading: Reading) => {
    console.log('Setting reading to delete:', reading);
    setReadingToDelete(reading);
  };
  const confirmDelete = () => {
    if (readingToDelete?.id) {
      console.log('Confirming deletion of reading:', readingToDelete);
      deleteReading.mutate(readingToDelete.id);
    }
  };
  return <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-orange-600">Blood Sugar Readings</h2>
      
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input type="date" value={newReading.date} onChange={e => setNewReading({
          ...newReading,
          date: e.target.value
        })} required />
          <Input type="number" placeholder="HbA1c (%)" value={newReading.hba1c || ''} onChange={e => setNewReading({
          ...newReading,
          hba1c: e.target.value ? parseFloat(e.target.value) : null
        })} step="0.1" />
          <Input type="number" placeholder="Fasting (mg/dL)" value={newReading.fasting || ''} onChange={e => setNewReading({
          ...newReading,
          fasting: e.target.value ? parseInt(e.target.value) : null
        })} />
          <Input type="number" placeholder="Post-prandial (mg/dL)" value={newReading.post_prandial || ''} onChange={e => setNewReading({
          ...newReading,
          post_prandial: e.target.value ? parseInt(e.target.value) : null
        })} />
        </div>
        <Button type="submit" className="bg-primary">Add Reading</Button>
      </form>

      <div className="space-y-4 mb-6">
        {readings.map(reading => <Card key={reading.id} className="p-4 bg-primary-light">
            <div className="flex justify-between items-start">
              <div className="grid md:grid-cols-4 gap-4">
                <p className="font-semibold">{new Date(reading.date).toLocaleDateString()}</p>
                {reading.hba1c && <p>HbA1c: {reading.hba1c}%</p>}
                {reading.fasting && <p>Fasting: {reading.fasting} mg/dL</p>}
                {reading.post_prandial && <p>Post-prandial: {reading.post_prandial} mg/dL</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDelete(reading)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>)}
      </div>

      <BloodSugarTrendChart readings={readings} />

      <AlertDialog open={!!readingToDelete} onOpenChange={() => setReadingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reading</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reading? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};
export default ReadingsLog;