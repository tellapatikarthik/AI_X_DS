import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  AreaChart, 
  ScatterChart,
  Activity,
  Target,
  TrendingUp,
  Layers,
  CircleDot,
  Globe,
  type LucideIcon
} from "lucide-react";

export type ChartType = 
  | "bar" 
  | "line" 
  | "pie" 
  | "area" 
  | "scatter" 
  | "donut" 
  | "radar" 
  | "treemap" 
  | "funnel" 
  | "gauge"
  | "worldmap";

interface ChartIconProps {
  type: ChartType;
  className?: string;
}

const chartIcons: Record<ChartType, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: AreaChart,
  scatter: ScatterChart,
  donut: PieChart,
  radar: Activity,
  treemap: Layers,
  funnel: TrendingUp,
  gauge: CircleDot,
  worldmap: Globe,
};

const chartLabels: Record<ChartType, string> = {
  bar: "Bar Chart",
  line: "Line Chart",
  pie: "Pie Chart",
  area: "Area Chart",
  scatter: "Scatter Plot",
  donut: "Donut Chart",
  radar: "Radar Chart",
  treemap: "Treemap",
  funnel: "Funnel Chart",
  gauge: "Gauge",
  worldmap: "World Map",
};

export const ChartIcon = ({ type, className }: ChartIconProps) => {
  const Icon = chartIcons[type];
  return <Icon className={className} />;
};

export const getChartLabel = (type: ChartType) => chartLabels[type];

export const chartTypes: ChartType[] = [
  "bar",
  "line",
  "pie",
  "area",
  "scatter",
  "donut",
  "radar",
  "treemap",
  "funnel",
  "gauge",
  "worldmap",
];
