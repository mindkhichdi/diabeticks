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
  const features = [{
    icon: <Pill className="w-8 h-8 text-primary" />,
    title: "Medicine Tracking",
    description: "Never miss a dose with our intuitive medicine tracking system. Get timely reminders for your morning, afternoon, and night medications."
  }, {
    icon: <ChartLine className="w-8 h-8 text-primary" />,
    title: "Blood Sugar Monitoring",
    description: "Track your blood sugar levels with ease. Record and visualize HbA1c, fasting, and post-prandial readings to better manage your diabetes."
  }, {
    icon: <Activity className="w-8 h-8 text-primary" />,
    title: "Progress Visualization",
    description: "View your health journey through interactive charts and graphs. Identify patterns and trends in your blood sugar levels over time."
  }, {
    icon: <Bell className="w-8 h-8 text-primary" />,
    title: "Smart Reminders",
    description: "Receive timely notifications for medicine intake and blood sugar readings. Stay on top of your diabetes management routine."
  }, {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "Secure & Private",
    description: "Your health data is protected with industry-standard security measures. Access your information safely from anywhere."
  }, {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "User-Friendly",
    description: "Simple and intuitive interface designed for users of all ages. Easy to use, yet powerful enough for comprehensive diabetes management."
  }];
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-32 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-80 right-1/3 w-48 h-48 bg-accent/5 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/2 w-72 h-72 bg-success/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="glass backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo variant="full" size={28} />
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')} 
                className="flex items-center gap-2 hover:bg-primary/10 text-primary border border-primary/20 rounded-full px-6"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/auth')} 
                className="flex items-center gap-2 bg-gradient-primary text-white shadow-glow hover:shadow-float transition-all duration-300 rounded-full px-6"
              >
                <UserPlus className="w-4 h-4" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-20 animate-slide-up">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-primary bg-clip-text text-transparent mb-4 animate-glow">
              Diabeticks
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-muted-foreground">
              <Pill className="w-5 h-5 text-primary animate-bounce" />
              <span>Your Health, Your Way</span>
              <Heart className="w-5 h-5 text-accent animate-pulse" />
            </div>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your diabetes management with our beautiful, intuitive app. Track medicines, monitor health metrics, and take control of your wellness journey with style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-primary text-white shadow-glow hover:shadow-float transition-all duration-300 rounded-full px-8 py-4 text-lg font-bold" 
              onClick={() => navigate('/auth')}
            >
              <Pill className="w-5 h-5 mr-2" />
              Start Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-full px-8 py-4 text-lg font-bold backdrop-blur"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group p-8 glass border border-white/20 hover:shadow-float transition-all duration-500 rounded-2xl animate-slide-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(feature.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20 animate-slide-up">
          <div className="glass border border-white/20 rounded-3xl p-12 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black bg-gradient-accent bg-clip-text text-transparent mb-6">
              Ready to Transform Your Health?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who are already managing their diabetes with confidence and style.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-accent text-white shadow-glow hover:shadow-float transition-all duration-300 rounded-full px-10 py-4 text-lg font-bold" 
              onClick={() => navigate('/auth')}
            >
              <Heart className="w-5 h-5 mr-2 animate-pulse" />
              Join Diabeticks Today
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Landing;