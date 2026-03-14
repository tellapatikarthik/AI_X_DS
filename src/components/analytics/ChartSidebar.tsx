import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartIcon, ChartType, getChartLabel } from "@/components/charts/ChartIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, BarChart3, LineChart, PieChart, TrendingUp, ScatterChart, Gauge, Table2, TreePine } from "lucide-react";

interface ChartSidebarProps {
  onSelectChart: (type: ChartType) => void;
  selectedChart?: ChartType;
}

const chartCategories = {
  "Bar & Column": {
    icon: BarChart3,
    charts: ["clustered-column", "stacked-column", "100-stacked-column", "clustered-bar", "stacked-bar", "100-stacked-bar"] as ChartType[]
  },
  "Line & Area": {
    icon: LineChart,
    charts: ["line", "area", "stacked-area", "line-stacked-column", "line-clustered-column"] as ChartType[]
  },
  "Pie & Donut": {
    icon: PieChart,
    charts: ["pie", "donut"] as ChartType[]
  },
  "Advanced": {
    icon: TrendingUp,
    charts: ["ribbon", "waterfall", "funnel"] as ChartType[]
  },
  "Scatter": {
    icon: ScatterChart,
    charts: ["scatter", "bubble"] as ChartType[]
  },
  "KPI & Cards": {
    icon: Gauge,
    charts: ["card", "kpi", "gauge"] as ChartType[]
  },
  "Tables": {
    icon: Table2,
    charts: ["table", "matrix"] as ChartType[]
  },
  "Other": {
    icon: TreePine,
    charts: ["treemap", "map", "filled-map"] as ChartType[]
  },
};

export const ChartSidebar = ({ onSelectChart, selectedChart }: ChartSidebarProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Card className="w-64 flex flex-col border-0 shadow-md bg-card h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Visualizations</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(chartCategories).map(([category, { icon: CategoryIcon, charts }]) => {
            const isExpanded = expandedCategories.includes(category);
            return (
              <div key={category} className="mb-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-2 h-auto hover:bg-muted"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium flex-1 text-left">{category}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </Button>
                
                {isExpanded && (
                  <div className="grid grid-cols-3 gap-1 mt-1 px-2 py-2 bg-muted/30 rounded-md">
                    {charts.map((type) => (
                      <Tooltip key={type}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={selectedChart === type ? "default" : "ghost"}
                            size="icon"
                            className={`h-12 w-full transition-all ${
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
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
