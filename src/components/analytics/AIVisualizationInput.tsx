import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChartType } from "@/components/charts/ChartIcon";

interface Column {
  name: string;
  type: string;
}

interface VisualizationSuggestion {
  chartType: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  description: string;
}

interface AIVisualizationInputProps {
  columns: Column[];
  sampleData: any[];
  onSuggestions: (suggestions: VisualizationSuggestion[]) => void;
}

export const AIVisualizationInput = ({
  columns,
  sampleData,
  onSuggestions,
}: AIVisualizationInputProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-visualizations", {
        body: {
          userRequest: query,
          columns: columns.map((c) => c.name),
          sampleData: sampleData.slice(0, 10),
        },
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        onSuggestions(data.suggestions);
        toast.success(`Found ${data.suggestions.length} visualization suggestions!`);
      } else {
        toast.info("No suggestions found. Try a different description.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("402")) {
        toast.error("Credits required. Please add credits to continue.");
      } else {
        toast.error("Failed to get suggestions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you want to visualize... (e.g., 'Show me sales trends over time')"
          className="pl-10 bg-card border-0 shadow-sm"
          disabled={loading}
        />
      </div>
      <Button type="submit" variant="hero" disabled={loading || !query.trim()}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Suggest
          </>
        )}
      </Button>
    </form>
  );
};
