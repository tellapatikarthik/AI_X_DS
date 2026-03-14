import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { VisualizationConfig } from "./VisualizationBuilder";
import { Trash2, Maximize2, GripVertical } from "lucide-react";
import { ChartIcon } from "@/components/charts/ChartIcon";
import { useState, useEffect } from "react";

interface DashboardCanvasProps {
  visualizations: (VisualizationConfig & { id: string })[];
  data: any[];
  onRemove: (id: string) => void;
}

interface VizSize {
  width: number;
  height: number;
}

export const DashboardCanvas = ({
  visualizations,
  data,
  onRemove,
}: DashboardCanvasProps) => {
  const [sizes, setSizes] = useState<Record<string, VizSize>>({});
  const [resizing, setResizing] = useState<{ id: string; edge: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  const getSize = (id: string) => sizes[id] || { width: 500, height: 350 };

  const startResize = (e: React.MouseEvent, id: string, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentSize = getSize(id);
    setResizing({
      id,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentSize.width,
      startHeight: currentSize.height,
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      
      let newWidth = resizing.startWidth;
      let newHeight = resizing.startHeight;
      
      if (resizing.edge.includes('e')) newWidth = Math.max(300, resizing.startWidth + deltaX);
      if (resizing.edge.includes('w')) newWidth = Math.max(300, resizing.startWidth - deltaX);
      if (resizing.edge.includes('s')) newHeight = Math.max(250, resizing.startHeight + deltaY);
      if (resizing.edge.includes('n')) newHeight = Math.max(250, resizing.startHeight - deltaY);
      
      setSizes(prev => ({ ...prev, [resizing.id]: { width: newWidth, height: newHeight } }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

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
    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
      <div className="flex flex-wrap gap-4">
        {visualizations.map((viz) => {
          const size = getSize(viz.id);
          return (
            <Card
              key={viz.id}
              className="p-4 border-0 shadow-md hover:shadow-lg transition-all group relative"
              style={{ width: size.width, height: size.height }}
            >
              {/* Resize Handles */}
              <div className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'nw')} />
              <div className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'ne')} />
              <div className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'sw')} />
              <div className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'se')} />
              <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'n')} />
              <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 's')} />
              <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'w')} />
              <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize z-10" onMouseDown={(e) => startResize(e, viz.id, 'e')} />
              
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
              <div style={{ width: "100%", height: `${size.height - 80}px` }}>
                <ChartRenderer
                  type={viz.chartType}
                  data={data}
                  xAxis={viz.xAxis}
                  yAxis={viz.yAxis}
                  yAxisColumns={viz.yAxisColumns}
                  height={size.height - 80}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
