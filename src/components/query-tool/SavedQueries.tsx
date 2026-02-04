import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookmarkCheck, Trash2, Clock, Play } from "lucide-react";
import { QueryConfig, CONCEPTS } from "@/types/queryTool";
import { useToast } from "@/hooks/use-toast";

interface SavedQueriesProps {
  onLoadQuery: (config: QueryConfig) => void;
}

const SavedQueries = ({ onLoadQuery }: SavedQueriesProps) => {
  const [open, setOpen] = useState(false);
  const [savedQueries, setSavedQueries] = useState<QueryConfig[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const saved = sessionStorage.getItem("savedQueries");
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved queries:", e);
      }
    }
  }, [open]);

  const handleLoad = (query: QueryConfig) => {
    onLoadQuery(query);
    setOpen(false);
    toast({
      title: "Query loaded",
      description: `Loaded "${query.name}"`,
    });
  };

  const handleDelete = (id: string) => {
    const updated = savedQueries.filter((q) => q.id !== id);
    setSavedQueries(updated);
    sessionStorage.setItem("savedQueries", JSON.stringify(updated));
    toast({
      title: "Query deleted",
      description: "Saved query has been removed",
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConceptName = (conceptId: string) => {
    return CONCEPTS.find((c) => c.id === conceptId)?.name || conceptId;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookmarkCheck className="h-4 w-4" />
          Saved Queries
          {savedQueries.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {savedQueries.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Saved Queries</DialogTitle>
          <DialogDescription>
            Load a previously saved query configuration
          </DialogDescription>
        </DialogHeader>

        {savedQueries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookmarkCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No saved queries yet</p>
            <p className="text-sm">
              Save a query after running it to reuse later
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {savedQueries.map((query) => (
                <div
                  key={query.id}
                  className="p-3 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{query.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getConceptName(query.concept)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {query.subConcept}
                        </Badge>
                      </div>
                      {query.savedAt && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(query.savedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleLoad(query)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => query.id && handleDelete(query.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedQueries;
