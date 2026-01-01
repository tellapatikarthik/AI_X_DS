import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Sparkles, Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PromptingMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        toast.error("File is empty");
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setColumns(headers);
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
          const value = values[index];
          row[header] = isNaN(Number(value)) ? value : Number(value);
        });
        return row;
      });
      
      setParsedData(data);
      toast.success(`File loaded: ${data.length} rows, ${headers.length} columns`);
    } catch (error) {
      toast.error("Failed to parse file");
    }
  };

  const handleAnalyze = async () => {
    if (!file || !parsedData) {
      toast.error("Please upload a file first");
      return;
    }
    
    if (!prompt.trim()) {
      toast.error("Please describe what visualizations you need");
      return;
    }

    setLoading(true);
    
    // Store data in sessionStorage for the workspace
    sessionStorage.setItem('analyticsData', JSON.stringify(parsedData));
    sessionStorage.setItem('analyticsColumns', JSON.stringify(columns));
    sessionStorage.setItem('analyticsPrompt', prompt);
    sessionStorage.setItem('analyticsMode', 'prompting');
    
    // Navigate to workspace
    navigate('/workspace');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
                StudentAnalytics
              </span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
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
                        {parsedData && ` • ${parsedData.length} rows • ${columns.length} columns`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columns Preview */}
              {columns.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Available Columns</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {columns.map((col, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                disabled={loading || !file || !prompt.trim()}
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
