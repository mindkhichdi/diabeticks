import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { Activity, Pill, ChartLine, Bell, Shield, Heart, LogIn, UserPlus, TrendingUp, Target, Award, Calendar, Smartphone, Users } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Logo from '@/components/Logo';

const Landing = () => {
  const navigate = useNavigate();
  const [demoProgress, setDemoProgress] = useState(0);
  const [activeStat, setActiveStat] = useState(0);

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

    // Demo animation
    const progressInterval = setInterval(() => {
      setDemoProgress(prev => prev >= 100 ? 0 : prev + 1);
    }, 100);

    // Rotate stats
    const statsInterval = setInterval(() => {
      setActiveStat(prev => (prev + 1) % 3);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(progressInterval);
      clearInterval(statsInterval);
    };
  }, [navigate]);

  const features = [
    {
      icon: <Pill className="w-8 h-8 text-primary" />,
      title: "Smart Medicine Tracking",
      description: "Never miss a dose with intelligent reminders and visual progress tracking. See your daily, weekly, and monthly medication adherence at a glance.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-success" />,
      title: "Blood Sugar Insights", 
      description: "Track and visualize your glucose levels with advanced analytics. Identify patterns and get personalized recommendations for better control.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Personalized Goals",
      description: "Set and achieve health goals tailored to your needs. Track progress with beautiful visualizations and celebrate milestones.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Award className="w-8 h-8 text-success" />,
      title: "Achievement System",
      description: "Stay motivated with badges, streaks, and rewards. Build healthy habits through gamified health tracking.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: "Mobile-First Design",
      description: "Access your health data anywhere with our responsive design. Seamlessly sync across all your devices.",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: <Users className="w-8 h-8 text-success" />,
      title: "Family Support",
      description: "Share progress with family and caregivers. Build a support network for better health outcomes.",
      color: "from-teal-500 to-green-500"
    }
  ];

  const demoStats = [
    { label: "Blood Sugar", value: "125 mg/dL", status: "Normal", color: "text-success" },
    { label: "Medication Streak", value: "7 days", status: "Great!", color: "text-primary" },
    { label: "Weekly Goal", value: "85%", status: "Almost there", color: "text-warning" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Floating health icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <Heart className="absolute top-20 left-10 w-6 h-6 text-primary/20 animate-float" />
        <Activity className="absolute top-40 right-20 w-8 h-8 text-success/20 animate-float" style={{ animationDelay: '1s' }} />
        <Pill className="absolute bottom-40 left-20 w-6 h-6 text-primary/20 animate-float" style={{ animationDelay: '2s' }} />
        <TrendingUp className="absolute bottom-20 right-10 w-7 h-7 text-success/20 animate-float" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Navigation Bar */}
      <nav className="health-nav sticky top-4 mx-4 z-50 p-4">
        <div className="flex justify-between items-center">
          <Logo size={28} />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')} 
              className="health-button text-primary hover:bg-primary/10 hover:scale-105"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="health-button bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Hero Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-secondary/50 text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium">
                <Heart className="w-4 h-4 mr-2" />
                Trusted by 10,000+ people with diabetes
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Take Control of Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-success"> Health Journey</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                The most intuitive diabetes management app that helps you track medications, monitor blood sugar, and achieve your health goals with confidence.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="health-button bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 text-lg font-semibold group" 
                onClick={() => navigate('/auth')}
              >
                Start Your Journey
                <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')} 
                className="health-button border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-white" />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">4.9/5</span> from 2,500+ reviews
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="health-card p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Live Health Dashboard</h3>
                <p className="text-muted-foreground text-sm">See how easy tracking can be</p>
              </div>
              
              {/* Demo Stats */}
              <div className="grid grid-cols-3 gap-4">
                {demoStats.map((stat, index) => (
                  <div 
                    key={index}
                    className={`text-center p-4 rounded-lg border transition-all duration-300 ${
                      activeStat === index ? 'bg-primary/10 border-primary animate-health-pulse' : 'bg-muted/30'
                    }`}
                  >
                    <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-xs font-medium mt-1">{stat.status}</div>
                  </div>
                ))}
              </div>

              {/* Demo Progress */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Daily Goal Progress</span>
                  <span className="font-semibold">{demoProgress}%</span>
                </div>
                <Progress value={demoProgress} className="h-3 animate-progress-fill" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Medications</span>
                  <span>Blood Sugar</span>
                  <span>Exercise</span>
                </div>
              </div>

              {/* Demo Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="health-button"
                  onClick={() => setDemoProgress(Math.min(100, demoProgress + 25))}
                >
                  <Pill className="w-4 h-4 mr-2" />
                  Log Medicine
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="health-button"
                  onClick={() => setActiveStat((activeStat + 1) % 3)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Add Reading
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Better Health
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed specifically for diabetes management and healthy living.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="health-card group cursor-pointer p-8 hover:-translate-y-2 transition-all duration-500 animate-scale-in border-0 overflow-hidden relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-success/10 w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  Learn more
                  <TrendingUp className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary to-success rounded-3xl p-12 mt-20 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold">10,000+</div>
              <div className="text-primary-foreground/80">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">500K+</div>
              <div className="text-primary-foreground/80">Medications Tracked</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">95%</div>
              <div className="text-primary-foreground/80">Adherence Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">4.9★</div>
              <div className="text-primary-foreground/80">User Rating</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20 animate-fade-in">
          <div className="health-card p-12 max-w-4xl mx-auto bg-gradient-to-br from-background to-secondary/20">
            <Award className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Ready to Transform Your Health Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands who've already taken control of their diabetes with our trusted, easy-to-use platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="health-button bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 text-lg font-semibold group animate-glow" 
                onClick={() => navigate('/auth')}
              >
                Start Free Today
                <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="health-button border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold"
                onClick={() => navigate('/auth')}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free forever • No credit card required • HIPAA compliant
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="health-card mt-20 p-8 bg-gradient-to-r from-muted/30 to-secondary/30">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Logo size={24} />
              <div className="text-muted-foreground text-sm">
                © 2024 Diabeticks. Empowering healthier lives.
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/privacy')}
                className="text-muted-foreground hover:text-primary text-sm transition-colors health-button"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="text-muted-foreground hover:text-primary text-sm transition-colors health-button"
              >
                Terms of Use
              </button>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
