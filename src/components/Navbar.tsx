import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, Database, LayoutDashboard, LogOut, User } from "lucide-react";
import { toast } from "sonner";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };
  
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
            
            {user && (
              <>
                <Link to="/data">
                  <Button 
                    variant={isActive("/data") ? "default" : "ghost"}
                    className="gap-2"
                    size="sm"
                  >
                    <Database className="h-4 w-4" />
                    Data
                  </Button>
                </Link>
                <Link to="/dashboards">
                  <Button 
                    variant={isActive("/dashboards") ? "default" : "ghost"}
                    className="gap-2"
                    size="sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboards
                  </Button>
                </Link>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
            
            {!user && (
              <Link to="/auth">
                <Button variant="hero" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
