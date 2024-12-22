import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Activity, Pill, ChartLine, Bell, Shield, Heart, LogIn, UserPlus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">Diabeticks</h2>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
              <Button
                className="flex items-center gap-2"
                onClick={() => navigate('/auth')}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Diabeticks
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal diabetes management companion. Track medicines, monitor blood sugar, and take control of your health journey.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary-light"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Take Control of Your Diabetes?
          </h2>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={() => navigate('/auth')}
          >
            Join Diabeticks Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;