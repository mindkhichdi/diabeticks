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
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <header className="whoop-nav sticky top-6 mx-6 z-50 p-4">
        <div className="flex items-center justify-between">
          <Logo />
          <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            className="whoop-button text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-24">
        {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
        
        <Tabs defaultValue="medicine" className="w-full">
          {/* Tab Content */}
          <div className="space-y-8 animate-slide-up">
            <TabsContent value="medicine" className="space-y-0">
              <div className="whoop-card p-8">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Medicine</h2>
                <MedicineTracker />
              </div>
            </TabsContent>
            
            <TabsContent value="readings" className="space-y-0">
              <div className="whoop-card p-8">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Readings</h2>
                <ReadingsLog />
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-0">
              <div className="whoop-card p-8">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Prescriptions</h2>
                <PrescriptionManager />
              </div>
            </TabsContent>

            <TabsContent value="food" className="space-y-0">
              <div className="whoop-card p-8">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Nutrition</h2>
                <FoodTracker />
              </div>
            </TabsContent>

            <TabsContent value="fitness" className="space-y-0">
              <div className="whoop-card p-8">
                <h2 className="text-2xl font-bold mb-8 tracking-tight">Fitness</h2>
                <FitnessTracker />
              </div>
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <TabsList className="whoop-nav p-2 gap-1">
              <TabsTrigger 
                value="medicine" 
                className="whoop-button flex flex-col items-center px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Pill className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Medicine</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="readings" 
                className="whoop-button flex flex-col items-center px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Heart className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Readings</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="prescriptions" 
                className="whoop-button flex flex-col items-center px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Scripts</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="food" 
                className="whoop-button flex flex-col items-center px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Utensils className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Nutrition</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="fitness" 
                className="whoop-button flex flex-col items-center px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="w-4 h-4 mb-1" />
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
