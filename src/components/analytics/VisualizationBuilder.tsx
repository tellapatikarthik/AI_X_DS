import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { ChartType, getChartLabel, ChartIcon } from "@/components/charts/ChartIcon";
import { Plus, Save, X } from "lucide-react";

interface Column {
  name: string;
  type: string;
}

interface VisualizationBuilderProps {
  chartType: ChartType;
  columns: Column[];
  data: any[];
  onSave: (config: VisualizationConfig) => void;
  onCancel: () => void;
}

export interface VisualizationConfig {
  chartType: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  description?: string;
}

export const VisualizationBuilder = ({
  chartType,
  columns,
  data,
  onSave,
  onCancel,
}: VisualizationBuilderProps) => {
  const [title, setTitle] = useState(`New ${getChartLabel(chartType)}`);
  const [xAxis, setXAxis] = useState(() => columns[0]?.name || "");
  const [yAxis, setYAxis] = useState(() => {
    const x = columns[0]?.name || "";
    const sample = data.slice(0, 30);
    const isNumeric = (name: string) =>
      sample.some((row) => typeof row?.[name] === "number" && !Number.isNaN(row[name]));

    return (
      columns.find((c) => c.name !== x && isNumeric(c.name))?.name ||
      columns.find((c) => isNumeric(c.name))?.name ||
      columns[1]?.name ||
      x
    );
  });

  useEffect(() => {
    setTitle(`New ${getChartLabel(chartType)}`);

    const x = columns[0]?.name || "";
    const sample = data.slice(0, 30);
    const isNumeric = (name: string) =>
      sample.some((row) => typeof row?.[name] === "number" && !Number.isNaN(row[name]));

    const y =
      columns.find((c) => c.name !== x && isNumeric(c.name))?.name ||
      columns.find((c) => isNumeric(c.name))?.name ||
      columns[1]?.name ||
      x;

    setXAxis(x);
    setYAxis(y);
  }, [chartType]);

  const handleSave = () => {
    onSave({
      chartType,
      title,
      xAxis,
      yAxis,
    });
  };

  return (
    <Card className="p-6 border-0 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <ChartIcon type={chartType} className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{getChartLabel(chartType)}</h3>
            <p className="text-sm text-muted-foreground">Configure your visualization</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Chart Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="xAxis">
              {["pie", "donut"].includes(chartType) ? "Category (Slices)" :
               chartType === "radar" ? "Angle Axis" :
               chartType === "treemap" ? "Category" :
               chartType === "funnel" ? "Stage" :
               chartType === "gauge" ? "Label" :
               chartType === "worldmap" ? "Country / Region" :
               "X-Axis (Categories)"}
            </Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="yAxis">
              {["pie", "donut"].includes(chartType) ? "Value (Size)" :
               chartType === "radar" ? "Radius Value" :
               chartType === "treemap" ? "Size Value" :
               chartType === "funnel" ? "Value" :
               chartType === "gauge" ? "Value (%)" :
               chartType === "worldmap" ? "Value" :
               "Y-Axis (Values)"}
            </Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} variant="hero" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Add to Dashboard
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 min-h-[300px]">
          <p className="text-sm text-muted-foreground mb-4">Preview</p>
          <ChartRenderer
            type={chartType}
            data={data}
            xAxis={xAxis}
            yAxis={yAxis}
            height={280}
          />
        </div>
      </div>
    </Card>
  );
};
