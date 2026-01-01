import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  row_count: number | null;
}

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedDataset: string | null;
  onSelect: (datasetId: string) => void;
}

export const DatasetSelector = ({
  datasets,
  selectedDataset,
  onSelect,
}: DatasetSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <FileSpreadsheet className="h-5 w-5 text-primary" />
      <Select value={selectedDataset || ""} onValueChange={onSelect}>
        <SelectTrigger className="w-[250px] bg-card border-0 shadow-sm">
          <SelectValue placeholder="Select a dataset" />
        </SelectTrigger>
        <SelectContent>
          {datasets.map((dataset) => (
            <SelectItem key={dataset.id} value={dataset.id}>
              <div className="flex items-center gap-2">
                <span>{dataset.name}</span>
                {dataset.row_count && (
                  <span className="text-xs text-muted-foreground">
                    ({dataset.row_count} rows)
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
