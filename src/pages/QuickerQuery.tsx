import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Search,
  BarChart3,
  X,
  Download,
  LineChart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { parseDatasetFile, type ParsedDataset } from "@/lib/datasetParser";
import { parseNaturalQuery } from "@/lib/queryParser";
import { toast } from "sonner";

interface UploadedDataset {
  id: string;
  name: string;
  data: Record<string, any>[];
  columns: { name: string; type: string }[];
  rowCount: number;
}

interface QueryResultData {
  data: Record<string, any>[];
  columns: string[];
  label: string;
}

const QuickerQuery = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<UploadedDataset[]>([]);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResultData[]>([]);

  // Load datasets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quickerQueryDatasets');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDatasets(parsed);
      setSelectedDatasetIds(parsed.map((d: UploadedDataset) => d.id));
    }
  }, []);

  // Save datasets to localStorage whenever they change
  useEffect(() => {
    if (datasets.length > 0) {
      localStorage.setItem('quickerQueryDatasets', JSON.stringify(datasets));
    }
  }, [datasets]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const parsed: ParsedDataset = await parseDatasetFile(file);
        const ds: UploadedDataset = {
          id: `ds_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          data: parsed.data,
          columns: parsed.columns.map((name) => {
            const sample = parsed.data.slice(0, 20);
            const isNum = sample.some(
              (r) => typeof r[name] === "number" && !isNaN(r[name])
            );
            return { name, type: isNum ? "number" : "string" };
          }),
          rowCount: parsed.data.length,
        };
        setDatasets((prev) => [...prev, ds]);
        setSelectedDatasetIds((prev) => [...prev, ds.id]);
        toast.success(`Loaded ${file.name}: ${parsed.data.length} rows`);
      } catch (err: any) {
        toast.error(`Failed to parse ${file.name}: ${err?.message || "Unknown error"}`);
      }
    }
    e.target.value = "";
  };

  const removeDataset = (id: string) => {
    setDatasets((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem('quickerQueryDatasets');
      }
      return updated;
    });
    setSelectedDatasetIds((prev) => prev.filter((sid) => sid !== id));
  };

  const toggleDataset = (id: string) => {
    setSelectedDatasetIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectedDatasets = useMemo(
    () => datasets.filter((d) => selectedDatasetIds.includes(d.id)),
    [datasets, selectedDatasetIds]
  );

  const executeQuery = async () => {
    if (selectedDatasets.length === 0) {
      toast.error("Please upload and select at least one dataset");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a query prompt");
      return;
    }

    setLoading(true);
    try {
      const targetDs = selectedDatasets[0];
      const allColumns = targetDs.columns.map(c => c.name);
      
      // Parse query locally
      const config = parseNaturalQuery(prompt.trim(), allColumns);
      console.log("Parsed Query Config:", config);
      
      let resultData = [...targetDs.data];

      // Apply conditions
      if (config.conditions?.length > 0) {
        resultData = resultData.filter((row) => {
          const results = config.conditions.map((cond: any) => {
            const val = row[cond.column];
            const cv = cond.value;
            switch (cond.operator) {
              case "equals": return String(val).toLowerCase() === String(cv).toLowerCase();
              case "not_equals": return String(val).toLowerCase() !== String(cv).toLowerCase();
              case "greater_than": return Number(val) > Number(cv);
              case "less_than": return Number(val) < Number(cv);
              case "greater_equal": return Number(val) >= Number(cv);
              case "less_equal": return Number(val) <= Number(cv);
              case "contains": return String(val).toLowerCase().includes(String(cv).toLowerCase());
              case "not_contains": return !String(val).toLowerCase().includes(String(cv).toLowerCase());
              case "starts_with": return String(val).toLowerCase().startsWith(String(cv).toLowerCase());
              case "ends_with": return String(val).toLowerCase().endsWith(String(cv).toLowerCase());
              case "is_empty": return val === null || val === undefined || val === "";
              case "is_not_empty": return val !== null && val !== undefined && val !== "";
              case "between": {
                const [min, max] = String(cv).split(',').map(Number);
                return Number(val) >= min && Number(val) <= max;
              }
              case "in_list": return String(cv).split(",").map((v: string) => v.trim().toLowerCase()).includes(String(val).toLowerCase());
              default: return true;
            }
          });
          return config.conditionLogic === "or" ? results.some((r: boolean) => r) : results.every((r: boolean) => r);
        });
      }

      // Apply sorting
      if (config.sortBy?.length > 0) {
        resultData.sort((a, b) => {
          for (const sort of config.sortBy) {
            const aVal = a[sort.column];
            const bVal = b[sort.column];
            const cmp = typeof aVal === "number" && typeof bVal === "number"
              ? aVal - bVal
              : String(aVal).localeCompare(String(bVal));
            if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
          }
          return 0;
        });
      }

      // Apply aggregations with groupBy
      if (config.aggregations?.length > 0) {
        if (config.groupBy?.length > 0) {
          // Group by columns
          const groups = new Map<string, any[]>();
          resultData.forEach((row) => {
            const key = config.groupBy.map((col: string) => String(row[col] ?? '')).join("|||");
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(row);
          });
          
          resultData = Array.from(groups.entries()).map(([key, rows]) => {
            const grouped: any = {};
            config.groupBy.forEach((col: string, i: number) => {
              grouped[col] = key.split("|||")[i];
            });
            
            config.aggregations.forEach((agg: any) => {
              const label = `${agg.function}_${agg.column}`;
              switch (agg.function) {
                case "sum": {
                  const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                  grouped[label] = vals.reduce((a, b) => a + b, 0);
                  break;
                }
                case "average": {
                  const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                  grouped[label] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  break;
                }
                case "count":
                  grouped[label] = rows.length;
                  break;
                case "count_distinct":
                  grouped[label] = new Set(rows.map((r) => r[agg.column])).size;
                  break;
                case "min": {
                  const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                  grouped[label] = vals.length ? Math.min(...vals) : 0;
                  break;
                }
                case "max": {
                  const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                  grouped[label] = vals.length ? Math.max(...vals) : 0;
                  break;
                }
                default:
                  grouped[label] = 0;
              }
            });
            return grouped;
          });
        } else {
          // No group by - aggregate entire dataset
          const rows = resultData;
          const grouped: any = {};
          
          config.aggregations.forEach((agg: any) => {
            const label = `${agg.function}_${agg.column}`;
            switch (agg.function) {
              case "sum": {
                const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                grouped[label] = vals.reduce((a, b) => a + b, 0);
                break;
              }
              case "average": {
                const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                grouped[label] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                break;
              }
              case "count":
                grouped[label] = rows.length;
                break;
              case "count_distinct":
                grouped[label] = new Set(rows.map((r) => r[agg.column])).size;
                break;
              case "min": {
                const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                grouped[label] = vals.length ? Math.min(...vals) : 0;
                break;
              }
              case "max": {
                const vals = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
                grouped[label] = vals.length ? Math.max(...vals) : 0;
                break;
              }
              default:
                grouped[label] = 0;
            }
          });
          resultData = [grouped];
        }
      }

      // Apply distinct
      if (config.distinct) {
        const seen = new Set<string>();
        resultData = resultData.filter((row) => {
          const k = JSON.stringify(row);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

      // Select columns
      if (config.columns?.length > 0 && !config.aggregations?.length) {
        resultData = resultData.map((row) => {
          const filtered: any = {};
          config.columns.forEach((col: string) => {
            if (row[col] !== undefined) filtered[col] = row[col];
          });
          return Object.keys(filtered).length > 0 ? filtered : row;
        });
      }

      // Apply limit
      if (config.limit) {
        resultData = resultData.slice(0, config.limit);
      }

      const resultColumns = resultData.length > 0 ? Object.keys(resultData[0]) : [];

      setResults((prev) => [
        ...prev,
        { data: resultData, columns: resultColumns, label: prompt.trim() },
      ]);
      toast.success(`Query returned ${resultData.length} rows`);
    } catch (err: any) {
      console.error("Query error:", err);
      toast.error(err?.message || "Failed to execute query");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: Record<string, any>[], columns: string[], filename: string) => {
    const csv = [
      columns.join(','),
      ...data.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully!');
  };

  const visualizeData = (data: Record<string, any>[], columns: string[]) => {
    sessionStorage.setItem('analyticsData', JSON.stringify(data));
    sessionStorage.setItem('analyticsColumns', JSON.stringify(columns));
    sessionStorage.setItem('analyticsMode', 'datatool');
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-md">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quicker Query
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Upload Datasets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="quickUpload"
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
                <label htmlFor="quickUpload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload one or more files (CSV, Excel, JSON)
                  </p>
                </label>
              </div>

              {datasets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Loaded Datasets ({datasets.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {datasets.map((ds) => (
                      <div
                        key={ds.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          selectedDatasetIds.includes(ds.id)
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        }`}
                        onClick={() => toggleDataset(ds.id)}
                      >
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{ds.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ds.rowCount} rows · {ds.columns.length} cols
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDataset(ds.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Section */}
          {datasets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" />
                  Ask Your Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Examples:\n• Show all rows where cost > 100\n• What is the total quantity for each product_id?\n• Find top 10 products by cost\n• Show distinct product IDs sorted by quantity descending`}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={executeQuery}
                  disabled={loading || !prompt.trim() || selectedDatasets.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Run Query
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.map((res, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="text-base">{res.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{res.data.length} rows</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadCSV(res.data, res.columns, res.label)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => visualizeData(res.data, res.columns)}
                    >
                      <LineChart className="h-4 w-4" />
                      Visualize
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setResults((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {res.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data matches your query
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">
                            #
                          </th>
                          {res.columns.map((col) => (
                            <th
                              key={col}
                              className="px-3 py-2 text-left font-medium"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {res.data.map((row, i) => (
                          <tr key={i} className="border-t hover:bg-muted/30">
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {i + 1}
                            </td>
                            {res.columns.map((col) => (
                              <td key={col} className="px-3 py-2">
                                {typeof row[col] === "number"
                                  ? Number(row[col]).toLocaleString(undefined, {
                                      maximumFractionDigits: 2,
                                    })
                                  : String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            Just upload and ask — AI handles the rest
          </p>
        </div>
      </footer>
    </div>
  );
};

export default QuickerQuery;
