import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { VisualizationConfig } from "./VisualizationBuilder";
import { Trash2, Maximize2, GripVertical } from "lucide-react";
import { ChartIcon } from "@/components/charts/ChartIcon";

interface DashboardCanvasProps {
  visualizations: (VisualizationConfig & { id: string })[];
  data: any[];
  onRemove: (id: string) => void;
}

export const DashboardCanvas = ({
  visualizations,
  data,
  onRemove,
}: DashboardCanvasProps) => {
  if (visualizations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
        <div className="text-center p-8">
          <div className="h-16 w-16 rounded-full bg-gradient-primary opacity-20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Visualizations Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Click on a chart type from the sidebar or use the AI assistant to create your first visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
      {visualizations.map((viz) => (
        <Card
          key={viz.id}
          className="p-4 border-0 shadow-md hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-8 w-8 rounded bg-gradient-primary flex items-center justify-center">
                <ChartIcon type={viz.chartType} className="h-4 w-4 text-primary-foreground" />
              </div>
              <h4 className="font-semibold">{viz.title}</h4>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemove(viz.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-[250px]">
            <ChartRenderer
              type={viz.chartType}
              data={data}
              xAxis={viz.xAxis}
              yAxis={viz.yAxis}
              height={250}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};
