import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BarChart3, Users, TrendingUp, PieChart, Activity, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-analytics.jpg";

const Index = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive data visualization with interactive charts and real-time insights"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Track and manage student information, performance, and engagement metrics"
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Monitor academic progress with detailed performance trends and predictions"
    },
    {
      icon: PieChart,
      title: "Custom Reports",
      description: "Generate customizable reports for different stakeholders and time periods"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Live dashboards with instant updates on student activities and metrics"
    },
    {
      icon: Zap,
      title: "Automated Insights",
      description: "AI-powered analysis to identify patterns and provide actionable recommendations"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  Next-Gen Analytics Platform
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Transform Student Data Into
                <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                  Actionable Insights
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                StudentAnalytics provides comprehensive analytics tools to track, analyze, and improve 
                student performance with beautiful visualizations and powerful reporting.
              </p>
              <div className="flex gap-4 pt-4">
                <Link to="/dashboard">
                  <Button variant="hero" size="lg" className="gap-2">
                    View Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/students">
                  <Button variant="outline" size="lg">
                    Manage Students
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
              <img 
                src={heroImage} 
                alt="Analytics Dashboard" 
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features for
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Complete Student Analytics
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and improve student outcomes in one unified platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 shadow-md hover:shadow-lg transition-all duration-300 border-0 group hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-md mb-4 group-hover:shadow-glow transition-all">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-hero shadow-xl border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 text-primary-foreground">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of educators using StudentAnalytics to transform their institutions
              </p>
              <Link to="/dashboard">
                <Button variant="accent" size="lg" className="gap-2">
                  Explore Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">StudentAnalytics</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 StudentAnalytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
