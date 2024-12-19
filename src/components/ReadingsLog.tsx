import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Reading {
  date: string;
  hba1c?: string;
  fasting?: string;
  post_prandial?: string;
}

const ReadingsLog = () => {
  const queryClient = useQueryClient();
  const [newReading, setNewReading] = useState<Reading>({
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch readings
  const { data: readings = [] } = useQuery({
    queryKey: ['blood-sugar-readings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blood_sugar_readings')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create mutation for adding readings
  const addReading = useMutation({
    mutationFn: async (reading: Reading) => {
      const { error } = await supabase
        .from('blood_sugar_readings')
        .insert([{
          date: reading.date,
          hba1c: reading.hba1c ? parseFloat(reading.hba1c) : null,
          fasting: reading.fasting ? parseInt(reading.fasting) : null,
          post_prandial: reading.post_prandial ? parseInt(reading.post_prandial) : null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-sugar-readings'] });
      setNewReading({
        date: new Date().toISOString().split('T')[0],
      });
      toast.success('Reading added successfully!');
    },
    onError: (error) => {
      console.error('Error adding reading:', error);
      toast.error('Failed to add reading. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReading.mutate(newReading);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Blood Sugar Readings</h2>
      
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            type="date"
            value={newReading.date}
            onChange={(e) => setNewReading({ ...newReading, date: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="HbA1c (%)"
            value={newReading.hba1c || ''}
            onChange={(e) => setNewReading({ ...newReading, hba1c: e.target.value })}
            step="0.1"
          />
          <Input
            type="number"
            placeholder="Fasting (mg/dL)"
            value={newReading.fasting || ''}
            onChange={(e) => setNewReading({ ...newReading, fasting: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Post-prandial (mg/dL)"
            value={newReading.post_prandial || ''}
            onChange={(e) => setNewReading({ ...newReading, post_prandial: e.target.value })}
          />
        </div>
        <Button type="submit" className="bg-primary">Add Reading</Button>
      </form>

      <div className="space-y-4">
        {readings.map((reading) => (
          <Card key={reading.id} className="p-4 bg-primary-light">
            <div className="grid md:grid-cols-4 gap-4">
              <p className="font-semibold">{new Date(reading.date).toLocaleDateString()}</p>
              {reading.hba1c && <p>HbA1c: {reading.hba1c}%</p>}
              {reading.fasting && <p>Fasting: {reading.fasting} mg/dL</p>}
              {reading.post_prandial && <p>Post-prandial: {reading.post_prandial} mg/dL</p>}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ReadingsLog;