import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, FunnelChart, Funnel, LabelList, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartType } from "./ChartIcon";
import { MapRenderer } from "./MapRenderer";

const COLORS = [
  "hsl(245, 60%, 55%)", "hsl(180, 65%, 50%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)",
  "hsl(260, 65%, 60%)", "hsl(0, 72%, 51%)", "hsl(200, 70%, 55%)", "hsl(300, 60%, 50%)",
];

interface ChartRendererProps {
  type: ChartType;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  yAxisColumns?: string[];
  width?: number;
  height?: number;
}

const aggregateData = (raw: any[], xKey: string, yKey: string, chartType: ChartType, yKeys?: string[]): any[] => {
  if (chartType === "scatter" || chartType === "bubble" || chartType.includes("map") || chartType === "gauge" || chartType === "table") return raw;
  
  const isNumeric = raw.some((r) => typeof r[yKey] === "number" && !isNaN(r[yKey]));
  const distinctX = new Set(raw.map((r) => String(r[xKey] ?? "").trim().toLowerCase())).size;
  
  if (distinctX <= 20 && raw.length <= 20) return raw;
  
  const groups = new Map<string, { displayName: string; rows: any[] }>();
  for (const row of raw) {
    const rawKey = String(row[xKey] ?? "");
    const normKey = rawKey.trim().toLowerCase();
    if (!groups.has(normKey)) groups.set(normKey, { displayName: rawKey, rows: [] });
    groups.get(normKey)!.rows.push(row);
  }
  
  const aggregated: any[] = [];
  const keysToAggregate = yKeys && yKeys.length > 0 ? yKeys : [yKey];
  
  for (const [, { displayName, rows }] of groups) {
    const aggRow: any = { [xKey]: displayName };
    
    for (const key of keysToAggregate) {
      const keyIsNumeric = rows.some(r => typeof r[key] === "number" && !isNaN(r[key]));
      if (!keyIsNumeric) {
        aggRow[key] = rows.length;
      } else {
        const sum = rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
        aggRow[key] = parseFloat(sum.toFixed(2));
      }
    }
    aggregated.push(aggRow);
  }
  
  aggregated.sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0));
  return aggregated;
};

export const ChartRenderer = ({ type, data, xAxis, yAxis, yAxisColumns, height = 300 }: ChartRendererProps) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }

  const xKey = xAxis || Object.keys(data[0])[0];
  const yKey = yAxis || Object.keys(data[0])[1];
  const yKeys = yAxisColumns && yAxisColumns.length > 0 ? yAxisColumns : [yKey];
  const chartData = aggregateData(data, xKey, yKey, type, yKeys);

  const commonProps = {
    contentStyle: { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }
  };

  switch (type) {
    case "clustered-column":
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} angle={chartData.length > 10 ? -45 : 0} textAnchor={chartData.length > 10 ? "end" : "middle"} height={chartData.length > 10 ? 80 : 30} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "stacked-column":
      const stackKeys = Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number');
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            {stackKeys.slice(0, 5).map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "100-stacked-column":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            <Bar dataKey={yKey} stackId="a" fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "clustered-bar":
    case "stacked-bar":
    case "100-stacked-bar":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis type="category" dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
            <Tooltip {...commonProps} />
            <Legend />
            <Bar dataKey={yKey} fill={COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            {yKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ fill: COLORS[i % COLORS.length] }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            {yKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "stacked-area":
      const areaKeys = Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number');
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            {areaKeys.slice(0, 5).map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "line-clustered-column":
    case "line-stacked-column":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            <Bar dataKey={yKey} fill={COLORS[0]} />
            <Line type="monotone" dataKey={yKey} stroke={COLORS[1]} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      );

    case "pie":
    case "donut":
      let pieSource = chartData;
      if (new Set(chartData.map(d => String(d[xKey]))).size > 10) {
        pieSource = [...chartData].sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0)).slice(0, 10);
      }
      const pieData = pieSource.map(item => ({ name: item[xKey], value: Number(item[yKey]) || 0 }));
      const pieRadius = Math.min(80, Math.max(40, 150 - pieData.length * 2));
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="40%" innerRadius={type === "donut" ? pieRadius * 0.7 : 0} outerRadius={pieRadius} paddingAngle={2} dataKey="value" label={pieData.length <= 15}>
              {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip {...commonProps} />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ maxHeight: height - 40, overflowY: "auto", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case "scatter":
    case "bubble":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis type="number" dataKey={yKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Scatter data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case "waterfall":
    case "ribbon":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip {...commonProps} />
            <Legend />
            <Bar dataKey={yKey} fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "funnel":
      const funnelData = chartData.map((item, index) => ({ name: item[xKey], value: Number(item[yKey]) || 0, fill: COLORS[index % COLORS.length] }));
      return (
        <ResponsiveContainer width="100%" height={height}>
          <FunnelChart>
            <Tooltip {...commonProps} />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      );

    case "treemap":
      const treemapData = chartData.map((item, index) => ({ name: item[xKey], size: Number(item[yKey]) || 0, fill: COLORS[index % COLORS.length] }));
      return (
        <ResponsiveContainer width="100%" height={height}>
          <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="hsl(var(--background))" fill="hsl(var(--primary))" />
        </ResponsiveContainer>
      );

    case "gauge":
      const gaugeValue = Number(chartData[0]?.[yKey]) || 0;
      const gaugeData = [{ name: "value", value: gaugeValue, fill: COLORS[0] }, { name: "rest", value: 100 - gaugeValue, fill: "hsl(var(--muted))" }];
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={gaugeData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} dataKey="value">
              {gaugeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">{gaugeValue}%</text>
          </PieChart>
        </ResponsiveContainer>
      );

    case "card":
    case "kpi":
      const cardValue = Number(chartData[0]?.[yKey]) || 0;
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-5xl font-bold text-primary">{cardValue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-2">{yKey}</div>
        </div>
      );

    case "table":
    case "matrix":
      const cols = Object.keys(data[0]);
      return (
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>{cols.map(col => <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>)}</tr>
            </thead>
            <tbody>
              {data.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  {cols.map(col => <td key={col} className="px-3 py-2">{String(row[col] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "map":
    case "filled-map":
    case "worldmap":
      return <MapRenderer data={chartData} xAxis={xKey} yAxis={yKey} height={height} />;

    case "radar":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" />
            <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
            <Radar dataKey={yKey} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.5} />
            <Tooltip {...commonProps} />
          </RadarChart>
        </ResponsiveContainer>
      );

    default:
      return <div className="flex items-center justify-center h-full text-muted-foreground">Chart type not supported</div>;
  }
};
