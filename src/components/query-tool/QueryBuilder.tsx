import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Plus,
  Trash2,
  Info,
  Eye,
  Save,
  ArrowUp,
  ArrowDown,
  Wand2,
} from "lucide-react";
import {
  DatasetInfo,
  ColumnInfo,
  QueryConfig,
  QueryCondition,
  QueryResult,
  ConditionOperator,
  AggregationFunction,
} from "@/types/queryTool";
import { useToast } from "@/hooks/use-toast";

interface QueryBuilderProps {
  datasets: DatasetInfo[];
  concept: string;
  subConcepts: string[];
  initialConfig: QueryConfig | null;
  onExecute: (result: QueryResult) => void;
  onConfigChange: (config: QueryConfig) => void;
  onDatasetUpdate?: (datasetId: string, newData: Record<string, any>[], newColumns?: ColumnInfo[]) => void;
  onDatasetCreate?: (dataset: DatasetInfo) => void;
  onDatasetDelete?: (datasetId: string) => void;
  isActive: boolean;
}

const OPERATORS: { value: ConditionOperator; label: string; types: string[] }[] = [
  { value: "equals", label: "= Equals", types: ["string", "number", "date", "boolean"] },
  { value: "not_equals", label: "≠ Not Equals", types: ["string", "number", "date", "boolean"] },
  { value: "greater_than", label: "> Greater Than", types: ["number", "date"] },
  { value: "less_than", label: "< Less Than", types: ["number", "date"] },
  { value: "greater_equal", label: "≥ Greater or Equal", types: ["number", "date"] },
  { value: "less_equal", label: "≤ Less or Equal", types: ["number", "date"] },
  { value: "contains", label: "Contains (LIKE)", types: ["string"] },
  { value: "not_contains", label: "Not Contains", types: ["string"] },
  { value: "starts_with", label: "Starts With", types: ["string"] },
  { value: "ends_with", label: "Ends With", types: ["string"] },
  { value: "is_empty", label: "Is NULL/Empty", types: ["string", "number", "date"] },
  { value: "is_not_empty", label: "Is NOT NULL", types: ["string", "number", "date"] },
  { value: "between", label: "BETWEEN", types: ["number", "date"] },
  { value: "in_list", label: "IN (list)", types: ["string", "number"] },
];

const AGGREGATIONS: { value: AggregationFunction; label: string }[] = [
  { value: "sum", label: "SUM" },
  { value: "average", label: "AVG" },
  { value: "count", label: "COUNT" },
  { value: "count_distinct", label: "COUNT DISTINCT" },
  { value: "min", label: "MIN" },
  { value: "max", label: "MAX" },
  { value: "median", label: "MEDIAN" },
  { value: "stddev", label: "STD DEV" },
  { value: "variance", label: "VARIANCE" },
];

