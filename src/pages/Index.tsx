import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MedicineTracker from '@/components/MedicineTracker';
import ReadingsLog from '@/components/ReadingsLog';
import MedicineCalendar from '@/components/MedicineCalendar';
import { toast } from 'sonner';

const Index = () => {
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
      <h1 className="text-3xl font-bold text-primary mb-8">Diabetes Care Assistant</h1>
      
      <Tabs defaultValue="medicine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medicine">Medicine Tracking</TabsTrigger>
          <TabsTrigger value="readings">Blood Sugar Readings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="medicine" className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Daily Medicine Tracker</h2>
            <MedicineTracker />
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Medicine Calendar</h2>
            <MedicineCalendar />
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