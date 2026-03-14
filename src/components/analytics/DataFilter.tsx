import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataFilterProps {
  columns: string[];
  data: any[];
  onApplyFilter: (selectedValues: Record<string, string[]>) => void;
  activeFilters: Record<string, string[]>;
}

export const DataFilter = ({ columns, data, onApplyFilter, activeFilters }: DataFilterProps) => {
  const [open, setOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(columns[0] || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>(activeFilters);

  const columnValues = useMemo(() => {
    const values = new Map<string, Set<string>>();
    columns.forEach(col => {
      const uniqueVals = new Set<string>();
      data.forEach(row => {
        const val = String(row[col] ?? "");
        if (val) uniqueVals.add(val);
      });
      values.set(col, uniqueVals);
    });
    return values;
  }, [columns, data]);

  const filteredValues = useMemo(() => {
    const vals = Array.from(columnValues.get(selectedColumn) || []);
    if (!searchTerm) return vals.sort();
    return vals.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [selectedColumn, columnValues, searchTerm]);

  const toggleValue = (column: string, value: string) => {
    setTempFilters(prev => {
      const current = prev[column] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      if (updated.length === 0) {
        const { [column]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [column]: updated };
    });
  };

  const selectAll = () => {
    setTempFilters(prev => ({
      ...prev,
      [selectedColumn]: filteredValues
    }));
  };

  const clearColumn = () => {
    setTempFilters(prev => {
      const { [selectedColumn]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleApply = () => {
    onApplyFilter(tempFilters);
    setOpen(false);
  };

  const clearAll = () => {
    setTempFilters({});
    onApplyFilter({});
  };

  const totalFilters = Object.values(activeFilters).reduce((sum, vals) => sum + vals.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {totalFilters > 0 && (
            <Badge variant="secondary" className="ml-1">{totalFilters}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Filter Data</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-[200px_1fr] gap-4 flex-1 min-h-0">
          {/* Column List */}
          <div className="border-r pr-4 flex flex-col min-h-0">
            <Label className="text-xs mb-2 flex-shrink-0">Columns</Label>
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-1 pr-2">
                {columns.map(col => {
                  const filterCount = tempFilters[col]?.length || 0;
                  return (
                    <Button
                      key={col}
                      variant={selectedColumn === col ? "secondary" : "ghost"}
                      className="w-full justify-between text-left"
                      size="sm"
                      onClick={() => {
                        setSelectedColumn(col);
                        setSearchTerm("");
                      }}
                    >
                      <span className="truncate">{col}</span>
                      {filterCount > 0 && (
                        <Badge variant="default" className="ml-2">{filterCount}</Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Values List */}
          <div className="flex flex-col min-h-0">
            <div className="flex-shrink-0 space-y-3 mb-3">
              <div>
                <Label className="text-xs mb-2 block">Values in "{selectedColumn}"</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All ({filteredValues.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clearColumn}>
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-3 min-h-0">
              <div className="space-y-2 pr-3">
                {filteredValues.map(value => {
                  const isChecked = tempFilters[selectedColumn]?.includes(value) || false;
                  return (
                    <div key={value} className="flex items-start space-x-2 py-1">
                      <Checkbox
                        id={`${selectedColumn}-${value}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleValue(selectedColumn, value)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`${selectedColumn}-${value}`}
                        className="text-sm cursor-pointer flex-1 leading-tight"
                      >
                        {value}
                      </label>
                    </div>
                  );
                })}
                {filteredValues.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No values found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t flex-shrink-0">
          <Button variant="ghost" onClick={clearAll}>Clear All Filters</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
