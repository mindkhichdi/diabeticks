import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MedicineTracker from '@/components/MedicineTracker';
import ReadingsLog from '@/components/ReadingsLog';
import PrescriptionManager from '@/components/PrescriptionManager';
import FoodTracker from '@/components/FoodTracker';
import FitnessTracker from '@/components/FitnessTracker';
import { toast } from 'sonner';
import { Activity, Pill, LogOut, FileText, Utensils, Heart } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col w-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
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
      </div>

      <div className="flex-1 container mx-auto px-4 pb-24">
        {showConfetti && (
          <ConfettiAnimation onComplete={() => setShowConfetti(false)} />
        )}
        
        <Tabs defaultValue="medicine" className="w-full">
          <div className="overflow-x-hidden mb-16">
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

            <TabsContent value="food">
              <section>
                <h2 className="text-xl md:text-2xl font-semibold mb-4">Food Intake Tracker</h2>
                <FoodTracker />
              </section>
            </TabsContent>

            <TabsContent value="fitness">
              <section>
                <h2 className="text-xl md:text-2xl font-semibold mb-4">Fitness Tracker</h2>
                <FitnessTracker />
              </section>
            </TabsContent>
          </div>

          <TabsList className="fixed bottom-0 left-0 right-0 w-full flex justify-around bg-white border-t border-gray-200 p-0 z-50 shadow-lg">
            <TabsTrigger 
              value="medicine" 
              className="flex flex-col items-center gap-1 py-3 px-4 w-full h-full min-h-[4.5rem] hover:bg-primary/5 data-[state=active]:bg-primary/10"
            >
              <Pill className="w-6 h-6" />
              <span className="text-xs font-medium">Medicine</span>
            </TabsTrigger>
            <TabsTrigger 
              value="readings" 
              className="flex flex-col items-center gap-1 py-3 px-4 w-full h-full min-h-[4.5rem] hover:bg-primary/5 data-[state=active]:bg-primary/10"
            >
              <Heart className="w-6 h-6" />
              <span className="text-xs font-medium">Readings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="prescriptions" 
              className="flex flex-col items-center gap-1 py-3 px-4 w-full h-full min-h-[4.5rem] hover:bg-primary/5 data-[state=active]:bg-primary/10"
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs font-medium">Scripts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="food" 
              className="flex flex-col items-center gap-1 py-3 px-4 w-full h-full min-h-[4.5rem] hover:bg-primary/5 data-[state=active]:bg-primary/10"
            >
              <Utensils className="w-6 h-6" />
              <span className="text-xs font-medium">Food</span>
            </TabsTrigger>
            <TabsTrigger 
              value="fitness" 
              className="flex flex-col items-center gap-1 py-3 px-4 w-full h-full min-h-[4.5rem] hover:bg-primary/5 data-[state=active]:bg-primary/10"
            >
              <Activity className="w-6 h-6" />
              <span className="text-xs font-medium">Fitness</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;