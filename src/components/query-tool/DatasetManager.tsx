import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  FileSpreadsheet,
  Database,
  Trash2,
  Check,
  X,
  Info,
  ChevronRight,
  FileJson,
  Table2,
} from "lucide-react";
import { parseDatasetFile } from "@/lib/datasetParser";
import { DatasetInfo, ColumnInfo } from "@/types/queryTool";
import { useToast } from "@/hooks/use-toast";

interface DatasetManagerProps {
  datasets: DatasetInfo[];
  selectedDatasets: string[];
  onDatasetAdd: (dataset: DatasetInfo) => void;
  onDatasetRemove: (id: string) => void;
  onDatasetSelect: (id: string) => void;
  onProceed: () => void;
  isActive: boolean;
}

const analyzeColumn = (data: Record<string, any>[], columnName: string): ColumnInfo => {
  const values = data.map((row) => row[columnName]);
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "");
  const uniqueValues = new Set(nonNullValues);

  // Detect type
  let type: ColumnInfo["type"] = "unknown";
  const sample = nonNullValues.slice(0, 100);

  if (sample.length > 0) {
    const allNumbers = sample.every((v) => typeof v === "number" || !isNaN(Number(v)));
    const allBooleans = sample.every(
      (v) => typeof v === "boolean" || v === "true" || v === "false"
    );
    const hasDatePatterns = sample.some((v) => {
      if (typeof v !== "string") return false;
      return /^\d{4}[-/]\d{2}[-/]\d{2}/.test(v) || /^\d{2}[-/]\d{2}[-/]\d{4}/.test(v);
    });

    if (allBooleans) {
      type = "boolean";
    } else if (allNumbers) {
      type = "number";
    } else if (hasDatePatterns) {
      type = "date";
    } else {
      type = "string";
    }
  }

  return {
    name: columnName,
    type,
    sampleValues: nonNullValues.slice(0, 5),
    uniqueCount: uniqueValues.size,
    nullCount: values.length - nonNullValues.length,
  };
};

const detectRelationships = (
  newDataset: DatasetInfo,
  existingDatasets: DatasetInfo[]
): DatasetInfo["relationships"] => {
  const relationships: DatasetInfo["relationships"] = [];

  for (const existing of existingDatasets) {
    for (const newCol of newDataset.columns) {
      for (const existingCol of existing.columns) {
        // Check if column names are similar
        const nameSimilar =
          newCol.name.toLowerCase() === existingCol.name.toLowerCase() ||
          newCol.name.toLowerCase().includes(existingCol.name.toLowerCase()) ||
          existingCol.name.toLowerCase().includes(newCol.name.toLowerCase());

        if (nameSimilar && newCol.type === existingCol.type) {
          // Check value overlap
          const newValues = new Set(
            newDataset.data.map((r) => String(r[newCol.name]).toLowerCase())
          );
          const existingValues = existing.data.map((r) =>
            String(r[existingCol.name]).toLowerCase()
          );
          const matches = existingValues.filter((v) => newValues.has(v)).length;
          const matchPercentage = (matches / existingValues.length) * 100;

          if (matchPercentage > 10) {
            relationships.push({
              targetDatasetId: existing.id,
              sourceColumn: newCol.name,
              targetColumn: existingCol.name,
              matchPercentage: Math.round(matchPercentage),
            });
          }
        }
      }
    }
  }

  return relationships;
};

const DatasetManager = ({
  datasets,
  selectedDatasets,
  onDatasetAdd,
  onDatasetRemove,
  onDatasetSelect,
  onProceed,
  isActive,
}: DatasetManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const parsed = await parseDatasetFile(file);
        
        const columns = parsed.columns.map((colName) =>
          analyzeColumn(parsed.data, colName)
        );

        const relationships = detectRelationships(
          { id: "", name: "", data: parsed.data, columns, rowCount: parsed.data.length, uploadedAt: "" },
          datasets
        );

        const dataset: DatasetInfo = {
          id: `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          data: parsed.data,
          columns,
          rowCount: parsed.data.length,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          relationships,
        };

        onDatasetAdd(dataset);

        toast({
          title: "Dataset uploaded",
          description: `${file.name} - ${parsed.data.length} rows, ${columns.length} columns`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Could not parse file",
        });
      }
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getTypeColor = (type: ColumnInfo["type"]) => {
    switch (type) {
      case "number":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "string":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "date":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "boolean":
        return "bg-orange-500/10 text-orange-600 border-orange-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".json")) return FileJson;
    if (name.endsWith(".csv") || name.endsWith(".tsv")) return Table2;
    return FileSpreadsheet;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={`transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Manage Datasets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.tsv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">
            {isUploading ? "Uploading..." : "Drop files here or click to upload"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports CSV, Excel, JSON files
          </p>
        </div>

        {/* Dataset List */}
        {datasets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">
                Uploaded Datasets ({datasets.length})
              </h4>
              <p className="text-xs text-muted-foreground">
                Click to select for querying
              </p>
            </div>

            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {datasets.map((dataset) => {
                  const FileIcon = getFileIcon(dataset.name);
                  const isSelected = selectedDatasets.includes(dataset.id);

                  return (
                    <div
                      key={dataset.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => onDatasetSelect(dataset.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected ? "bg-primary/10" : "bg-muted"
                            }`}
                          >
                            <FileIcon
                              className={`h-5 w-5 ${
                                isSelected ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{dataset.name}</h5>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {dataset.rowCount.toLocaleString()} rows •{" "}
                              {dataset.columns.length} columns
                              {dataset.fileSize && ` • ${formatFileSize(dataset.fileSize)}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDatasetRemove(dataset.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Column Preview */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {dataset.columns.slice(0, 6).map((col) => (
                          <Tooltip key={col.name}>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTypeColor(col.type)}`}
                              >
                                {col.name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{col.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {col.type} • {col.uniqueCount} unique values
                              </p>
                              {col.sampleValues.length > 0 && (
                                <p className="text-xs mt-1">
                                  Sample: {col.sampleValues.slice(0, 3).join(", ")}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dataset.columns.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{dataset.columns.length - 6} more
                          </Badge>
                        )}
                      </div>

                      {/* Relationships */}
                      {dataset.relationships && dataset.relationships.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Possible links to other datasets detected
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Proceed Button */}
            {selectedDatasets.length > 0 && (
              <Button className="w-full gap-2" onClick={onProceed}>
                Continue with {selectedDatasets.length} dataset
                {selectedDatasets.length > 1 ? "s" : ""}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {datasets.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No datasets uploaded yet</p>
            <p className="text-sm">Upload your data files to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetManager;
