import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table2,
  BarChart3,
  Download,
  Save,
  Lightbulb,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { QueryResult, QueryConfig, DatasetInfo } from "@/types/queryTool";
import { useToast } from "@/hooks/use-toast";

export interface NamedResult {
  label: string;
  result: QueryResult;
}

interface ResultsViewerProps {
  result?: QueryResult;
  results?: NamedResult[];
  config: QueryConfig;
  datasets: DatasetInfo[];
}

const CHART_COLORS = [
  "hsl(245, 60%, 55%)",
  "hsl(180, 65%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
  "hsl(260, 65%, 60%)",
  "hsl(200, 70%, 55%)",
  "hsl(320, 70%, 55%)",
];

const SingleResultTable = ({ result, label }: { result: QueryResult; label?: string }) => {
  const [activeTab, setActiveTab] = useState("table");

  const chartConfig = useMemo(() => {
    if (result.data.length === 0) return null;
    const columns = result.columns;
    const numericCols = columns.filter((col) =>
      result.data.some((row) => typeof row[col] === "number")
    );
    const categoryCols = columns.filter((col) =>
      result.data.some((row) => typeof row[col] === "string")
    );
    if (categoryCols.length === 1 && numericCols.length === 1 && result.data.length <= 10) {
      return { type: "pie" as const, nameKey: categoryCols[0], valueKey: numericCols[0] };
    }
    if (categoryCols.length > 0 && numericCols.length > 0) {
      return { type: "bar" as const, xKey: categoryCols[0], yKeys: numericCols.slice(0, 3) };
    }
    if (numericCols.length > 0) {
      return { type: "bar" as const, xKey: columns[0], yKeys: numericCols.slice(0, 3) };
    }
    return null;
  }, [result]);

  const renderChart = () => {
    if (!chartConfig || result.data.length === 0) {
      return <div className="flex items-center justify-center h-[200px] text-muted-foreground"><p>No chart data</p></div>;
    }
    const chartData = result.data.slice(0, 50);
    if (chartConfig.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(0, 15)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Legend />
            {chartConfig.yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chartConfig.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey={chartConfig.valueKey} nameKey={chartConfig.nameKey} cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {label && (
        <div className="bg-primary/5 px-4 py-2 border-b flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{label}</Badge>
          <span className="text-sm text-muted-foreground">{result.rowCount} row{result.rowCount !== 1 ? "s" : ""}</span>
        </div>
      )}
      {/* Summary row */}
      {result.summary && result.summary.metrics.length > 0 && (
        <div className="border-b">
          <div className="bg-muted px-4 py-1.5 font-medium text-xs flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-primary" />
            Summary
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Metric</TableHead>
                <TableHead className="text-xs">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-xs">Total Rows</TableCell>
                <TableCell className="text-xs">{result.summary.totalRows.toLocaleString()}</TableCell>
              </TableRow>
              {result.summary.metrics.map((metric, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-xs">{metric.label}</TableCell>
                  <TableCell className="text-xs">{metric.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-2">
        <TabsList className="h-8">
          <TabsTrigger value="table" className="gap-1 text-xs h-7"><Table2 className="h-3 w-3" />Table</TabsTrigger>
          <TabsTrigger value="chart" className="gap-1 text-xs h-7" disabled={!chartConfig}><BarChart3 className="h-3 w-3" />Chart</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-2">
          {result.data.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No results</div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columns.map((col) => (
                      <TableHead key={col} className="font-semibold text-xs">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      {result.columns.map((col) => (
                        <TableCell key={col} className="text-xs">
                          {typeof row[col] === "number"
                            ? row[col].toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : String(row[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.data.length > 100 && (
                <div className="p-2 text-center text-muted-foreground text-xs border-t">
                  Showing first 100 of {result.data.length.toLocaleString()} rows
                </div>
              )}
            </ScrollArea>
          )}
        </TabsContent>
        <TabsContent value="chart" className="mt-2">{renderChart()}</TabsContent>
      </Tabs>
    </div>
  );
};

const ResultsViewer = ({ result, results, config, datasets }: ResultsViewerProps) => {
  const { toast } = useToast();

  // Normalize to array of named results
  const allResults: NamedResult[] = useMemo(() => {
    if (results && results.length > 0) return results;
    if (result) return [{ label: "Query Results", result }];
    return [];
  }, [result, results]);

  const exportToCSV = (res: QueryResult, name: string) => {
    if (res.data.length === 0) return;
    const headers = res.columns.join(",");
    const rows = res.data.map((row) =>
      res.columns.map((col) => {
        const val = row[col];
        if (typeof val === "string" && val.includes(",")) return `"${val}"`;
        return val;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${name} downloaded as CSV` });
  };

  const saveQuery = () => {
    const savedQueries = JSON.parse(sessionStorage.getItem("savedQueries") || "[]");
    const queryName = `Query ${savedQueries.length + 1}`;
    savedQueries.push({ ...config, id: `query_${Date.now()}`, name: queryName, savedAt: new Date().toISOString() });
    sessionStorage.setItem("savedQueries", JSON.stringify(savedQueries));
    toast({ title: "Query saved", description: `Saved as "${queryName}"` });
  };

  return (
    <div className="space-y-6">
      {/* Insights */}
      {allResults.some((r) => r.result.summary?.insights?.length) && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insights</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {allResults.flatMap((r) => r.result.summary?.insights || []).map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Results ({allResults.length} table{allResults.length !== 1 ? "s" : ""})
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={saveQuery}>
            <Save className="h-4 w-4 mr-1" /> Save Query
          </Button>
          {allResults.length === 1 && (
            <Button variant="outline" size="sm" onClick={() => exportToCSV(allResults[0].result, allResults[0].label)}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Result Tables */}
      {allResults.map((nr, i) => (
        <div key={i} className="space-y-2">
          {allResults.length > 1 && (
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{nr.label}</h4>
              <Button variant="ghost" size="sm" onClick={() => exportToCSV(nr.result, nr.label)}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          )}
          <SingleResultTable result={nr.result} label={allResults.length > 1 ? undefined : undefined} />
        </div>
      ))}
    </div>
  );
};

export default ResultsViewer;
