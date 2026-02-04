export interface ColumnInfo {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "unknown";
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
}

export interface DatasetInfo {
  id: string;
  name: string;
  data: Record<string, any>[];
  columns: ColumnInfo[];
  rowCount: number;
  uploadedAt: string;
  fileSize?: number;
  relationships?: DatasetRelationship[];
}

export interface DatasetRelationship {
  targetDatasetId: string;
  sourceColumn: string;
  targetColumn: string;
  matchPercentage: number;
}

export interface QueryConfig {
  id?: string;
  name?: string;
  datasetIds: string[];
  concept: string;
  subConcept: string;
  columns: string[];
  conditions: QueryCondition[];
  groupBy?: string[];
  sortBy?: { column: string; direction: "asc" | "desc" }[];
  aggregations?: { column: string; function: AggregationFunction }[];
  combineConfig?: CombineConfig;
  savedAt?: string;
}

export interface QueryCondition {
  id: string;
  column: string;
  operator: ConditionOperator;
  value: any;
  value2?: any; // For range operations
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_equal"
  | "less_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "between"
  | "in_list";

export type AggregationFunction =
  | "sum"
  | "average"
  | "count"
  | "min"
  | "max"
  | "count_distinct";

export interface CombineConfig {
  type: "merge" | "match" | "link";
  sourceDatasetId: string;
  targetDatasetId: string;
  sourceColumn: string;
  targetColumn: string;
  joinType: "inner" | "left" | "right" | "full";
}

export interface QueryResult {
  data: Record<string, any>[];
  columns: string[];
  rowCount: number;
  summary?: ResultSummary;
  executedAt: string;
}

export interface ResultSummary {
  totalRows: number;
  metrics: { label: string; value: string | number; type: "count" | "sum" | "average" | "min" | "max" }[];
  insights: string[];
}

export interface Concept {
  id: string;
  name: string;
  icon: string;
  description: string;
  subConcepts: SubConcept[];
}

export interface SubConcept {
  id: string;
  name: string;
  description: string;
  requiredColumnTypes?: ("string" | "number" | "date")[];
  minColumns?: number;
  maxColumns?: number;
}

export const CONCEPTS: Concept[] = [
  {
    id: "filter",
    name: "Filter Data",
    icon: "Filter",
    description: "Find specific rows that match your criteria",
    subConcepts: [
      { id: "equals", name: "Equals", description: "Find exact matches" },
      { id: "not_equals", name: "Not Equals", description: "Exclude specific values" },
      { id: "range", name: "Range", description: "Find values between two limits" },
      { id: "contains", name: "Contains", description: "Find text that includes a word" },
      { id: "is_empty", name: "Is Empty/Not Empty", description: "Find blank or filled cells" },
    ],
  },
  {
    id: "sort",
    name: "Sort Data",
    icon: "ArrowUpDown",
    description: "Arrange your data in a specific order",
    subConcepts: [
      { id: "ascending", name: "Ascending (A→Z, 0→9)", description: "Smallest to largest" },
      { id: "descending", name: "Descending (Z→A, 9→0)", description: "Largest to smallest" },
      { id: "multi_sort", name: "Multiple Columns", description: "Sort by several columns" },
    ],
  },
  {
    id: "aggregate",
    name: "Aggregate Data",
    icon: "Calculator",
    description: "Calculate totals, averages, and counts",
    subConcepts: [
      { id: "sum", name: "Sum", description: "Add up all values", requiredColumnTypes: ["number"] },
      { id: "average", name: "Average", description: "Find the mean value", requiredColumnTypes: ["number"] },
      { id: "count", name: "Count", description: "Count the number of items" },
      { id: "min", name: "Minimum", description: "Find the smallest value", requiredColumnTypes: ["number"] },
      { id: "max", name: "Maximum", description: "Find the largest value", requiredColumnTypes: ["number"] },
    ],
  },
  {
    id: "group",
    name: "Group Data",
    icon: "Layers",
    description: "Organize data into categories",
    subConcepts: [
      { id: "by_column", name: "By Column", description: "Group by a specific column" },
      { id: "by_date", name: "By Date", description: "Group by day, month, or year", requiredColumnTypes: ["date"] },
      { id: "by_category", name: "By Category", description: "Group by text categories", requiredColumnTypes: ["string"] },
    ],
  },
  {
    id: "compare",
    name: "Compare Data",
    icon: "GitCompare",
    description: "Compare values across different groups",
    subConcepts: [
      { id: "side_by_side", name: "Side by Side", description: "Compare two columns directly" },
      { id: "percentage", name: "Percentage Difference", description: "Calculate percentage changes", requiredColumnTypes: ["number"] },
      { id: "ranking", name: "Ranking", description: "Rank items by a value", requiredColumnTypes: ["number"] },
    ],
  },
  {
    id: "time_analysis",
    name: "Time-Based Analysis",
    icon: "Calendar",
    description: "Analyze trends over time",
    subConcepts: [
      { id: "daily", name: "Daily Analysis", description: "View data by day", requiredColumnTypes: ["date"] },
      { id: "monthly", name: "Monthly Analysis", description: "View data by month", requiredColumnTypes: ["date"] },
      { id: "yearly", name: "Yearly Analysis", description: "View data by year", requiredColumnTypes: ["date"] },
      { id: "trend", name: "Trend Analysis", description: "Identify patterns over time", requiredColumnTypes: ["date", "number"] },
    ],
  },
  {
    id: "combine",
    name: "Combine Datasets",
    icon: "Merge",
    description: "Join multiple datasets together",
    subConcepts: [
      { id: "merge", name: "Merge", description: "Combine matching rows from two datasets" },
      { id: "match", name: "Match", description: "Find common values between datasets" },
      { id: "link", name: "Link", description: "Connect related data across datasets" },
    ],
  },
  {
    id: "summary",
    name: "Summary & Insights",
    icon: "Lightbulb",
    description: "Get quick overview and key metrics",
    subConcepts: [
      { id: "overview", name: "Data Overview", description: "Quick summary of your data" },
      { id: "statistics", name: "Statistics", description: "Key statistical measures" },
      { id: "distribution", name: "Distribution", description: "See how values are spread" },
    ],
  },
];
