import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartIcon, ChartType, getChartLabel } from "@/components/charts/ChartIcon";
import { Plus, X } from "lucide-react";

interface Suggestion {
  chartType: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  description: string;
}

interface SuggestionCardsProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

export const SuggestionCards = ({
  suggestions,
  onApply,
  onDismiss,
}: SuggestionCardsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          AI Suggestions
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className="p-4 border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onApply(suggestion)}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <ChartIcon type={suggestion.chartType} className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {getChartLabel(suggestion.chartType)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {suggestion.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
