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
      title: "Data Upload & Management",
      description: "Upload CSV and Excel files, manage multiple datasets with ease"
    },
    {
      icon: Users,
      title: "Data Transformation",
      description: "Clean, filter, and transform your data with powerful built-in tools"
    },
    {
      icon: TrendingUp,
      title: "Visual Query Builder",
      description: "Create complex queries visually without writing code"
    },
    {
      icon: PieChart,
      title: "Multiple Chart Types",
      description: "Bar, line, pie, area, scatter plots and more visualization options"
    },
    {
      icon: Activity,
      title: "Dashboard Builder",
      description: "Drag-and-drop interface to create custom interactive dashboards"
    },
    {
      icon: Zap,
      title: "Real-time Analytics",
      description: "Live data updates and interactive filtering for instant insights"
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
                Complete Analytics Platform
                <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                  Like Power BI, Built for Students
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Upload data, transform it, create stunning visualizations, and build interactive 
                dashboards - all in one powerful platform designed for student analytics.
              </p>
              <div className="flex gap-4 pt-4">
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="gap-2">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/data">
                  <Button variant="outline" size="lg">
                    View Demo
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
              Everything You Need
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Upload → Transform → Visualize → Share
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete data analytics workflow from import to interactive dashboards
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
