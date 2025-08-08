import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Activity, Pill, ChartLine, Bell, Shield, Heart, LogIn, UserPlus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Logo from '@/components/Logo';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const features = [
    {
      icon: <Pill className="w-8 h-8 text-primary" />,
      title: "Medicine Tracking",
      description: "Never miss a dose with our intuitive medicine tracking system. Get timely reminders for your morning, afternoon, and night medications."
    },
    {
      icon: <ChartLine className="w-8 h-8 text-primary" />,
      title: "Blood Sugar Monitoring",
      description: "Track your blood sugar levels with ease. Record and visualize HbA1c, fasting, and post-prandial readings to better manage your diabetes."
    },
    {
      icon: <Activity className="w-8 h-8 text-primary" />,
      title: "Progress Visualization",
      description: "View your health journey through interactive charts and graphs. Identify patterns and trends in your blood sugar levels over time."
    },
    {
      icon: <Bell className="w-8 h-8 text-primary" />,
      title: "Smart Reminders",
      description: "Receive timely notifications for medicine intake and blood sugar readings. Stay on top of your diabetes management routine."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure & Private",
      description: "Your health data is protected with industry-standard security measures. Access your information safely from anywhere."
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "User-Friendly",
      description: "Simple and intuitive interface designed for users of all ages. Easy to use, yet powerful enough for comprehensive diabetes management."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 -z-10" />
      
      {/* Navigation Bar */}
      <nav className="glass-nav sticky top-4 mx-4 z-50 p-4">
        <div className="flex justify-between items-center">
          <Logo size={28} />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')} 
              className="glass-button text-primary hover:bg-primary/10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="glass-button bg-primary/90 hover:bg-primary text-white border-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-display-large font-bold text-primary mb-6">
            Diabeticks
          </h1>
          <p className="text-headline text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal diabetes management companion. Track medicines, monitor blood sugar, and take control of your health journey.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="glass-button bg-primary hover:bg-primary/90 text-white px-8 py-3 text-body font-medium" 
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="glass-button border-primary/20 text-primary hover:bg-primary/5 px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="glass-card p-6 hover:scale-105 transition-all duration-300 animate-scale-in border-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-2xl bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-title font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-body text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 animate-fade-in">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h2 className="text-headline font-bold mb-6 text-primary">
              Ready to Take Control of Your Diabetes?
            </h2>
            <Button 
              size="lg" 
              className="glass-button bg-primary hover:bg-primary/90 text-white px-8 py-3 text-body font-medium" 
              onClick={() => navigate('/auth')}
            >
              Join Diabeticks Today
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="glass-card mt-16 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © 2024 Diabeticks. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <button
                onClick={() => navigate('/privacy')}
                className="text-muted-foreground hover:text-primary text-sm underline transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="text-muted-foreground hover:text-primary text-sm underline transition-colors"
              >
                Terms of Use
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
