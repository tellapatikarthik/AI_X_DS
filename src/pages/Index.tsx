import { Card } from "@/components/ui/card";
import { MessageSquare, Wrench, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
              StudentAnalytics
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Choose Your
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Analytics Mode
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select how you want to work with your data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Prompting Mode */}
            <Link to="/prompting" className="block group">
              <Card className="p-8 h-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/50 group-hover:-translate-y-2 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <MessageSquare className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">Prompting Mode</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Upload your file and describe what visualizations you need. 
                      Our AI will automatically suggest and create the best charts for your data.
                    </p>
                  </div>
                  <div className="pt-4">
                    <span className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                      Get Started →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>

            {/* DataTool Mode */}
            <Link to="/datatool" className="block group">
              <Card className="p-8 h-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-accent/50 group-hover:-translate-y-2 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg">
                    <Wrench className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">DataTool Mode</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Upload your file and manually build visualizations using our 
                      Power BI-like interface. Full control over your charts and dashboards.
                    </p>
                  </div>
                  <div className="pt-4">
                    <span className="inline-flex items-center gap-2 text-accent font-semibold group-hover:gap-3 transition-all">
                      Get Started →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 StudentAnalytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
