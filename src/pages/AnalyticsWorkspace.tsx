import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSidebar } from "@/components/analytics/ChartSidebar";
import { DatasetSelector } from "@/components/analytics/DatasetSelector";
import { VisualizationBuilder, VisualizationConfig } from "@/components/analytics/VisualizationBuilder";
import { DashboardCanvas } from "@/components/analytics/DashboardCanvas";
import { AIVisualizationInput } from "@/components/analytics/AIVisualizationInput";
import { SuggestionCards } from "@/components/analytics/SuggestionCards";
import { ChartType } from "@/components/charts/ChartIcon";
import { Plus, Upload, Save, Layout, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Dataset {
  id: string;
  name: string;
  columns_schema: { name: string; type: string }[] | null;
  row_count: number | null;
  file_path: string;
}

interface Suggestion {
  chartType: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  description: string;
}

const AnalyticsWorkspace = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [visualizations, setVisualizations] = useState<(VisualizationConfig & { id: string })[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
  const columns = (selectedDataset?.columns_schema as { name: string; type: string }[]) || [];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchDatasets(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDatasets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for columns_schema
      const typedData = (data || []).map(d => ({
        ...d,
        columns_schema: d.columns_schema as { name: string; type: string }[] | null
      }));
      
      setDatasets(typedData);
      
      if (typedData.length > 0) {
        setSelectedDatasetId(typedData[0].id);
        await fetchDatasetData(typedData[0].file_path);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasetData = async (filePath: string) => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("datasets")
        .download(filePath);

      if (error) throw error;

      const text = await data.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim());
      
      const parsed = lines.slice(1).map((line) => {
        const values = line.split(",");
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || "";
          // Try to parse as number
          const numValue = parseFloat(value);
          row[header] = isNaN(numValue) ? value : numValue;
        });
        return row;
      });

      setParsedData(parsed);
    } catch (error: any) {
      toast.error("Failed to load dataset: " + error.message);
      setParsedData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDatasetSelect = async (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    const dataset = datasets.find((d) => d.id === datasetId);
    if (dataset) {
      await fetchDatasetData(dataset.file_path);
    }
  };

  const handleChartSelect = (type: ChartType) => {
    if (!selectedDatasetId) {
      toast.error("Please select a dataset first");
      return;
    }
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
      xAxis: suggestion.xAxis || columns[0]?.name || "",
      yAxis: suggestion.yAxis || columns[1]?.name || columns[0]?.name || "",
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
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
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <DatasetSelector
              datasets={datasets}
              selectedDataset={selectedDatasetId}
              onSelect={handleDatasetSelect}
            />
            
            <div className="flex gap-2">
              <Link to="/upload">
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Data
                </Button>
              </Link>
              <Button variant="hero" className="gap-2">
                <Save className="h-4 w-4" />
                Save Dashboard
              </Button>
            </div>
          </div>

          {/* AI Input */}
          {selectedDatasetId && columns.length > 0 && (
            <AIVisualizationInput
              columns={columns}
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
              columns={columns}
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
            <>
              {datasets.length === 0 ? (
                <Card className="flex-1 flex flex-col items-center justify-center p-12 border-0 shadow-md">
                  <div className="h-20 w-20 rounded-full bg-gradient-primary opacity-20 mb-6" />
                  <h2 className="text-2xl font-bold mb-2">No Datasets Yet</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Upload your first dataset to start creating powerful visualizations
                  </p>
                  <Link to="/upload">
                    <Button variant="hero" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Dataset
                    </Button>
                  </Link>
                </Card>
              ) : dataLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DashboardCanvas
                  visualizations={visualizations}
                  data={parsedData}
                  onRemove={handleRemoveVisualization}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWorkspace;
