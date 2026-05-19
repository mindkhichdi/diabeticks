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
import { ThemeToggle } from '@/components/ThemeToggle';
import MascotNudge from '@/components/MascotNudge';
import Mascot from '@/components/Mascot';
import {
  SketchStar, SketchHeart, SketchArrow, SketchSquiggle, SketchSparkle, SketchSun, SketchCloud, Sticker,
} from '@/components/Sketches';

type TabKey = 'medicine' | 'readings' | 'prescriptions' | 'food' | 'fitness';

const nudges: Record<TabKey, string> = {
  medicine: "Hey friend! Let's tick off today's meds 💊 You've got this!",
  readings: "Quick check-in — log your sugar reading so we keep your streak alive!",
  prescriptions: "Snap a prescription and I'll keep it safe for you ✨",
  food: "What did you eat? Let's keep those macros happy 🥗",
  fitness: "Move that body! Even 10 minutes counts 💪",
};

const tabMeta: Record<TabKey, {
  title: string; emoji: string; tape: string; tilt: string;
}> = {
  medicine: { title: 'Medicine', emoji: '💊', tape: 'washi', tilt: 'scrap-tilt-l' },
  readings: { title: 'Readings', emoji: '🩸', tape: 'washi washi-r washi-mint', tilt: 'scrap-tilt-r' },
  prescriptions: { title: 'Prescriptions', emoji: '📄', tape: 'washi', tilt: 'scrap-tilt-l' },
  food: { title: 'Nutrition', emoji: '🥗', tape: 'washi washi-r', tilt: 'scrap-tilt-r' },
  fitness: { title: 'Fitness', emoji: '🏃', tape: 'washi washi-mint', tilt: 'scrap-tilt-l' },
};

