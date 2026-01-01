import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartIcon, ChartType, chartTypes, getChartLabel } from "@/components/charts/ChartIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChartSidebarProps {
  onSelectChart: (type: ChartType) => void;
  selectedChart?: ChartType;
}

export const ChartSidebar = ({ onSelectChart, selectedChart }: ChartSidebarProps) => {
  return (
    <Card className="w-16 flex flex-col items-center py-4 gap-2 border-0 shadow-md bg-card">
      <div className="text-xs font-semibold text-muted-foreground mb-2 -rotate-90 whitespace-nowrap origin-center translate-y-4">
        Charts
      </div>
      <div className="flex flex-col gap-1 mt-6">
        {chartTypes.map((type) => (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedChart === type ? "default" : "ghost"}
                size="icon"
                className={`h-10 w-10 transition-all ${
                  selectedChart === type 
                    ? "bg-gradient-primary shadow-glow" 
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectChart(type)}
              >
                <ChartIcon type={type} className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{getChartLabel(type)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </Card>
  );
};
