import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MedicineTracker from '@/components/MedicineTracker';
import ReadingsLog from '@/components/ReadingsLog';
import { toast } from 'sonner';
import { Pill, Activity } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useState } from 'react';

const Index = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateLogo = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-logo');
        if (error) throw error;
        setLogoUrl(data.image);
      } catch (error) {
        console.error('Error generating logo:', error);
      }
    };

    generateLogo();
  }, []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Set up medicine reminders
    const checkTime = () => {
      const now = new Date();
      const times = [
        { hour: 7, min: 50, label: 'morning' },
        { hour: 13, min: 50, label: 'afternoon' },
        { hour: 19, min: 50, label: 'night' }
      ];

      times.forEach(({ hour, min, label }) => {
        if (now.getHours() === hour && now.getMinutes() === min) {
          toast.info(`Time to take your ${label} medicine in 10 minutes!`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Medicine Reminder`, {
              body: `Time to take your ${label} medicine in 10 minutes!`,
            });
          }
        }
      });
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center justify-center gap-4 mb-8">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Diabeticks Logo" 
            className="w-12 h-12 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold text-primary">Diabeticks</h1>
      </div>
      
      <Tabs defaultValue="medicine" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="medicine" className="space-x-2">
            <Pill className="w-5 h-5" />
            <span>Medicine Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="readings" className="space-x-2">
            <Activity className="w-5 h-5" />
            <span>Blood Sugar Readings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medicine">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Daily Medicine Tracker</h2>
            <MedicineTracker />
          </section>
        </TabsContent>
        
        <TabsContent value="readings">
          <ReadingsLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;