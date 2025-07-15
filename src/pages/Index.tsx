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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
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
      const times = [{
        hour: 7,
        min: 50,
        label: 'morning'
      }, {
        hour: 13,
        min: 50,
        label: 'afternoon'
      }, {
        hour: 19,
        min: 50,
        label: 'night'
      }];
      times.forEach(({
        hour,
        min,
        label
      }) => {
        if (now.getHours() === hour && now.getMinutes() === min) {
          toast.info(`Time to take your ${label} medicine in 10 minutes!`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Medicine Reminder`, {
              body: `Time to take your ${label} medicine in 10 minutes!`
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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 -z-10" />
      
      {/* Header */}
      <header className="glass-nav sticky top-4 mx-4 z-50 p-4">
        <div className="flex items-center justify-between">
          <Logo />
          <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            className="glass-button text-red-600 hover:text-red-700 hover:bg-red-50/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
        
        <Tabs defaultValue="medicine" className="w-full">
          {/* Tab Content */}
          <div className="space-y-6 animate-fade-in">
            <TabsContent value="medicine" className="space-y-0">
              <div className="glass-card p-6">
                <h2 className="text-title font-semibold mb-6 text-primary">Daily Medicine Tracker</h2>
                <MedicineTracker />
              </div>
            </TabsContent>
            
            <TabsContent value="readings" className="space-y-0">
              <div className="glass-card p-6">
                <ReadingsLog />
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-0">
              <div className="glass-card p-6">
                <PrescriptionManager />
              </div>
            </TabsContent>

            <TabsContent value="food" className="space-y-0">
              <div className="glass-card p-6">
                <h2 className="text-title font-semibold mb-6 text-primary">Food Intake Tracker</h2>
                <FoodTracker />
              </div>
            </TabsContent>

            <TabsContent value="fitness" className="space-y-0">
              <div className="glass-card p-6">
                <FitnessTracker />
              </div>
            </TabsContent>
          </div>

          {/* Floating Bottom Navigation */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <TabsList className="glass-nav p-2 space-x-1">
              <TabsTrigger 
                value="medicine" 
                className="glass-button flex flex-col items-center px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Pill className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Medicine</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="readings" 
                className="glass-button flex flex-col items-center px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Heart className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Readings</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="prescriptions" 
                className="glass-button flex flex-col items-center px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Scripts</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="food" 
                className="glass-button flex flex-col items-center px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Utensils className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Food</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="fitness" 
                className="glass-button flex flex-col items-center px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Activity className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Fitness</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
