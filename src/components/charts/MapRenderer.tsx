import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Common country name aliases for case-insensitive matching
const COUNTRY_ALIASES: Record<string, string[]> = {
  "United States of America": ["usa", "us", "united states", "united states of america", "america"],
  "United Kingdom": ["uk", "united kingdom", "great britain", "england", "britain"],
  "Russian Federation": ["russia", "russian federation"],
  "South Korea": ["south korea", "korea, south", "republic of korea", "korea"],
  "North Korea": ["north korea", "korea, north", "dprk"],
  "China": ["china", "peoples republic of china", "prc"],
  "India": ["india"],
  "Germany": ["germany", "deutschland"],
  "France": ["france"],
  "Japan": ["japan"],
  "Brazil": ["brazil", "brasil"],
  "Canada": ["canada"],
  "Australia": ["australia"],
  "Italy": ["italy", "italia"],
  "Spain": ["spain", "espana"],
  "Mexico": ["mexico", "méxico"],
  "Indonesia": ["indonesia"],
  "Netherlands": ["netherlands", "holland"],
  "Saudi Arabia": ["saudi arabia", "ksa"],
  "Turkey": ["turkey", "türkiye", "turkiye"],
  "Switzerland": ["switzerland"],
  "Sweden": ["sweden"],
  "Norway": ["norway"],
  "Denmark": ["denmark"],
  "Finland": ["finland"],
  "Poland": ["poland"],
  "Belgium": ["belgium"],
  "Austria": ["austria"],
  "Ireland": ["ireland"],
  "Portugal": ["portugal"],
  "Greece": ["greece"],
  "Czech Republic": ["czech republic", "czechia"],
  "Romania": ["romania"],
  "New Zealand": ["new zealand", "nz"],
  "South Africa": ["south africa", "rsa"],
  "Argentina": ["argentina"],
  "Colombia": ["colombia"],
  "Egypt": ["egypt"],
  "Israel": ["israel"],
  "Thailand": ["thailand"],
  "Vietnam": ["vietnam", "viet nam"],
  "Philippines": ["philippines"],
  "Malaysia": ["malaysia"],
  "Singapore": ["singapore"],
  "Nigeria": ["nigeria"],
  "Pakistan": ["pakistan"],
  "Bangladesh": ["bangladesh"],
  "Ukraine": ["ukraine"],
  "Chile": ["chile"],
  "Peru": ["peru"],
  "United Arab Emirates": ["uae", "united arab emirates"],
};

const COLORS_SCALE = [
  "hsl(210, 80%, 90%)",
  "hsl(210, 80%, 75%)",
  "hsl(210, 80%, 60%)",
  "hsl(210, 80%, 45%)",
  "hsl(210, 80%, 30%)",
];

function normalizeCountryName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function matchCountry(dataName: string, geoName: string): boolean {
  const normData = normalizeCountryName(dataName);
  const normGeo = normalizeCountryName(geoName);

  if (normData === normGeo) return true;

  // Check aliases
  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    const allNames = [normalizeCountryName(canonical), ...aliases.map(normalizeCountryName)];
    if (allNames.includes(normData) && allNames.includes(normGeo)) return true;
    // Also check if geo name matches canonical
    if (allNames.includes(normData) && normalizeCountryName(canonical) === normGeo) return true;
  }

  // Partial match (data name contained in geo name or vice versa)
  if (normGeo.includes(normData) || normData.includes(normGeo)) return true;

  return false;
}

interface MapRendererProps {
  data: any[];
  xAxis?: string;
  yAxis?: string;
  height?: number;
}

export const MapRenderer = ({ data, xAxis, yAxis, height = 300 }: MapRendererProps) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const { dataMap, minVal, maxVal } = useMemo(() => {
    const map = new Map<string, number>();
    let min = Infinity;
    let max = -Infinity;

    data.forEach((row) => {
      const country = String(row[xAxis || Object.keys(row)[0]] || "");
      const value = Number(row[yAxis || Object.keys(row)[1]]) || 0;
      if (country) {
        map.set(normalizeCountryName(country), value);
        if (value < min) min = value;
        if (value > max) max = value;
      }
    });

    return { dataMap: map, minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 0 : max };
  }, [data, xAxis, yAxis]);

  const getColor = (geoName: string) => {
    const normGeo = normalizeCountryName(geoName);

    // Direct match
    if (dataMap.has(normGeo)) {
      const val = dataMap.get(normGeo)!;
      const range = maxVal - minVal || 1;
      const idx = Math.min(Math.floor(((val - minVal) / range) * (COLORS_SCALE.length - 1)), COLORS_SCALE.length - 1);
      return COLORS_SCALE[idx];
    }

    // Alias/fuzzy match
    for (const [dataName, value] of dataMap.entries()) {
      if (matchCountry(dataName, geoName)) {
        const range = maxVal - minVal || 1;
        const idx = Math.min(Math.floor(((value - minVal) / range) * (COLORS_SCALE.length - 1)), COLORS_SCALE.length - 1);
        return COLORS_SCALE[idx];
      }
    }

    return "hsl(var(--muted))";
  };

  const getValue = (geoName: string): number | null => {
    const normGeo = normalizeCountryName(geoName);
    if (dataMap.has(normGeo)) return dataMap.get(normGeo)!;
    for (const [dataName, value] of dataMap.entries()) {
      if (matchCountry(dataName, geoName)) return value;
    }
    return null;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px]">
        <span>{minVal}</span>
        {COLORS_SCALE.map((c, i) => (
          <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>{maxVal}</span>
      </div>

      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
        width={800}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name;
                const val = getValue(name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(name)}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: "hsl(var(--primary))",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                  >
                    <title>{`${name}${val !== null ? `: ${val}` : ""}`}</title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};
