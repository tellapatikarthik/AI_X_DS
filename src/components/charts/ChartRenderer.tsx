import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartType } from "./ChartIcon";
import { MapRenderer } from "./MapRenderer";

const COLORS = [
  "hsl(245, 60%, 55%)",
  "hsl(180, 65%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(260, 65%, 60%)",
  "hsl(0, 72%, 51%)",
  "hsl(200, 70%, 55%)",
  "hsl(300, 60%, 50%)",
];

interface ChartRendererProps {
  type: ChartType;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  width?: number;
  height?: number;
}

/**
 * Power BI-style aggregation: groups by xAxis key.
 * - Numeric yAxis values → SUM
 * - String yAxis values → COUNT (distinct)
 * Skips aggregation for scatter charts or when data is already small enough.
 */
const aggregateData = (
  raw: any[],
  xKey: string,
  yKey: string,
  chartType: ChartType
): any[] => {
  // Skip aggregation for scatter (needs raw points) and maps
  if (chartType === "scatter" || chartType === "worldmap" || chartType === "gauge") return raw;

  // Check if yAxis values are numeric
  const isNumeric = raw.some((r) => typeof r[yKey] === "number" && !isNaN(r[yKey]));
  const isYString = !isNumeric;

  // Count distinct xAxis values
  const distinctX = new Set(raw.map((r) => String(r[xKey] ?? "").trim().toLowerCase())).size;

  // Only aggregate when distinct categories > threshold or data is large
  const THRESHOLD = 20;
  if (distinctX <= THRESHOLD && raw.length <= THRESHOLD) return raw;

  // Group by xAxis (case-insensitive)
  const groups = new Map<string, { displayName: string; rows: any[] }>();
  for (const row of raw) {
    const rawKey = String(row[xKey] ?? "");
    const normKey = rawKey.trim().toLowerCase();
    if (!groups.has(normKey)) {
      groups.set(normKey, { displayName: rawKey, rows: [] });
    }
    groups.get(normKey)!.rows.push(row);
  }

  // Aggregate
  const aggregated: any[] = [];
  for (const [, { displayName, rows }] of groups) {
    if (isYString) {
      // COUNT of rows per group (like Power BI does for text columns)
      aggregated.push({ [xKey]: displayName, [yKey]: rows.length });
    } else {
      // SUM numeric values (Power BI default for numbers)
      const sum = rows.reduce((acc, r) => acc + (Number(r[yKey]) || 0), 0);
      aggregated.push({ [xKey]: displayName, [yKey]: parseFloat(sum.toFixed(2)) });
    }
  }

  // Sort descending by value for better visuals
  aggregated.sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0));

  return aggregated;
};

export const ChartRenderer = ({
  type,
  data,
  xAxis,
  yAxis,
  height = 300,
}: ChartRendererProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Determine keys
  const xKey = xAxis || Object.keys(data[0])[0];
  const yKey = yAxis || Object.keys(data[0])[1];

  // Apply Power BI-style aggregation
  const chartData = aggregateData(data, xKey, yKey, type);

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={12} interval={0} angle={chartData.length > 10 ? -45 : 0} textAnchor={chartData.length > 10 ? "end" : "middle"} height={chartData.length > 10 ? 80 : 30} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0] }}
              />
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        const pieData = chartData.map((item) => ({
          name: item[xKey],
          value: Number(item[yKey]) || 0,
        }));
        const pieRadius = Math.min(80, Math.max(40, 150 - pieData.length * 2));
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="40%"
                innerRadius={type === "donut" ? pieRadius * 0.7 : 0}
                outerRadius={pieRadius}
                paddingAngle={2}
                dataKey="value"
                label={pieData.length <= 15}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ maxHeight: height - 40, overflowY: "auto", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey={yKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Scatter data={chartData} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" />
              <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
              <Radar
                dataKey={yKey}
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "treemap":
        const treemapData = chartData.map((item, index) => ({
          name: item[xKey],
          size: Number(item[yKey]) || 0,
          fill: COLORS[index % COLORS.length],
        }));
        return (
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--background))"
              fill="hsl(var(--primary))"
            />
          </ResponsiveContainer>
        );

      case "funnel":
        const funnelData = chartData.map((item, index) => ({
          name: item[xKey],
          value: Number(item[yKey]) || 0,
          fill: COLORS[index % COLORS.length],
        }));
        return (
          <ResponsiveContainer width="100%" height={height}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case "gauge":
        const gaugeValue = Number(chartData[0]?.[yKey]) || 0;
        const gaugeData = [
          { name: "value", value: gaugeValue, fill: COLORS[0] },
          { name: "rest", value: 100 - gaugeValue, fill: "hsl(var(--muted))" },
        ];
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-bold"
              >
                {gaugeValue}%
              </text>
            </PieChart>
          </ResponsiveContainer>
        );

      case "worldmap":
        return (
          <MapRenderer
            data={chartData}
            xAxis={xKey}
            yAxis={yKey}
            height={height}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart type not supported
          </div>
        );
    }
  };

  return <div className="w-full h-full">{renderChart()}</div>;
};
