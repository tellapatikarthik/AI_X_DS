import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Filter,
  ArrowUpDown,
  Calculator,
  Layers,
  GitCompare,
  Calendar,
  Merge,
  Lightbulb,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { CONCEPTS, DatasetInfo } from "@/types/queryTool";

interface ConceptSelectorProps {
  selectedConcept: string | null;
  selectedSubConcept: string | null;
  onConceptSelect: (concept: string) => void;
  onSubConceptSelect: (subConcept: string) => void;
  datasets: DatasetInfo[];
  isActive: boolean;
}

const iconMap: Record<string, any> = {
  Filter,
  ArrowUpDown,
  Calculator,
  Layers,
  GitCompare,
  Calendar,
  Merge,
  Lightbulb,
};

const ConceptSelector = ({
  selectedConcept,
  selectedSubConcept,
  onConceptSelect,
  onSubConceptSelect,
  datasets,
  isActive,
}: ConceptSelectorProps) => {
  const currentConcept = CONCEPTS.find((c) => c.id === selectedConcept);

  // Get available column types from selected datasets
  const availableTypes = new Set<string>();
  datasets.forEach((d) => {
    d.columns.forEach((col) => {
      availableTypes.add(col.type);
    });
  });

  // Check if concept is relevant based on data
  const isConceptRelevant = (conceptId: string) => {
    switch (conceptId) {
      case "time_analysis":
        return availableTypes.has("date");
      case "combine":
        return datasets.length > 1;
      default:
        return true;
    }
  };

  // Check if sub-concept is available based on column types
  const isSubConceptAvailable = (subConcept: { requiredColumnTypes?: string[] }) => {
    if (!subConcept.requiredColumnTypes) return true;
    return subConcept.requiredColumnTypes.some((type) => availableTypes.has(type));
  };

  // Get suggestions based on data
  const getSuggestions = () => {
    const suggestions: string[] = [];
    
    if (availableTypes.has("number")) {
      suggestions.push("aggregate");
    }
    if (availableTypes.has("date")) {
      suggestions.push("time_analysis");
    }
    if (datasets.length > 1) {
      suggestions.push("combine");
    }
    if (datasets.some((d) => d.rowCount > 100)) {
      suggestions.push("filter");
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <Card className={`transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          {selectedConcept ? "Choose Action Type" : "What would you like to do?"}
        </CardTitle>
        {suggestions.length > 0 && !selectedConcept && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Info className="h-4 w-4" />
            Suggested based on your data:{" "}
            {suggestions.map((s) => CONCEPTS.find((c) => c.id === s)?.name).join(", ")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Concept Grid */}
        {!selectedConcept && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONCEPTS.map((concept) => {
              const Icon = iconMap[concept.icon] || Lightbulb;
              const relevant = isConceptRelevant(concept.id);
              const suggested = suggestions.includes(concept.id);

              return (
                <Tooltip key={concept.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => relevant && onConceptSelect(concept.id)}
                      disabled={!relevant}
                      className={`relative p-4 rounded-lg border text-left transition-all ${
                        relevant
                          ? "hover:border-primary hover:shadow-md cursor-pointer"
                          : "opacity-50 cursor-not-allowed"
                      } ${suggested ? "border-primary/50 bg-primary/5" : ""}`}
                    >
                      {suggested && (
                        <Badge className="absolute -top-2 -right-2 text-xs bg-primary">
                          Suggested
                        </Badge>
                      )}
                      <Icon
                        className={`h-8 w-8 mb-2 ${
                          suggested ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <h4 className="font-medium">{concept.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {concept.description}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{concept.name}</p>
                    <p className="text-xs">{concept.description}</p>
                    {!relevant && (
                      <p className="text-xs text-destructive mt-1">
                        {concept.id === "time_analysis"
                          ? "Requires date columns"
                          : concept.id === "combine"
                          ? "Requires multiple datasets"
                          : "Not available for this data"}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Sub-Concept Selection */}
        {selectedConcept && currentConcept && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {(() => {
                const Icon = iconMap[currentConcept.icon] || Lightbulb;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              <div>
                <p className="font-medium">{currentConcept.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentConcept.description}
                </p>
              </div>
              <button
                onClick={() => onConceptSelect("")}
                className="ml-auto text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentConcept.subConcepts.map((sub) => {
                const available = isSubConceptAvailable(sub);
                const isSelected = selectedSubConcept === sub.id;

                return (
                  <Tooltip key={sub.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => available && onSubConceptSelect(sub.id)}
                        disabled={!available}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : available
                            ? "hover:border-primary/50"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{sub.name}</h5>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sub.description}
                        </p>
                        {sub.requiredColumnTypes && (
                          <div className="flex gap-1 mt-2">
                            {sub.requiredColumnTypes.map((type) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!available && (
                      <TooltipContent>
                        <p className="text-destructive">
                          Requires {sub.requiredColumnTypes?.join(" or ")} columns
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConceptSelector;
