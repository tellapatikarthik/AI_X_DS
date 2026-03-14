import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DatasetHistory {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  mode: string;
}

interface DatasetHistoryPanelProps {
  onSelectDataset: (id: string) => void;
  currentMode: string;
}

const STORAGE_KEY = "dataset_history";

export const DatasetHistoryPanel = ({ onSelectDataset, currentMode }: DatasetHistoryPanelProps) => {
  const [datasets, setDatasets] = useState<DatasetHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setDatasets(JSON.parse(stored));
    }
  };

  const removeDataset = (id: string) => {
    const updated = datasets.filter(d => d.id !== id);
    setDatasets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(`dataset_${id}`);
  };

  const filteredDatasets = datasets.filter(d => d.mode === currentMode);

  if (filteredDatasets.length === 0) return null;

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Recent Datasets</h3>
      </div>
      <ScrollArea className="max-h-32">
        <div className="space-y-2">
          {filteredDatasets.map(dataset => (
            <div
              key={dataset.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
              onClick={() => onSelectDataset(dataset.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{dataset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataset.rowCount} rows • {dataset.columnCount} cols
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDataset(dataset.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export const saveDatasetToHistory = (
  name: string,
  data: any[],
  columns: string[],
  mode: string
) => {
  const id = `ds_${Date.now()}`;
  const dataset: DatasetHistory = {
    id,
    name,
    uploadedAt: new Date().toISOString(),
    rowCount: data.length,
    columnCount: columns.length,
    mode,
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const history: DatasetHistory[] = stored ? JSON.parse(stored) : [];
  history.unshift(dataset);
  
  // Keep only last 10
  const updated = history.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Store actual data
  localStorage.setItem(`dataset_${id}`, JSON.stringify({ data, columns }));
  
  return id;
};

export const loadDatasetFromHistory = (id: string) => {
  const stored = localStorage.getItem(`dataset_${id}`);
  return stored ? JSON.parse(stored) : null;
};
