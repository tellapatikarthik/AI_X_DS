import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { applyColumnAliases, parseDatasetFile, type ParsedDataset } from "@/lib/datasetParser";
import { DatasetHistoryPanel, saveDatasetToHistory, loadDatasetFromHistory } from "@/components/analytics/DatasetHistory";

const PromptingMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});

  const displayDataset = useMemo(
    () => (dataset ? applyColumnAliases(dataset, columnAliases) : null),
    [dataset, columnAliases]
  );

  const columns = displayDataset?.columns ?? [];
  const rowCount = displayDataset?.data.length ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const parsed = await parseDatasetFile(file);
      setDataset(parsed);
      setColumnAliases({});
      saveDatasetToHistory(file.name, parsed.data, parsed.columns, "prompting");
      toast.success(`File loaded: ${parsed.data.length} rows, ${parsed.columns.length} columns`);
    } catch (error: any) {
      console.error("File parse error:", error);
      setDataset(null);
      setColumnAliases({});
      toast.error(error?.message || "Failed to parse file");
    }
  };

  const handleSelectDataset = (id: string) => {
    const loaded = loadDatasetFromHistory(id);
    if (loaded) {
      setDataset({ data: loaded.data, columns: loaded.columns });
      setColumnAliases({});
      setFile(new File([], "Previous Dataset"));
      toast.success("Dataset loaded from history");
    }
  };

  const handleAnalyze = async () => {
    if (!file || !displayDataset) {
      toast.error("Please upload a valid file first");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please describe what visualizations you need");
      return;
    }

    setLoading(true);

    // Store data in sessionStorage for the workspace
    sessionStorage.setItem("analyticsData", JSON.stringify(displayDataset.data));
    sessionStorage.setItem("analyticsColumns", JSON.stringify(displayDataset.columns));
    sessionStorage.setItem("analyticsPrompt", prompt);
    sessionStorage.setItem("analyticsMode", "prompting");

    // Navigate to workspace
    navigate("/workspace");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/AIXDS.png" alt="AI X DS" className="h-8 w-8" />
              <span className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
                StudentAnalytics
              </span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <Link to="/data-upload">Back</Link>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <DatasetHistoryPanel onSelectDataset={handleSelectDataset} currentMode="prompting" />
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Prompting Mode</span>
            </div>
            <h1 className="text-3xl font-bold">Upload & Describe</h1>
            <p className="text-muted-foreground">
              Upload your data file and tell us what visualizations you need
            </p>
          </div>

          <Card className="p-6 shadow-lg border-0">
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="file" className="text-base font-semibold">
                  1. Upload Your Data File
                </Label>
                <div className="mt-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV, XLSX, XLS (max 50MB)
                      </p>
                    </label>
                  </div>
                </div>
                {file && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                        {displayDataset && ` • ${rowCount} rows • ${columns.length} columns`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Column Names (editable) */}
              {dataset?.columns?.length ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <Label className="text-base font-semibold">Column names</Label>
                    <p className="text-xs text-muted-foreground">Edit if headers look incorrect</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dataset.columns.map((col, index) => (
                      <div key={col} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Column {index + 1}</Label>
                        <Input
                          value={columnAliases[col] ?? col}
                          onChange={(e) =>
                            setColumnAliases((prev) => ({
                              ...prev,
                              [col]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Prompt Input */}
              <div>
                <Label htmlFor="prompt" className="text-base font-semibold">
                  2. Describe What You Need
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Show me a bar chart of sales by region, a pie chart of product categories, and a trend line of monthly revenue..."
                  className="mt-3 min-h-[120px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleAnalyze}
                disabled={loading || !file || !displayDataset || !prompt.trim()}
                variant="hero"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Visualizations
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PromptingMode;
