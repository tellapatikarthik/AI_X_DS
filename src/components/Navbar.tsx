import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, MessageSquare, Wrench } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StudentAnalytics
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                className="gap-2"
                size="sm"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            
            <Link to="/prompting">
              <Button 
                variant={isActive("/prompting") ? "default" : "ghost"}
                className="gap-2"
                size="sm"
              >
                <MessageSquare className="h-4 w-4" />
                Prompting
              </Button>
            </Link>
            
            <Link to="/datatool">
              <Button 
                variant={isActive("/datatool") ? "default" : "ghost"}
                className="gap-2"
                size="sm"
              >
                <Wrench className="h-4 w-4" />
                DataTool
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
