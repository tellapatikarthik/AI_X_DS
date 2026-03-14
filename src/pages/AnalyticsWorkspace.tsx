import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSidebar } from "@/components/analytics/ChartSidebar";
import { VisualizationBuilder, VisualizationConfig } from "@/components/analytics/VisualizationBuilder";
import { DashboardCanvas } from "@/components/analytics/DashboardCanvas";
import { AIVisualizationInput } from "@/components/analytics/AIVisualizationInput";
import { SuggestionCards } from "@/components/analytics/SuggestionCards";
import { WorkspaceChatbot } from "@/components/analytics/WorkspaceChatbot";
import { DataFilter } from "@/components/analytics/DataFilter";
import { ChartType } from "@/components/charts/ChartIcon";
import { Save, Loader2, ArrowLeft, Sparkles, Wrench, FileSpreadsheet, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  chartType: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  description: string;
}

interface FilterRule {
  id: string;
  column: string;
  operator: string;
  value: string;
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
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [filteredData, setFilteredData] = useState<any[]>([]);

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
      setFilteredData(JSON.parse(storedData));
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

  const applyFilters = (selectedValues: Record<string, string[]>) => {
    setFilters(selectedValues);
    if (Object.keys(selectedValues).length === 0) {
      setFilteredData(parsedData);
      return;
    }

    const filtered = parsedData.filter(row => {
      return Object.entries(selectedValues).every(([column, values]) => {
        const rowValue = String(row[column] ?? "");
        return values.includes(rowValue);
      });
    });
    setFilteredData(filtered);
  };

  const isNumericColumn = (col: string, dataSample: any[]) => {
    const sample = dataSample.slice(0, 30);
    return sample.some((row) => typeof row?.[col] === "number" && !Number.isNaN(row[col]));
  };

  const getDefaultAxes = (cols: string[], dataSample: any[]) => {
    const xAxis = cols[0] || "";
    const yAxis =
      cols.find((c) => c !== xAxis && isNumericColumn(c, dataSample)) ||
      cols.find((c) => isNumericColumn(c, dataSample)) ||
      cols[1] ||
      xAxis;

    return { xAxis, yAxis: yAxis || "" };
  };

  const generateAISuggestions = async (cols: string[], data: any[], userPrompt: string) => {
    setAiLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('suggest-visualizations', {
        body: {
          userRequest: userPrompt,
          columns: cols,
          sampleData: data.slice(0, 10),
        }
      });

      if (error) {
        console.error("Supabase error:", error);
        // Fallback: create basic visualizations
        createFallbackVisualizations(cols, data);
        return;
      }

      if (response?.suggestions) {
        setSuggestions(response.suggestions);
        
        // Auto-apply first 3 suggestions in prompting mode
        const defaults = getDefaultAxes(cols, data);

        response.suggestions.slice(0, 3).forEach((suggestion: Suggestion) => {
          const newViz: VisualizationConfig & { id: string } = {
            chartType: suggestion.chartType,
            title: suggestion.title,
            xAxis:
              suggestion.xAxis && cols.includes(suggestion.xAxis)
                ? suggestion.xAxis
                : defaults.xAxis,
            yAxis:
              suggestion.yAxis &&
              cols.includes(suggestion.yAxis) &&
              isNumericColumn(suggestion.yAxis, data)
                ? suggestion.yAxis
                : defaults.yAxis,
            description: suggestion.description,
            id: crypto.randomUUID(),
          };
          setVisualizations((prev) => [...prev, newViz]);
        });
        
        toast.success("AI generated visualizations based on your request!");
      } else {
        createFallbackVisualizations(cols, data);
      }
    } catch (error: any) {
      console.error("AI suggestion error:", error);
      createFallbackVisualizations(cols, data);
    } finally {
      setAiLoading(false);
    }
  };

  const createFallbackVisualizations = (cols: string[], data: any[]) => {
    const defaults = getDefaultAxes(cols, data);
    const charts: Array<{ type: ChartType; title: string }> = [
      { type: "clustered-column", title: "Column Chart" },
      { type: "line", title: "Line Chart" },
      { type: "pie", title: "Pie Chart" },
    ];

    charts.forEach(chart => {
      const newViz: VisualizationConfig & { id: string } = {
        chartType: chart.type,
        title: chart.title,
        xAxis: defaults.xAxis,
        yAxis: defaults.yAxis,
        id: crypto.randomUUID(),
      };
      setVisualizations((prev) => [...prev, newViz]);
    });
    
    toast.success("Created basic visualizations for your data!");
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

  const handleVisualizationRequest = async (userPrompt: string) => {
    await generateAISuggestions(columns, parsedData, userPrompt);
  };

  const handleSuggestions = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions);
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const defaults = getDefaultAxes(columns, parsedData);

    const newViz: VisualizationConfig & { id: string } = {
      chartType: suggestion.chartType,
      title: suggestion.title,
      xAxis:
        suggestion.xAxis && columns.includes(suggestion.xAxis)
          ? suggestion.xAxis
          : defaults.xAxis,
      yAxis:
        suggestion.yAxis &&
        columns.includes(suggestion.yAxis) &&
        isNumericColumn(suggestion.yAxis, parsedData)
          ? suggestion.yAxis
          : defaults.yAxis,
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
                <img src="/AIXDS.png" alt="AI X DS" className="h-7 w-7" />
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
              <DataFilter
                columns={columns}
                data={parsedData}
                onApplyFilter={applyFilters}
                activeFilters={filters}
              />
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  New File
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
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
              sampleData={filteredData}
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
              data={filteredData}
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
              data={filteredData}
              onRemove={handleRemoveVisualization}
            />
          )}
        </div>
      </div>

      {/* Chatbot */}
      <WorkspaceChatbot
        columns={columns}
        data={filteredData}
        onVisualizationRequest={handleVisualizationRequest}
      />
    </div>
  );
};

export default AnalyticsWorkspace;
