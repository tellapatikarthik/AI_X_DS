import { 
  BarChart3, 
  BarChart4,
  BarChartHorizontal,
  LineChart, 
  TrendingUp,
  Activity,
  PieChart, 
  AreaChart, 
  ScatterChart,
  Target,
  CircleDot,
  Gauge,
  Layers,
  Table2,
  Grid3x3,
  TreePine,
  Globe,
  MapPin,
  Waves,
  Layers3,
  TrendingDown,
  type LucideIcon
} from "lucide-react";

export type ChartType = 
  // Bar & Column
  | "clustered-column" | "stacked-column" | "100-stacked-column"
  | "clustered-bar" | "stacked-bar" | "100-stacked-bar"
  // Line & Area
  | "line" | "area" | "stacked-area" | "line-stacked-column" | "line-clustered-column"
  // Pie & Donut
  | "pie" | "donut"
  // Advanced
  | "ribbon" | "waterfall" | "funnel"
  // Scatter
  | "scatter" | "bubble"
  // KPI & Cards
  | "card" | "kpi" | "gauge"
  // Tables
  | "table" | "matrix"
  // Hierarchical
  | "treemap"
  // Maps
  | "map" | "filled-map"
  // Legacy
  | "bar" | "radar" | "worldmap";

interface ChartIconProps {
  type: ChartType;
  className?: string;
}

const chartIcons: Record<ChartType, LucideIcon> = {
  // Bar & Column
  "clustered-column": BarChart3, "stacked-column": Layers3, "100-stacked-column": Layers,
  "clustered-bar": BarChartHorizontal, "stacked-bar": BarChart4, "100-stacked-bar": Grid3x3,
  // Line & Area
  line: LineChart, area: AreaChart, "stacked-area": Waves,
  "line-stacked-column": TrendingUp, "line-clustered-column": Activity,
  // Pie & Donut
  pie: PieChart, donut: Target,
  // Advanced
  ribbon: Waves, waterfall: TrendingDown, funnel: TrendingUp,
  // Scatter
  scatter: ScatterChart, bubble: CircleDot,
  // KPI & Cards
  card: Target, kpi: Gauge, gauge: CircleDot,
  // Tables
  table: Table2, matrix: Grid3x3,
  // Hierarchical
  treemap: TreePine,
  // Maps
  map: MapPin, "filled-map": Globe,
  // Legacy
  bar: BarChart3, radar: Activity, worldmap: Globe,
};

const chartLabels: Record<ChartType, string> = {
  // Bar & Column
  "clustered-column": "Clustered Column", "stacked-column": "Stacked Column", "100-stacked-column": "100% Stacked Column",
  "clustered-bar": "Clustered Bar", "stacked-bar": "Stacked Bar", "100-stacked-bar": "100% Stacked Bar",
  // Line & Area
  line: "Line Chart", area: "Area Chart", "stacked-area": "Stacked Area",
  "line-stacked-column": "Line & Stacked Column", "line-clustered-column": "Line & Clustered Column",
  // Pie & Donut
  pie: "Pie Chart", donut: "Donut Chart",
  // Advanced
  ribbon: "Ribbon Chart", waterfall: "Waterfall", funnel: "Funnel",
  // Scatter
  scatter: "Scatter", bubble: "Bubble Chart",
  // KPI & Cards
  card: "Card", kpi: "KPI", gauge: "Gauge",
  // Tables
  table: "Table", matrix: "Matrix",
  // Hierarchical
  treemap: "Treemap",
  // Maps
  map: "Map", "filled-map": "Filled Map",
  // Legacy
  bar: "Bar Chart", radar: "Radar", worldmap: "World Map",
};

export const ChartIcon = ({ type, className }: ChartIconProps) => {
  const Icon = chartIcons[type];
  return <Icon className={className} />;
};

export const getChartLabel = (type: ChartType) => chartLabels[type];

export const chartTypes: ChartType[] = [
  "clustered-column", "stacked-column", "100-stacked-column",
  "clustered-bar", "stacked-bar", "100-stacked-bar",
  "line", "area", "stacked-area", "line-stacked-column", "line-clustered-column",
  "pie", "donut",
  "ribbon", "waterfall", "funnel",
  "scatter", "bubble",
  "card", "kpi", "gauge",
  "table", "matrix",
  "treemap",
  "map", "filled-map",
];
