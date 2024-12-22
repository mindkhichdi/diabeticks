import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MedicineTracker from '@/components/MedicineTracker';
import ReadingsLog from '@/components/ReadingsLog';
import { toast } from 'sonner';
import { Activity, Pill, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Diabeticks</h1>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
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