import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSidebar } from "@/components/analytics/ChartSidebar";
import { VisualizationBuilder, VisualizationConfig } from "@/components/analytics/VisualizationBuilder";
import { DashboardCanvas } from "@/components/analytics/DashboardCanvas";
import { AIVisualizationInput } from "@/components/analytics/AIVisualizationInput";
import { SuggestionCards } from "@/components/analytics/SuggestionCards";
import { ChartType } from "@/components/charts/ChartIcon";
import { Save, Loader2, ArrowLeft, BarChart3, Sparkles, Wrench, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  chartType: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  description: string;
}

const AnalyticsWorkspace = () => {
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mode, setMode] = useState<'prompting' | 'datatool'>('datatool');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [visualizations, setVisualizations] = useState<(VisualizationConfig & { id: string })[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('analyticsData');
    const storedColumns = sessionStorage.getItem('analyticsColumns');
    const storedMode = sessionStorage.getItem('analyticsMode');
    const storedPrompt = sessionStorage.getItem('analyticsPrompt');

    if (!storedData || !storedColumns) {
      toast.error("No data loaded. Please upload a file first.");
      navigate('/');
      return;
    }

    try {
      setParsedData(JSON.parse(storedData));
      setColumns(JSON.parse(storedColumns));
      setMode(storedMode as 'prompting' | 'datatool' || 'datatool');
      setPrompt(storedPrompt || '');
      
      // If prompting mode, generate suggestions automatically
      if (storedMode === 'prompting' && storedPrompt) {
        generateAISuggestions(JSON.parse(storedColumns), JSON.parse(storedData), storedPrompt);
      }
    } catch (error) {
      toast.error("Failed to load data");
      navigate('/');
    }
    
    setLoading(false);
  }, [navigate]);

  const generateAISuggestions = async (cols: string[], data: any[], userPrompt: string) => {
    setAiLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('suggest-visualizations', {
        body: {
          columns: cols.map(name => ({ name, type: 'text' })),
          sampleData: data.slice(0, 10),
          userPrompt
        }
      });

      if (error) throw error;

      if (response?.suggestions) {
        setSuggestions(response.suggestions);
        
        // Auto-apply first 3 suggestions in prompting mode
        response.suggestions.slice(0, 3).forEach((suggestion: Suggestion) => {
          const newViz: VisualizationConfig & { id: string } = {
            chartType: suggestion.chartType,
            title: suggestion.title,
            xAxis: suggestion.xAxis || cols[0] || "",
            yAxis: suggestion.yAxis || cols[1] || cols[0] || "",
            description: suggestion.description,
            id: crypto.randomUUID(),
          };
          setVisualizations((prev) => [...prev, newViz]);
        });
        
        toast.success("AI generated visualizations based on your request!");
      }
    } catch (error: any) {
      console.error("AI suggestion error:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleChartSelect = (type: ChartType) => {
    setSelectedChartType(type);
    setShowBuilder(true);
  };

  const handleVisualizationSave = (config: VisualizationConfig) => {
    const newViz = {
      ...config,
      id: crypto.randomUUID(),
    };
    setVisualizations((prev) => [...prev, newViz]);
    setShowBuilder(false);
    setSelectedChartType(null);
    toast.success("Visualization added!");
  };

  const handleRemoveVisualization = (id: string) => {
    setVisualizations((prev) => prev.filter((v) => v.id !== id));
    toast.success("Visualization removed");
  };

  const handleSuggestions = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions);
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const newViz: VisualizationConfig & { id: string } = {
      chartType: suggestion.chartType,
      title: suggestion.title,
      xAxis: suggestion.xAxis || columns[0] || "",
      yAxis: suggestion.yAxis || columns[1] || columns[0] || "",
      description: suggestion.description,
      id: crypto.randomUUID(),
    };
    setVisualizations((prev) => [...prev, newViz]);
    toast.success("Visualization added from suggestion!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                  StudentAnalytics
                </span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                {mode === 'prompting' ? (
                  <>
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Prompting Mode</span>
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 text-accent" />
                    <span>DataTool Mode</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{parsedData.length} rows • {columns.length} columns</span>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  New File
                </Button>
              </Link>
              <Button variant="hero" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex">
        {/* Left Sidebar - Chart Types */}
        <div className="p-4">
          <ChartSidebar
            onSelectChart={handleChartSelect}
            selectedChart={selectedChartType || undefined}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
          {/* AI Loading State */}
          {aiLoading && (
            <Card className="p-6 border-0 shadow-md bg-primary/5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Generating visualizations...</p>
                  <p className="text-sm text-muted-foreground">AI is analyzing your data based on: "{prompt}"</p>
                </div>
              </div>
            </Card>
          )}

          {/* AI Input - for datatool mode or to get more suggestions */}
          {columns.length > 0 && !aiLoading && (
            <AIVisualizationInput
              columns={columns.map(name => ({ name, type: 'text' }))}
              sampleData={parsedData}
              onSuggestions={handleSuggestions}
            />
          )}

          {/* Suggestions */}
          <SuggestionCards
            suggestions={suggestions}
            onApply={handleApplySuggestion}
            onDismiss={() => setSuggestions([])}
          />

          {/* Visualization Builder */}
          {showBuilder && selectedChartType && columns.length > 0 && (
            <VisualizationBuilder
              chartType={selectedChartType}
              columns={columns.map(name => ({ name, type: 'text' }))}
              data={parsedData}
              onSave={handleVisualizationSave}
              onCancel={() => {
                setShowBuilder(false);
                setSelectedChartType(null);
              }}
            />
          )}

          {/* Dashboard Canvas */}
          {!showBuilder && (
            <DashboardCanvas
              visualizations={visualizations}
              data={parsedData}
              onRemove={handleRemoveVisualization}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWorkspace;
