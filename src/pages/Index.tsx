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
  return <div className="min-h-screen flex flex-col w-full relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-success/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="glass backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo variant="full" />
            <Button 
              onClick={handleSignOut} 
              className="flex items-center gap-2 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pt-8 pb-24">
        {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
        
        <Tabs defaultValue="medicine" className="w-full">
          <div className="space-y-8 animate-slide-up">
            <TabsContent value="medicine" className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Daily Medicine Tracker
                </h1>
                <p className="text-muted-foreground">Stay on track with your medication schedule</p>
              </div>
              <MedicineTracker />
            </TabsContent>
            
            <TabsContent value="readings" className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Health Readings
                </h1>
                <p className="text-muted-foreground">Monitor your vital health metrics</p>
              </div>
              <ReadingsLog />
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Prescriptions
                </h1>
                <p className="text-muted-foreground">Manage your prescription documents</p>
              </div>
              <PrescriptionManager />
            </TabsContent>

            <TabsContent value="food" className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Nutrition Tracker
                </h1>
                <p className="text-muted-foreground">Track your daily food intake and goals</p>
              </div>
              <FoodTracker />
            </TabsContent>

            <TabsContent value="fitness" className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">
                  Fitness Journey
                </h1>
                <p className="text-muted-foreground">Track your physical activity and progress</p>
              </div>
              <FitnessTracker />
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <TabsList className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-auto flex justify-center gap-2 glass backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-float z-50">
            <TabsTrigger 
              value="medicine" 
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
            >
              <Pill className="w-5 h-5" />
              <span className="text-xs font-medium">Medicine</span>
            </TabsTrigger>
            <TabsTrigger 
              value="readings" 
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs font-medium">Readings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="prescriptions" 
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs font-medium">Scripts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="food" 
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
            >
              <Utensils className="w-5 h-5" />
              <span className="text-xs font-medium">Food</span>
            </TabsTrigger>
            <TabsTrigger 
              value="fitness" 
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
            >
              <Activity className="w-5 h-5" />
              <span className="text-xs font-medium">Fitness</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>;
};
export default Index;