const Index = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('medicine');
  const [userName, setUserName] = useState<string>('friend');

  useEffect(() => {
    const checkFirstVisit = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const meta = session.user.user_metadata as { full_name?: string; name?: string } | undefined;
      const name = meta?.full_name || meta?.name || session.user.email?.split('@')[0];
      if (name) setUserName(name.split(' ')[0]);
      const lastVisitKey = `last_visit_${session.user.id}`;
      const lastVisit = localStorage.getItem(lastVisitKey);
      if (!lastVisit) {
        setShowConfetti(true);
        localStorage.setItem(lastVisitKey, new Date().toISOString());
      }
    };
    checkFirstVisit();

    if ('Notification' in window) Notification.requestPermission();

    const checkTime = () => {
      const now = new Date();
      const times = [
        { hour: 7, min: 50, label: 'morning' },
        { hour: 13, min: 50, label: 'afternoon' },
        { hour: 19, min: 50, label: 'night' },
      ];
      times.forEach(({ hour, min, label }) => {
        if (now.getHours() === hour && now.getMinutes() === min) {
          toast.info(`Time to take your ${label} medicine in 10 minutes!`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Medicine Reminder', { body: `Time to take your ${label} medicine in 10 minutes!` });
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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const meta = tabMeta[activeTab];

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Decorative background sketches */}
      <SketchCloud className="absolute top-10 right-8 text-primary/20 hidden md:block animate-float" size={90} />
      <SketchSun className="absolute top-32 left-6 text-accent hidden md:block" size={64} />
      <SketchStar className="absolute bottom-40 right-16 text-primary/30 hidden md:block animate-bounce-gentle" size={32} />
      <SketchSparkle className="absolute top-1/3 right-1/4 text-primary/40 hidden lg:block" />
      <SketchSparkle className="absolute bottom-1/3 left-12 text-accent" />

      {/* Header */}
      <header className="whoop-nav sticky top-3 sm:top-6 mx-3 sm:mx-6 z-50 p-3 sm:p-4 relative">
        <span className="washi hidden sm:block" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="whoop-button text-muted-foreground hover:text-foreground hover:bg-secondary text-xs sm:text-sm px-2 sm:px-4"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 sm:pb-32 relative">
        {showConfetti && <ConfettiAnimation onComplete={() => setShowConfetti(false)} />}
        <MascotNudge message={nudges[activeTab]} triggerKey={activeTab} />

        {/* Bento greeting */}
        <section className="grid grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-slide-up">
          {/* Greeting card spanning */}
          <div className="col-span-6 md:col-span-4 whoop-card p-5 sm:p-7 relative overflow-hidden scrap-tilt-l">
            <span className="washi" aria-hidden="true" />
            <div className="flex items-center gap-4">
              <div className="animate-bounce-gentle shrink-0">
                <Mascot size={88} mood="wave" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{greeting}</p>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold mt-1 truncate">
                  Hi <span className="scribble-under text-primary">{userName}</span>!
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Little wins, every day. Let's make today count — Pip is rooting for you.
                </p>
              </div>
            </div>
            <SketchSparkle className="absolute top-4 right-6 text-primary/50" />
            <SketchHeart className="absolute -bottom-2 right-8 text-accent rotate-12" size={36} />
          </div>

          {/* Streak / sticker tile */}
          <div className="col-span-3 md:col-span-2 whoop-card p-5 relative overflow-hidden scrap-tilt-r flex flex-col justify-between">
            <span className="washi washi-r washi-mint" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Streak</p>
              <p className="whoop-metric-large text-primary mt-1">7<span className="text-base text-muted-foreground font-sans font-semibold ml-1">days</span></p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <SketchStar className="text-primary" size={22} />
              <SketchStar className="text-accent" size={22} />
              <SketchStar className="text-primary/60" size={22} />
              <SketchArrow className="text-muted-foreground ml-auto" size={42} />
            </div>
          </div>

          {/* Quick stickers row (mobile shows below greeting) */}
          <div className="col-span-3 md:hidden whoop-card p-4 flex items-center justify-around">
            <Sticker emoji="💊" rotate={-12} />
            <Sticker emoji="🩸" rotate={6} />
            <Sticker emoji="🥗" rotate={-4} />
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
          {/* Active section card */}
          <div className="animate-slide-up">
            {(Object.keys(tabMeta) as TabKey[]).map((k) => (
              <TabsContent key={k} value={k} className="space-y-0 mt-0">
                <div className={`whoop-card p-4 sm:p-8 relative ${tabMeta[k].tilt}`}>
                  <span className={tabMeta[k].tape} aria-hidden="true" />
                  <div className="flex items-center gap-3 mb-5 sm:mb-7">
                    <span className="text-2xl sm:text-3xl">{tabMeta[k].emoji}</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight scribble-under">
                      {tabMeta[k].title}
                    </h2>
                    <SketchSparkle className="text-primary/60 ml-1" />
                  </div>
                  <div className="-rotate-0">
                    {k === 'medicine' && <MedicineTracker />}
                    {k === 'readings' && <ReadingsLog />}
                    {k === 'prescriptions' && <PrescriptionManager />}
                    {k === 'food' && <FoodTracker />}
                    {k === 'fitness' && <FitnessTracker />}
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>

          {/* Bottom Navigation — pill-shaped scrapbook style */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 sm:pb-6 px-2 pb-[env(safe-area-inset-bottom)]">
            <TabsList className="whoop-nav p-1.5 sm:p-2 gap-0.5 sm:gap-1 rounded-full">
              {([
                { v: 'medicine', icon: Pill, label: 'Meds' },
                { v: 'readings', icon: Heart, label: 'Reads' },
                { v: 'prescriptions', icon: FileText, label: 'Scripts' },
                { v: 'food', icon: Utensils, label: 'Food' },
                { v: 'fitness', icon: Activity, label: 'Move' },
              ] as const).map(({ v, icon: Icon, label }) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="whoop-button flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.5)] transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
                  <span className="text-[9px] sm:text-[11px] font-semibold">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
