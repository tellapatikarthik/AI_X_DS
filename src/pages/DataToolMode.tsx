import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Wrench, Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { applyColumnAliases, parseDatasetFile, type ParsedDataset } from "@/lib/datasetParser";

const DataToolMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});

  const displayDataset = useMemo(
    () => (dataset ? applyColumnAliases(dataset, columnAliases) : null),
    [dataset, columnAliases]
  );

  const columns = displayDataset?.columns ?? [];
  const parsedData = displayDataset?.data ?? null;
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
      toast.success(`File loaded: ${parsed.data.length} rows, ${parsed.columns.length} columns`);
    } catch (error: any) {
      console.error("File parse error:", error);
      setDataset(null);
      setColumnAliases({});
      toast.error(error?.message || "Failed to parse file");
    }
  };

  const handleContinue = () => {
    if (!file || !displayDataset) {
      toast.error("Please upload a valid file first");
      return;
    }

    setLoading(true);

    // Store data in sessionStorage for the workspace
    sessionStorage.setItem("analyticsData", JSON.stringify(displayDataset.data));
    sessionStorage.setItem("analyticsColumns", JSON.stringify(displayDataset.columns));
    sessionStorage.setItem("analyticsMode", "datatool");
    sessionStorage.removeItem("analyticsPrompt");

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent">
              <Wrench className="h-4 w-4" />
              <span className="text-sm font-semibold">DataTool Mode</span>
            </div>
            <h1 className="text-3xl font-bold">Upload Your Data</h1>
            <p className="text-muted-foreground">
              Upload your file and start building visualizations manually
            </p>
          </div>

          <Card className="p-6 shadow-lg border-0">
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="file" className="text-base font-semibold">
                  Upload Your Data File
                </Label>
                <div className="mt-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
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
                    <FileSpreadsheet className="h-5 w-5 text-accent" />
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

              {/* Data Preview */}
              {parsedData && parsedData.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Data Preview (First 5 rows)</Label>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {columns.map((col, index) => (
                            <th key={index} className="px-3 py-2 text-left font-medium text-muted-foreground">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-muted/50">
                            {columns.map((col, colIndex) => (
                              <td key={colIndex} className="px-3 py-2">
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleContinue}
                disabled={loading || !file || !displayDataset}
                variant="hero"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Wrench className="h-5 w-5 mr-2" />
                    Open DataTool Workspace
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

export default DataToolMode;
