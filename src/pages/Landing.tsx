import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';
import { Activity, Pill, Heart, TrendingUp, Zap, Clock, Target, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react';
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
  const metrics = [{
    label: "STRAIN",
    value: "12.8",
    status: "Moderate",
    color: "text-primary"
  }, {
    label: "RECOVERY",
    value: "73%",
    status: "Green",
    color: "text-accent"
  }, {
    label: "SLEEP",
    value: "7h 42m",
    status: "Good",
    color: "text-chart-3"
  }];
  const features = [{
    icon: <Zap className="w-6 h-6" />,
    title: "Daily Strain",
    description: "Quantify how hard your body works",
    metric: "12.8"
  }, {
    icon: <Heart className="w-6 h-6" />,
    title: "Recovery Score",
    description: "Your body's readiness to perform",
    metric: "73%"
  }, {
    icon: <Clock className="w-6 h-6" />,
    title: "Sleep Performance",
    description: "Optimize your sleep for recovery",
    metric: "7h 42m"
  }, {
    icon: <Activity className="w-6 h-6" />,
    title: "HRV Trends",
    description: "Track heart rate variability",
    metric: "48ms"
  }];
  const benefits = ["91 more minutes of weekly activity", "2.3 more hours of sleep per week", "10% higher HRV on average", "Better health outcomes across all metrics"];
  return <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="whoop-nav sticky top-6 mx-6 z-50 p-4">
        <div className="flex justify-between items-center">
          <Logo size={32} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="whoop-button text-foreground hover:bg-secondary">
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')} className="whoop-button bg-primary text-primary-foreground hover:bg-primary/90">
              Join Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        {/* Main Hero */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Unlock better health with the all-new 
            <span className="text-primary"> DIABETICKS</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{
          animationDelay: '0.1s'
        }}>
            Get insights and guidance on which daily habits impact how fast you're aging — so you can take control, slow it down, and spend more years doing what you love.
          </p>
          <Button size="lg" className="whoop-button bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold animate-slide-up" style={{
          animationDelay: '0.2s'
        }} onClick={() => navigate('/auth')}>
            Join Now
          </Button>
        </div>

        {/* Live Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {metrics.map((metric, index) => <Card key={index} className="whoop-card p-8 text-center animate-scale-in hover:scale-105 transition-transform cursor-pointer" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="text-sm text-muted-foreground mb-2 tracking-widest uppercase">{metric.label}</div>
              <div className={`whoop-metric-large ${metric.color} mb-2 animate-metric-count`}>
                {metric.value}
              </div>
              <div className="text-sm font-medium">{metric.status}</div>
            </Card>)}
        </div>

        {/* Wear Daily Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            Wear DIABETIKS daily, improve your health
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Daily DIABETIKS wear is linked to 91 more minutes of weekly activity, 2.3 more hours of sleep per week, and over 10% higher HRV. Members see faster gains, stronger habits, and better outcomes across their goals.*
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => <Card key={index} className="whoop-card p-6 hover:scale-105 transition-all duration-200 animate-slide-up" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-primary">
                  {feature.icon}
                </div>
                <div className="whoop-metric-small">{feature.metric}</div>
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>)}
        </div>

        {/* Benefits Section */}
        <div className="whoop-card p-12 text-center mb-20">
          <h2 className="text-3xl font-bold mb-8">
            Unlock the full picture of your health
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            With 24/7 monitoring across sleep, strain, stress, and heart health, DIABETIKS gives you a complete view of your health — so you can make smarter decisions every day.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>)}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="whoop-card p-12 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Ready to unlock better health?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands who are already optimizing their health with DIABETIKS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="whoop-button bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold group" onClick={() => navigate('/auth')}>
                Join Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="whoop-button border border-border text-foreground hover:bg-secondary px-8 py-4 text-lg" onClick={() => navigate('/auth')}>
                <PlayCircle className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              *Results based on member data. Individual results may vary.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Logo size={24} />
              <div className="text-muted-foreground text-sm">
                © 2024 DIABETIKS. All rights reserved.
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button onClick={() => navigate('/privacy')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>;
};
export default Landing;