const QueryBuilder = ({
  datasets,
  concept,
  subConcepts,
  initialConfig,
  onExecute,
  onConfigChange,
  onDatasetUpdate,
  onDatasetCreate,
  onDatasetDelete,
  isActive,
}: QueryBuilderProps) => {
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [conditions, setConditions] = useState<QueryCondition[]>([]);
  const [conditionLogic, setConditionLogic] = useState<"and" | "or">("and");
  const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: "asc" | "desc" }[]>([]);
  const [aggregations, setAggregations] = useState<{ column: string; function: AggregationFunction }[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [limitRows, setLimitRows] = useState<number | null>(null);
  const [distinctOnly, setDistinctOnly] = useState(false);

  // Modify state
  const [modifyTargetDataset, setModifyTargetDataset] = useState<string>(datasets[0]?.id || "");
  const [modifyRowValues, setModifyRowValues] = useState<Record<string, string>>({});
  const [modifyUpdateColumn, setModifyUpdateColumn] = useState<string>("");
  const [modifyUpdateValue, setModifyUpdateValue] = useState<string>("");
  const [modifyDeleteColumn, setModifyDeleteColumn] = useState<string>("");
  const [modifyDeleteValue, setModifyDeleteValue] = useState<string>("");
  const [modifyNewColName, setModifyNewColName] = useState<string>("");
  const [modifyNewColDefault, setModifyNewColDefault] = useState<string>("");
  const [modifyDropColName, setModifyDropColName] = useState<string>("");
  const [modifyNewTableName, setModifyNewTableName] = useState<string>("");
  const [modifyNewTableCols, setModifyNewTableCols] = useState<string>("");

  // Combine all columns from selected datasets
  const allColumns = useMemo(() => {
    const cols: { name: string; type: string; datasetName: string }[] = [];
    datasets.forEach((d) => {
      d.columns.forEach((col) => {
        cols.push({
          name: col.name,
          type: col.type,
          datasetName: d.name,
        });
      });
    });
    return cols;
  }, [datasets]);

  const numericColumns = allColumns.filter((c) => c.type === "number");
  const dateColumns = allColumns.filter((c) => c.type === "date");

  // Get all data combined
  const allData = useMemo(() => {
    if (datasets.length === 1) {
      return datasets[0].data;
    }
    // For multiple datasets, just use the first one for now
    // Combine logic would go in the execute function
    return datasets[0]?.data || [];
  }, [datasets]);

  // Initialize based on concept/subConcepts
  useEffect(() => {
    if (initialConfig) {
      setSelectedColumns(initialConfig.columns || []);
      setConditions(initialConfig.conditions || []);
      setConditionLogic(initialConfig.conditionLogic || "and");
      setGroupByColumns(initialConfig.groupBy || []);
      setSortConfig(initialConfig.sortBy || []);
      setAggregations(initialConfig.aggregations || []);
      setLimitRows(initialConfig.limit || null);
      setDistinctOnly(initialConfig.distinct || false);
      return;
    }

    // Auto-select based on all selected sub-concepts
    if (concept === "aggregate" && numericColumns.length > 0) {
      const aggs = subConcepts
        .filter((sc) => ["sum", "average", "count", "count_distinct", "min", "max", "median", "mode", "variance", "stddev"].includes(sc))
        .map((sc) => ({
          column: numericColumns[0].name,
          function: sc as AggregationFunction,
        }));
      if (aggs.length > 0) setAggregations(aggs);
    }
    if (concept === "sort") {
      const configs = subConcepts.map((sc) => ({
        column: allColumns[0]?.name || "",
        direction: (sc === "ascending" ? "asc" : "desc") as "asc" | "desc",
      }));
      if (configs.length > 0) setSortConfig(configs);
    }
  }, [concept, subConcepts, initialConfig]);

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: `cond_${Date.now()}`,
      column: allColumns[0]?.name || "",
      operator: "equals",
      value: "",
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const getOperatorsForColumn = (columnName: string) => {
    const column = allColumns.find((c) => c.name === columnName);
    if (!column) return OPERATORS;
    return OPERATORS.filter((op) => op.types.includes(column.type));
  };

  // Helper to compute aggregation values
  const computeAggregation = (
    fn: AggregationFunction,
    values: number[],
    rows: Record<string, any>[],
    column: string
  ): number => {
    if (values.length === 0) return 0;
    switch (fn) {
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "average":
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "count":
        return rows.length;
      case "count_distinct":
        return new Set(rows.map((r) => r[column])).size;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      case "median": {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      case "mode": {
        const freq = new Map<number, number>();
        values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
        let maxFreq = 0, modeVal = values[0];
        freq.forEach((count, val) => { if (count > maxFreq) { maxFreq = count; modeVal = val; } });
        return modeVal;
      }
      case "variance": {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
      }
      case "stddev": {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
      }
      default:
        return 0;
    }
  };

  // Execute query
  const executeQuery = () => {
    setIsExecuting(true);

    try {
      let result = [...allData];

      // Apply filters with AND/OR logic
      if (conditions.length > 0) {
        result = result.filter((row) => {
          const conditionResults = conditions.map((cond) => {
            const value = row[cond.column];
            const condValue = cond.value;

            switch (cond.operator) {
              case "equals":
                return String(value).toLowerCase() === String(condValue).toLowerCase();
              case "not_equals":
                return String(value).toLowerCase() !== String(condValue).toLowerCase();
              case "greater_than":
                return Number(value) > Number(condValue);
              case "less_than":
                return Number(value) < Number(condValue);
              case "greater_equal":
                return Number(value) >= Number(condValue);
              case "less_equal":
                return Number(value) <= Number(condValue);
              case "contains":
                return String(value).toLowerCase().includes(String(condValue).toLowerCase());
              case "not_contains":
                return !String(value).toLowerCase().includes(String(condValue).toLowerCase());
              case "starts_with":
                return String(value).toLowerCase().startsWith(String(condValue).toLowerCase());
              case "ends_with":
                return String(value).toLowerCase().endsWith(String(condValue).toLowerCase());
              case "is_empty":
                return value === null || value === undefined || value === "";
              case "is_not_empty":
                return value !== null && value !== undefined && value !== "";
              case "between":
                return Number(value) >= Number(condValue) && Number(value) <= Number(cond.value2);
              case "in_list":
                const listValues = String(condValue).split(",").map(v => v.trim().toLowerCase());
                return listValues.includes(String(value).toLowerCase());
              default:
                return true;
            }
          });

          // Apply AND or OR logic
          if (conditionLogic === "and") {
            return conditionResults.every(r => r);
          } else {
            return conditionResults.some(r => r);
          }
        });
      }

      // Apply sorting
      if (sortConfig.length > 0) {
        result.sort((a, b) => {
          for (const sort of sortConfig) {
            const aVal = a[sort.column];
            const bVal = b[sort.column];
            const comparison = typeof aVal === "number" && typeof bVal === "number"
              ? aVal - bVal
              : String(aVal).localeCompare(String(bVal));
            if (comparison !== 0) {
              return sort.direction === "asc" ? comparison : -comparison;
            }
          }
          return 0;
        });
      }

      // Apply grouping and aggregations
      if (aggregations.length > 0) {
        if (groupByColumns.length > 0) {
          const groups = new Map<string, Record<string, any>[]>();
          
          result.forEach((row) => {
            const key = groupByColumns.map((col) => row[col]).join("|||");
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(row);
          });

          result = Array.from(groups.entries()).map(([key, rows]) => {
            const grouped: Record<string, any> = {};
            
            groupByColumns.forEach((col, i) => {
              grouped[col] = key.split("|||")[i];
            });

            aggregations.forEach((agg) => {
              const values = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
              grouped[`${agg.function}_${agg.column}`] = computeAggregation(agg.function, values, rows, agg.column);
            });

            return grouped;
          });
        } else {
          // No groupBy — treat entire dataset as one group
          const rows = result;
          const grouped: Record<string, any> = {};

          aggregations.forEach((agg) => {
            const values = rows.map((r) => Number(r[agg.column])).filter((n) => !isNaN(n));
            grouped[`${agg.function}_${agg.column}`] = computeAggregation(agg.function, values, rows, agg.column);
          });

          result = [grouped];
        }
      }

      // Apply distinct if selected
      if (distinctOnly) {
        const seen = new Set<string>();
        result = result.filter((row) => {
          const key = JSON.stringify(row);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      // Select only chosen columns if specified
      if (selectedColumns.length > 0 && groupByColumns.length === 0) {
        result = result.map((row) => {
          const filtered: Record<string, any> = {};
          selectedColumns.forEach((col) => {
            filtered[col] = row[col];
          });
          return filtered;
        });
      }

      // Apply limit
      if (limitRows && limitRows > 0) {
        result = result.slice(0, limitRows);
      }

      // Generate summary
      const summary = {
        totalRows: result.length,
        metrics: [] as any[],
        insights: [] as string[],
      };

      // Add metrics for numeric columns
      const resultCols = result.length > 0 ? Object.keys(result[0]) : [];
      resultCols.forEach((col) => {
        const values = result.map((r) => Number(r[col])).filter((n) => !isNaN(n));
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          summary.metrics.push({
            label: `Sum of ${col}`,
            value: sum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            type: "sum",
          });
          summary.metrics.push({
            label: `Avg of ${col}`,
            value: (sum / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            type: "average",
          });
        }
      });

      // Add insights
      if (result.length === 0) {
        summary.insights.push("No data matches your criteria. Try adjusting your filters.");
      } else if (result.length < allData.length) {
        summary.insights.push(
          `Filtered from ${allData.length.toLocaleString()} to ${result.length.toLocaleString()} rows (${((result.length / allData.length) * 100).toFixed(1)}% of data)`
        );
      }

      const queryResult: QueryResult = {
        data: result,
        columns: result.length > 0 ? Object.keys(result[0]) : [],
        rowCount: result.length,
        summary,
        executedAt: new Date().toISOString(),
      };

      // Save config
      const config: QueryConfig = {
        datasetIds: datasets.map((d) => d.id),
        concept,
        subConcept: subConcepts[0] || "",
        subConcepts,
        columns: selectedColumns,
        conditions,
        conditionLogic,
        groupBy: groupByColumns,
        sortBy: sortConfig,
        aggregations,
        limit: limitRows || undefined,
        distinct: distinctOnly,
      };
      onConfigChange(config);
      onExecute(queryResult);

      toast({
        title: "Query executed",
        description: `Found ${result.length.toLocaleString()} results`,
      });
    } catch (error) {
      console.error("Query error:", error);
      toast({
        variant: "destructive",
        title: "Query failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Preview data
  const showPreview = () => {
    const preview = allData.slice(0, 5);
    setPreviewData(preview);
  };

  // Render UI based on concept
  const renderConceptUI = () => {
    switch (concept) {
      case "filter":
      case "logical":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Label>Filter Conditions</Label>
                {conditions.length > 1 && (
                  <div className="flex items-center gap-1 border rounded-lg p-0.5">
                    <Button
                      variant={conditionLogic === "and" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setConditionLogic("and")}
                    >
                      AND
                    </Button>
                    <Button
                      variant={conditionLogic === "or" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setConditionLogic("or")}
                    >
                      OR
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={addCondition} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </div>
            
            {conditions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click "Add Condition" to start filtering your data
              </p>
            )}

            {conditions.map((cond, index) => (
              <div key={cond.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg flex-wrap">
                {index > 0 && (
                  <Badge variant={conditionLogic === "or" ? "default" : "secondary"} className="mr-2">
                    {conditionLogic.toUpperCase()}
                  </Badge>
                )}
                <Select
                  value={cond.column}
                  onValueChange={(v) => updateCondition(cond.id, { column: v })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {allColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={cond.operator}
                  onValueChange={(v) => updateCondition(cond.id, { operator: v as ConditionOperator })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorsForColumn(cond.column).map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!["is_empty", "is_not_empty"].includes(cond.operator) && (
                  <Input
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    placeholder="Value"
                    className="w-[150px]"
                  />
                )}

                {cond.operator === "between" && (
                  <>
                    <span className="text-muted-foreground">and</span>
                    <Input
                      value={cond.value2 || ""}
                      onChange={(e) => updateCondition(cond.id, { value2: e.target.value })}
                      placeholder="Value 2"
                      className="w-[150px]"
                    />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(cond.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case "sort":
        return (
          <div className="space-y-4">
            <Label>Sort Configuration</Label>
            {sortConfig.map((sort, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={sort.column}
                  onValueChange={(v) => {
                    const updated = [...sortConfig];
                    updated[index] = { ...sort, column: v };
                    setSortConfig(updated);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {allColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={sort.direction === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updated = [...sortConfig];
                    updated[index] = { ...sort, direction: "asc" };
                    setSortConfig(updated);
                  }}
                  className="gap-1"
                >
                  <ArrowUp className="h-4 w-4" />
                  Ascending
                </Button>

                <Button
                  variant={sort.direction === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updated = [...sortConfig];
                    updated[index] = { ...sort, direction: "desc" };
                    setSortConfig(updated);
                  }}
                  className="gap-1"
                >
                  <ArrowDown className="h-4 w-4" />
                  Descending
                </Button>
              </div>
            ))}
          </div>
        );

      case "aggregate":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group By (Optional)</Label>
              <Select
                value={groupByColumns[0] || "__none__"}
                onValueChange={(v) => setGroupByColumns(v === "__none__" ? [] : [v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No grouping</SelectItem>
                  {allColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aggregations ({aggregations.length} selected)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAggregations([...aggregations, {
                      column: numericColumns[0]?.name || allColumns[0]?.name || "",
                      function: "sum" as AggregationFunction,
                    }]);
                  }}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Aggregation
                </Button>
              </div>
              {aggregations.map((agg, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Select
                    value={agg.function}
                    onValueChange={(v) => {
                      const updated = [...aggregations];
                      updated[index] = { ...agg, function: v as AggregationFunction };
                      setAggregations(updated);
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGGREGATIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground text-sm">of</span>

                  <Select
                    value={agg.column}
                    onValueChange={(v) => {
                      const updated = [...aggregations];
                      updated[index] = { ...agg, column: v };
                      setAggregations(updated);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {(agg.function === "count" || agg.function === "count_distinct"
                        ? allColumns
                        : numericColumns.length > 0 ? numericColumns : allColumns
                      ).map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAggregations(aggregations.filter((_, i) => i !== index))}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={aggregations.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "group":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group By Column</Label>
              <Select
                value={groupByColumns[0] || ""}
                onValueChange={(v) => setGroupByColumns([v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column to group by" />
                </SelectTrigger>
                <SelectContent>
                  {allColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Calculate (Optional)</Label>
              <div className="flex gap-2 flex-wrap">
                {AGGREGATIONS.slice(0, 4).map((agg) => (
                  <Button
                    key={agg.value}
                    variant={aggregations.some((a) => a.function === agg.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (aggregations.some((a) => a.function === agg.value)) {
                        setAggregations(aggregations.filter((a) => a.function !== agg.value));
                      } else {
                        setAggregations([...aggregations, {
                          column: numericColumns[0]?.name || allColumns[0]?.name || "",
                          function: agg.value,
                        }]);
                      }
                    }}
                  >
                    {agg.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case "summary":
      case "compare":
      case "time_analysis":
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-center text-muted-foreground">
              Click "Run Query" to generate a summary of your data
            </p>
          </div>
        );

      case "select":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="distinct"
                  checked={distinctOnly}
                  onChange={(e) => setDistinctOnly(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="distinct">DISTINCT (remove duplicates)</Label>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Columns (* = all)</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColumns(allColumns.map(c => c.name))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColumns([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {allColumns.map((col) => (
                  <Button
                    key={col.name}
                    variant={selectedColumns.includes(col.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedColumns(
                        selectedColumns.includes(col.name)
                          ? selectedColumns.filter((c) => c !== col.name)
                          : [...selectedColumns, col.name]
                      );
                    }}
                  >
                    {col.name}
                    <Badge variant="outline" className="ml-1 text-xs">{col.type}</Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case "limit":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limit Rows (TOP N)</Label>
                <Input
                  type="number"
                  value={limitRows || ""}
                  onChange={(e) => setLimitRows(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 10, 100, 1000"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Quick Options</Label>
                <div className="flex gap-2 flex-wrap">
                  {[10, 50, 100, 500, 1000].map((n) => (
                    <Button
                      key={n}
                      variant={limitRows === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLimitRows(n)}
                    >
                      Top {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "join":
      case "set_operations":
      case "subquery":
        return (
          <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
            <p className="text-center text-muted-foreground">
              <span className="block text-lg font-medium mb-1">{concept.toUpperCase()}</span>
              This advanced feature requires multiple datasets. 
              Upload additional datasets to enable this functionality.
            </p>
          </div>
        );

      case "string_functions":
      case "date_functions":
      case "numeric_functions":
      case "conditional":
      case "window":
      case "type_conversion":
      case "null_handling":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm">
                <strong>{concept.replace("_", " ").toUpperCase()}</strong> operations are applied during query execution. 
                Select the columns you want to transform below.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Select Columns</Label>
              <div className="flex flex-wrap gap-2">
                {allColumns.map((col) => (
                  <Button
                    key={col.name}
                    variant={selectedColumns.includes(col.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedColumns(
                        selectedColumns.includes(col.name)
                          ? selectedColumns.filter((c) => c !== col.name)
                          : [...selectedColumns, col.name]
                      );
                    }}
                  >
                    {col.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case "modify":
        const targetDs = datasets.find(d => d.id === modifyTargetDataset) || datasets[0];
        const targetCols = targetDs?.columns || [];
        return (
          <div className="space-y-6">
            {datasets.length > 1 && (
              <div className="space-y-2">
                <Label>Target Dataset</Label>
                <Select value={modifyTargetDataset || datasets[0]?.id} onValueChange={setModifyTargetDataset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* INSERT ROW */}
            {subConcepts.includes("insert") && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-base font-semibold">INSERT — Add New Row</Label>
                <div className="grid grid-cols-2 gap-2">
                  {targetCols.map(col => (
                    <div key={col.name} className="space-y-1">
                      <Label className="text-xs">{col.name} ({col.type})</Label>
                      <Input
                        placeholder={`Enter ${col.name}`}
                        value={modifyRowValues[col.name] || ""}
                        onChange={e => setModifyRowValues(prev => ({ ...prev, [col.name]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={() => {
                  if (!targetDs || !onDatasetUpdate) return;
                  const newRow: Record<string, any> = {};
                  targetCols.forEach(col => {
                    const val = modifyRowValues[col.name] || "";
                    newRow[col.name] = col.type === "number" ? (val ? Number(val) : 0) : val;
                  });
                  onDatasetUpdate(targetDs.id, [...targetDs.data, newRow]);
                  setModifyRowValues({});
                  toast({ title: "Row inserted", description: "New row added to dataset" });
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Insert Row
                </Button>
              </div>
            )}

            {/* UPDATE ROWS */}
            {subConcepts.includes("update") && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-base font-semibold">UPDATE — Modify Rows</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Column to update</Label>
                    <Select value={modifyUpdateColumn} onValueChange={setModifyUpdateColumn}>
                      <SelectTrigger><SelectValue placeholder="Column" /></SelectTrigger>
                      <SelectContent>
                        {targetCols.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">New value</Label>
                    <Input value={modifyUpdateValue} onChange={e => setModifyUpdateValue(e.target.value)} placeholder="New value" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Where (filter column = value)</Label>
                    <div className="flex gap-1">
                      {conditions.length === 0 && (
                        <Button variant="outline" size="sm" onClick={addCondition}>Add filter</Button>
                      )}
                    </div>
                  </div>
                </div>
                {conditions.length > 0 && (
                  <div className="space-y-2 bg-muted/30 p-2 rounded">
                    {conditions.map(cond => (
                      <div key={cond.id} className="flex gap-2 items-center flex-wrap">
                        <Select value={cond.column} onValueChange={v => updateCondition(cond.id, { column: v })}>
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{targetCols.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className="text-xs">=</span>
                        <Input value={cond.value} onChange={e => updateCondition(cond.id, { value: e.target.value })} className="w-[140px]" placeholder="Value" />
                        <Button variant="ghost" size="icon" onClick={() => removeCondition(cond.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" onClick={() => {
                  if (!targetDs || !onDatasetUpdate || !modifyUpdateColumn) return;
                  const updated = targetDs.data.map(row => {
                    const match = conditions.length === 0 || conditions.every(c => String(row[c.column]) === String(c.value));
                    if (match) {
                      const col = targetCols.find(c => c.name === modifyUpdateColumn);
                      return { ...row, [modifyUpdateColumn]: col?.type === "number" ? Number(modifyUpdateValue) : modifyUpdateValue };
                    }
                    return row;
                  });
                  onDatasetUpdate(targetDs.id, updated);
                  toast({ title: "Rows updated", description: `Updated column "${modifyUpdateColumn}"` });
                }}>
                  Apply Update
                </Button>
              </div>
            )}

            {/* DELETE ROWS */}
            {subConcepts.includes("delete") && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-base font-semibold">DELETE — Remove Rows</Label>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Where column</Label>
                    <Select value={modifyDeleteColumn} onValueChange={setModifyDeleteColumn}>
                      <SelectTrigger><SelectValue placeholder="Column" /></SelectTrigger>
                      <SelectContent>
                        {targetCols.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Equals value</Label>
                    <Input value={modifyDeleteValue} onChange={e => setModifyDeleteValue(e.target.value)} placeholder="Value to match" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (!targetDs || !onDatasetUpdate || !modifyDeleteColumn) return;
                    const filtered = targetDs.data.filter(row => String(row[modifyDeleteColumn]) !== String(modifyDeleteValue));
                    onDatasetUpdate(targetDs.id, filtered);
                    toast({ title: "Rows deleted", description: `Removed rows where ${modifyDeleteColumn} = ${modifyDeleteValue}` });
                  }}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Matching Rows
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (!targetDs || !onDatasetUpdate) return;
                    onDatasetUpdate(targetDs.id, []);
                    toast({ title: "All rows deleted (TRUNCATE)", description: "Dataset emptied" });
                  }}>
                    Truncate All
                  </Button>
                </div>
              </div>
            )}

            {/* TRUNCATE */}
            {subConcepts.includes("truncate") && !subConcepts.includes("delete") && (
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-base font-semibold">TRUNCATE — Remove All Rows</Label>
                <Button size="sm" variant="destructive" onClick={() => {
                  if (!targetDs || !onDatasetUpdate) return;
                  onDatasetUpdate(targetDs.id, []);
                  toast({ title: "Truncated", description: "All rows removed" });
                }}>
                  <Trash2 className="h-4 w-4 mr-1" /> Truncate Dataset
                </Button>
              </div>
            )}

            {/* ADD/DROP COLUMN */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">ALTER — Add/Drop Columns</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Add Column</Label>
                  <Input value={modifyNewColName} onChange={e => setModifyNewColName(e.target.value)} placeholder="New column name" />
                  <Input value={modifyNewColDefault} onChange={e => setModifyNewColDefault(e.target.value)} placeholder="Default value (optional)" />
                  <Button size="sm" onClick={() => {
                    if (!targetDs || !onDatasetUpdate || !modifyNewColName.trim()) return;
                    const newData = targetDs.data.map(row => ({ ...row, [modifyNewColName]: modifyNewColDefault || "" }));
                    const newCols: ColumnInfo[] = [...targetDs.columns, { name: modifyNewColName, type: "string", sampleValues: [modifyNewColDefault], uniqueCount: 1, nullCount: 0 }];
                    onDatasetUpdate(targetDs.id, newData, newCols);
                    setModifyNewColName("");
                    setModifyNewColDefault("");
                    toast({ title: "Column added", description: `Added "${modifyNewColName}"` });
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Column
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Drop Column</Label>
                  <Select value={modifyDropColName} onValueChange={setModifyDropColName}>
                    <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent>
                      {targetCols.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (!targetDs || !onDatasetUpdate || !modifyDropColName) return;
                    const newData = targetDs.data.map(row => {
                      const { [modifyDropColName]: _, ...rest } = row;
                      return rest;
                    });
                    const newCols = targetDs.columns.filter(c => c.name !== modifyDropColName);
                    onDatasetUpdate(targetDs.id, newData, newCols);
                    setModifyDropColName("");
                    toast({ title: "Column dropped", description: `Removed "${modifyDropColName}"` });
                  }}>
                    <Trash2 className="h-4 w-4 mr-1" /> Drop Column
                  </Button>
                </div>
              </div>
            </div>

            {/* CREATE TABLE */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">CREATE TABLE — New Dataset</Label>
              <div className="space-y-2">
                <Input value={modifyNewTableName} onChange={e => setModifyNewTableName(e.target.value)} placeholder="Table name" />
                <Input value={modifyNewTableCols} onChange={e => setModifyNewTableCols(e.target.value)} placeholder="Columns (comma-separated, e.g.: id, name, age)" />
                <Button size="sm" onClick={() => {
                  if (!onDatasetCreate || !modifyNewTableName.trim() || !modifyNewTableCols.trim()) return;
                  const colNames = modifyNewTableCols.split(",").map(c => c.trim()).filter(Boolean);
                  const newDs: DatasetInfo = {
                    id: `ds_${Date.now()}`,
                    name: modifyNewTableName,
                    data: [],
                    columns: colNames.map(name => ({ name, type: "string" as const, sampleValues: [], uniqueCount: 0, nullCount: 0 })),
                    rowCount: 0,
                    uploadedAt: new Date().toISOString(),
                  };
                  onDatasetCreate(newDs);
                  setModifyNewTableName("");
                  setModifyNewTableCols("");
                  toast({ title: "Table created", description: `Created "${newDs.name}" with ${colNames.length} columns` });
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Create Table
                </Button>
              </div>
            </div>

            {/* DROP TABLE */}
            <div className="space-y-3 p-4 border rounded-lg border-destructive/30">
              <Label className="text-base font-semibold text-destructive">DROP TABLE — Delete Dataset</Label>
              <Button size="sm" variant="destructive" onClick={() => {
                if (!targetDs || !onDatasetDelete) return;
                onDatasetDelete(targetDs.id);
                toast({ title: "Table dropped", description: `Deleted "${targetDs.name}"` });
              }}>
                <Trash2 className="h-4 w-4 mr-1" /> Drop "{targetDs?.name}"
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Columns to Include</Label>
              <div className="flex flex-wrap gap-2">
                {allColumns.map((col) => (
                  <Button
                    key={col.name}
                    variant={selectedColumns.includes(col.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedColumns(
                        selectedColumns.includes(col.name)
                          ? selectedColumns.filter((c) => c !== col.name)
                          : [...selectedColumns, col.name]
                      );
                    }}
                  >
                    {col.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={`transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Configure Query
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={showPreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview Data
                </Button>
              </TooltipTrigger>
              <TooltipContent>See a sample of your data</TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderConceptUI()}

        {/* Data Preview */}
        {previewData && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-3 py-2 flex justify-between items-center">
              <span className="text-sm font-medium">Data Preview (first 5 rows)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewData(null)}
              >
                Close
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {/* Execute Button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={executeQuery}
          disabled={isExecuting}
        >
          <Play className="h-5 w-5" />
          {isExecuting ? "Running..." : "Run Query"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QueryBuilder;
