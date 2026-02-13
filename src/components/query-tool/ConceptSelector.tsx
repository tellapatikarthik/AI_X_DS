import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Columns,
  Binary,
  Type,
  Hash,
  GitBranch,
  LayoutGrid,
  ListEnd,
  Edit,
  ArrowLeftRight,
  CircleSlash,
  TrendingUp,
  Shield,
  Lock,
  Zap,
  Braces,
  Combine,
} from "lucide-react";
import { CONCEPTS, DatasetInfo } from "@/types/queryTool";

interface ConceptSelectorProps {
  selectedConcept: string | null;
  selectedSubConcepts: string[];
  onConceptSelect: (concept: string) => void;
  onSubConceptToggle: (subConcept: string) => void;
  onSubConceptsProceed: () => void;
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
  Columns,
  Binary,
  Type,
  Hash,
  GitBranch,
  LayoutGrid,
  ListEnd,
  Edit,
  ArrowLeftRight,
  CircleSlash,
  TrendingUp,
  Shield,
  Lock,
  Zap,
  Braces,
  Combine,
};

const ConceptSelector = ({
  selectedConcept,
  selectedSubConcepts,
  onConceptSelect,
  onSubConceptToggle,
  onSubConceptsProceed,
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
      case "date_functions":
        return availableTypes.has("date");
      case "join":
      case "set_operations":
        return datasets.length > 1;
      case "modify":
      case "transactions":
      case "constraints":
      case "performance":
        // These are informational/educational concepts
        return true;
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
    
    // Always suggest select as starting point
    suggestions.push("select");
    
    if (availableTypes.has("number")) {
      suggestions.push("aggregate");
    }
    if (availableTypes.has("date")) {
      suggestions.push("time_analysis");
    }
    if (datasets.length > 1) {
      suggestions.push("join");
    }
    if (datasets.some((d) => d.rowCount > 100)) {
      suggestions.push("filter");
    }
    if (availableTypes.has("string")) {
      suggestions.push("string_functions");
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
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
        {/* Concept Grid - Scrollable */}
        {!selectedConcept && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                        className={`relative p-3 rounded-lg border text-left transition-all ${
                          relevant
                            ? "hover:border-primary hover:shadow-md cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        } ${suggested ? "border-primary/50 bg-primary/5" : ""}`}
                      >
                        {suggested && (
                          <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-primary">
                            Suggested
                          </Badge>
                        )}
                        <Icon
                          className={`h-6 w-6 mb-1.5 ${
                            suggested ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <h4 className="font-medium text-sm">{concept.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {concept.description}
                        </p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{concept.name}</p>
                      <p className="text-xs">{concept.description}</p>
                      {!relevant && (
                        <p className="text-xs text-destructive mt-1">
                          {concept.id === "time_analysis" || concept.id === "date_functions"
                            ? "Requires date columns"
                            : concept.id === "join" || concept.id === "set_operations"
                            ? "Requires multiple datasets"
                            : "Not available for this data"}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
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
                const isSelected = selectedSubConcepts.includes(sub.id);

                return (
                  <Tooltip key={sub.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => available && onSubConceptToggle(sub.id)}
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

            {selectedSubConcepts.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  <Badge variant="default" className="mr-2">{selectedSubConcepts.length}</Badge>
                  sub-concept{selectedSubConcepts.length > 1 ? "s" : ""} selected
                </p>
                <Button onClick={onSubConceptsProceed} className="gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Configure Query
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConceptSelector;
