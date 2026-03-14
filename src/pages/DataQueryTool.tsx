import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import DatasetManager from "@/components/query-tool/DatasetManager";
import ConceptSelector from "@/components/query-tool/ConceptSelector";
import QueryBuilder from "@/components/query-tool/QueryBuilder";
import ResultsViewer, { NamedResult } from "@/components/query-tool/ResultsViewer";
import SavedQueries from "@/components/query-tool/SavedQueries";
import { ParsedDataset } from "@/lib/datasetParser";
import { QueryConfig, QueryResult, DatasetInfo, CONCEPTS } from "@/types/queryTool";
import { saveDatasetToHistory } from "@/components/analytics/DatasetHistory";

const DataQueryTool = () => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedSubConcepts, setSelectedSubConcepts] = useState<string[]>([]);
  const [queryConfig, setQueryConfig] = useState<QueryConfig | null>(null);
  const [queryResults, setQueryResults] = useState<NamedResult[]>([]);
  const [step, setStep] = useState<number>(1);

  // Load saved datasets from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("queryToolDatasets");
    if (saved) {
      try {
        setDatasets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load datasets:", e);
      }
    }
  }, []);

  // Save datasets to sessionStorage
  useEffect(() => {
    if (datasets.length > 0) {
      sessionStorage.setItem("queryToolDatasets", JSON.stringify(datasets));
    }
  }, [datasets]);

  const handleDatasetAdd = (dataset: DatasetInfo) => {
    setDatasets((prev) => [...prev, dataset]);
    saveDatasetToHistory(dataset.name, dataset.data, dataset.columns.map(c => c.name), "query-tool");
  };

  const handleDatasetRemove = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    setSelectedDatasets((prev) => prev.filter((sid) => sid !== id));
  };

  const handleDatasetUpdate = (datasetId: string, newData: Record<string, any>[], newColumns?: any[]) => {
    setDatasets((prev) =>
      prev.map((d) => {
        if (d.id !== datasetId) return d;
        return {
          ...d,
          data: newData,
          rowCount: newData.length,
          ...(newColumns ? { columns: newColumns } : {}),
        };
      })
    );
  };

  const handleDatasetSelect = (id: string) => {
    setSelectedDatasets((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleConceptSelect = (concept: string) => {
    setSelectedConcept(concept);
    setSelectedSubConcepts([]);
    setQueryConfig(null);
    setStep(3);
  };

  const handleSubConceptToggle = (subConcept: string) => {
    setSelectedSubConcepts((prev) => {
      const updated = prev.includes(subConcept)
        ? prev.filter((s) => s !== subConcept)
        : [...prev, subConcept];
      if (updated.length > 0) setStep(4);
      return updated;
    });
  };

  const handleSubConceptsProceed = () => {
    if (selectedSubConcepts.length > 0) setStep(4);
  };

  const handleQueryExecute = (result: QueryResult) => {
    // Get concept label
    const conceptDef = CONCEPTS.find((c) => c.id === selectedConcept);
    const label = conceptDef?.name || selectedConcept || "Query";

    // Append to results list so user can accumulate multiple tables
    setQueryResults((prev) => [...prev, { label, result }]);
    setStep(5);
  };

  const handleSavedQueryLoad = (config: QueryConfig) => {
    setSelectedDatasets(config.datasetIds);
    setSelectedConcept(config.concept);
    setSelectedSubConcepts(config.subConcepts || [config.subConcept]);
    setQueryConfig(config);
    setStep(4);
  };

  const resetQuery = () => {
    setSelectedConcept(null);
    setSelectedSubConcepts([]);
    setQueryConfig(null);
    setQueryResults([]);
    setStep(selectedDatasets.length > 0 ? 2 : 1);
  };

  const addAnotherQuery = () => {
    setSelectedConcept(null);
    setSelectedSubConcepts([]);
    setQueryConfig(null);
    setStep(2);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Upload & Manage Datasets";
      case 2:
        return "Choose a Concept";
      case 3:
        return "Choose a Sub-Concept";
      case 4:
        return "Configure Your Query";
      case 5:
        return "View Results";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <Link to="/data-upload">Back</Link>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Database className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Data Query Tool
                </span>
              </div>
            </div>
            <SavedQueries onLoadQuery={handleSavedQueryLoad} />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-card/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { num: 1, label: "Upload Data" },
              { num: 2, label: "Select Concept" },
              { num: 3, label: "Sub-Concept" },
              { num: 4, label: "Configure" },
              { num: 5, label: "Results" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 4 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      step > s.num ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{getStepTitle()}</h2>
            <div className="flex gap-2">
              {step === 5 && (
                <Button variant="default" size="sm" onClick={addAnotherQuery} className="gap-1">
                  + Add Another Query
                </Button>
              )}
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={resetQuery}>
                  Start Over
                </Button>
              )}
            </div>
          </div>

          {/* Step 1: Dataset Manager */}
          <DatasetManager
            datasets={datasets}
            selectedDatasets={selectedDatasets}
            onDatasetAdd={handleDatasetAdd}
            onDatasetRemove={handleDatasetRemove}
            onDatasetSelect={handleDatasetSelect}
            onProceed={() => setStep(2)}
            isActive={step === 1}
          />

          {/* Step 2 & 3: Concept Selector */}
          {step >= 2 && selectedDatasets.length > 0 && (
            <ConceptSelector
              selectedConcept={selectedConcept}
              selectedSubConcepts={selectedSubConcepts}
              onConceptSelect={handleConceptSelect}
              onSubConceptToggle={handleSubConceptToggle}
              onSubConceptsProceed={handleSubConceptsProceed}
              datasets={datasets.filter((d) => selectedDatasets.includes(d.id))}
              isActive={step === 2 || step === 3}
            />
          )}

          {/* Step 4: Query Builder */}
          {step >= 4 && selectedConcept && selectedSubConcepts.length > 0 && (
            <QueryBuilder
              datasets={datasets.filter((d) => selectedDatasets.includes(d.id))}
              concept={selectedConcept}
              subConcepts={selectedSubConcepts}
              initialConfig={queryConfig}
              onExecute={handleQueryExecute}
              onConfigChange={setQueryConfig}
              onDatasetUpdate={handleDatasetUpdate}
              onDatasetCreate={handleDatasetAdd}
              onDatasetDelete={handleDatasetRemove}
              isActive={step === 4}
            />
          )}

          {/* Step 5: Results Viewer - shows all accumulated result tables */}
          {queryResults.length > 0 && (
            <ResultsViewer
              results={queryResults}
              config={queryConfig || { datasetIds: [], concept: "", subConcept: "", subConcepts: [], columns: [], conditions: [] }}
              datasets={datasets.filter((d) => selectedDatasets.includes(d.id))}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            Build queries by clicking - no coding required
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DataQueryTool;
