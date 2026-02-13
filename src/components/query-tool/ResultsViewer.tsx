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

interface ResultsViewerProps {
  result: QueryResult;
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

const ResultsViewer = ({ result, config, datasets }: ResultsViewerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("table");

  // Determine best chart type based on data
  const chartConfig = useMemo(() => {
    if (result.data.length === 0) return null;

    const columns = result.columns;
    const numericCols = columns.filter((col) =>
      result.data.some((row) => typeof row[col] === "number")
    );
    const categoryCols = columns.filter((col) =>
      result.data.some((row) => typeof row[col] === "string")
    );

    // For grouped/aggregated data, use bar chart
    if (config.groupBy?.length && numericCols.length > 0) {
      return {
        type: "bar" as const,
        xKey: config.groupBy[0],
        yKeys: numericCols.filter((c) => c !== config.groupBy?.[0]),
      };
    }

    // For time series, use line chart
    if (config.concept === "time_analysis" && numericCols.length > 0) {
      return {
        type: "line" as const,
        xKey: columns[0],
        yKeys: numericCols.slice(0, 3),
      };
    }

    // For category distribution, use pie chart
    if (categoryCols.length === 1 && numericCols.length === 1 && result.data.length <= 10) {
      return {
        type: "pie" as const,
        nameKey: categoryCols[0],
        valueKey: numericCols[0],
      };
    }

    // Default to bar chart
    if (categoryCols.length > 0 && numericCols.length > 0) {
      return {
        type: "bar" as const,
        xKey: categoryCols[0],
        yKeys: numericCols.slice(0, 3),
      };
    }

    return null;
  }, [result, config]);

  const exportToCSV = () => {
    if (result.data.length === 0) return;

    const headers = result.columns.join(",");
    const rows = result.data.map((row) =>
      result.columns.map((col) => {
        const val = row[col];
        if (typeof val === "string" && val.includes(",")) {
          return `"${val}"`;
        }
        return val;
      }).join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Results downloaded as CSV",
    });
  };

  const saveQuery = () => {
    const savedQueries = JSON.parse(sessionStorage.getItem("savedQueries") || "[]");
    const queryName = `Query ${savedQueries.length + 1}`;
    savedQueries.push({
      ...config,
      id: `query_${Date.now()}`,
      name: queryName,
      savedAt: new Date().toISOString(),
    });
    sessionStorage.setItem("savedQueries", JSON.stringify(savedQueries));

    toast({
      title: "Query saved",
      description: `Saved as "${queryName}"`,
    });
  };

  const renderChart = () => {
    if (!chartConfig || result.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <p>No suitable data for visualization</p>
        </div>
      );
    }

    const chartData = result.data.slice(0, 50); // Limit for performance

    switch (chartConfig.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={chartConfig.xKey}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => String(v).slice(0, 15)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {chartConfig.yKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {chartConfig.yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={chartConfig.valueKey}
                nameKey={chartConfig.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      {result.summary && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 font-medium text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Summary Statistics
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Rows</TableCell>
                <TableCell>{result.summary.totalRows.toLocaleString()}</TableCell>
              </TableRow>
              {result.summary.metrics.map((metric, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  <TableCell>{metric.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Insights */}
      {result.summary?.insights && result.summary.insights.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insights</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {result.summary.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Query Results
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveQuery}>
                <Save className="h-4 w-4 mr-1" />
                Save Query
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <Table2 className="h-4 w-4" />
                Table
              </TabsTrigger>
              <TabsTrigger value="chart" className="gap-2" disabled={!chartConfig}>
                <BarChart3 className="h-4 w-4" />
                Chart
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              {result.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No results found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.columns.map((col) => (
                          <TableHead key={col} className="font-semibold">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.slice(0, 100).map((row, i) => (
                        <TableRow key={i}>
                          {result.columns.map((col) => (
                            <TableCell key={col}>
                              {typeof row[col] === "number"
                                ? row[col].toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })
                                : String(row[col] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.data.length > 100 && (
                    <div className="p-4 text-center text-muted-foreground text-sm border-t">
                      Showing first 100 of {result.data.length.toLocaleString()} rows
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="chart" className="mt-4">
              {renderChart()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsViewer;
