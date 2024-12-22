import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MedicineTracker from '@/components/MedicineTracker';
import ReadingsLog from '@/components/ReadingsLog';
import PrescriptionManager from '@/components/PrescriptionManager';
import { toast } from 'sonner';
import { Activity, Pill, LogOut, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import Logo from '@/components/Logo';
import ConfettiAnimation from '@/components/ConfettiAnimation';

const Index = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Check if this is the user's first visit
    const checkFirstVisit = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const lastVisitKey = `last_visit_${session.user.id}`;
      const lastVisit = localStorage.getItem(lastVisitKey);

      if (!lastVisit) {
        setShowConfetti(true);
        localStorage.setItem(lastVisitKey, new Date().toISOString());
      }
    };

    checkFirstVisit();

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

    const interval = setInterval(checkTime, 60000);
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
    <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
      {showConfetti && (
        <ConfettiAnimation onComplete={() => setShowConfetti(false)} />
      )}
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 md:mb-8">
        <Logo />
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
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6 md:mb-8">
          <TabsTrigger value="medicine" className="space-x-2">
            <Pill className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Medicine Tracking</span>
            <span className="sm:hidden">Medicine</span>
          </TabsTrigger>
          <TabsTrigger value="readings" className="space-x-2">
            <Activity className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Blood Sugar Readings</span>
            <span className="sm:hidden">Readings</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="space-x-2">
            <FileText className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Prescriptions</span>
            <span className="sm:hidden">Prescriptions</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medicine">
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Daily Medicine Tracker</h2>
            <MedicineTracker />
          </section>
        </TabsContent>
        
        <TabsContent value="readings">
          <ReadingsLog />
        </TabsContent>

        <TabsContent value="prescriptions">
          <PrescriptionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;