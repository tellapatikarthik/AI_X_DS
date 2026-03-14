import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import PromptingMode from "./pages/PromptingMode";
import DataToolMode from "./pages/DataToolMode";
import DataQueryTool from "./pages/DataQueryTool";
import QuickerQuery from "./pages/QuickerQuery";
import AnalyticsWorkspace from "./pages/AnalyticsWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Index />} />
          <Route path="/prompting" element={<PromptingMode />} />
          <Route path="/datatool" element={<DataToolMode />} />
          <Route path="/query-tool" element={<DataQueryTool />} />
          <Route path="/quicker-query" element={<QuickerQuery />} />
          <Route path="/workspace" element={<AnalyticsWorkspace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
