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
  subConcept: string; // kept for backward compat
  subConcepts: string[];
  columns: string[];
  conditions: QueryCondition[];
  conditionLogic?: "and" | "or"; // Logical operator between conditions
  groupBy?: string[];
  sortBy?: { column: string; direction: "asc" | "desc" }[];
  aggregations?: { column: string; function: AggregationFunction }[];
  combineConfig?: CombineConfig;
  limit?: number;
  offset?: number;
  distinct?: boolean;
  having?: QueryCondition[];
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
  | "count_distinct"
  | "median"
  | "mode"
  | "variance"
  | "stddev";

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
  // === SELECTION & PROJECTION ===
  {
    id: "select",
    name: "Select Columns",
    icon: "Columns",
    description: "Choose which columns to display in results",
    subConcepts: [
      { id: "all", name: "Select All (*)", description: "Include all columns" },
      { id: "specific", name: "Specific Columns", description: "Choose only certain columns" },
      { id: "distinct", name: "Distinct/Unique", description: "Remove duplicate rows" },
      { id: "alias", name: "Rename Columns (AS)", description: "Give columns new names" },
      { id: "expression", name: "Calculated Fields", description: "Create new columns from calculations" },
    ],
  },
  // === FILTERING ===
  {
    id: "filter",
    name: "Filter Data (WHERE)",
    icon: "Filter",
    description: "Find specific rows that match your criteria",
    subConcepts: [
      { id: "equals", name: "Equals (=)", description: "Find exact matches" },
      { id: "not_equals", name: "Not Equals (<>)", description: "Exclude specific values" },
      { id: "greater_than", name: "Greater Than (>)", description: "Values above a threshold", requiredColumnTypes: ["number", "date"] },
      { id: "less_than", name: "Less Than (<)", description: "Values below a threshold", requiredColumnTypes: ["number", "date"] },
      { id: "range", name: "Between", description: "Find values within a range", requiredColumnTypes: ["number", "date"] },
      { id: "in_list", name: "In List (IN)", description: "Match any value in a list" },
      { id: "not_in_list", name: "Not In List (NOT IN)", description: "Exclude values in a list" },
      { id: "contains", name: "Contains (LIKE)", description: "Find text that includes a pattern" },
      { id: "starts_with", name: "Starts With", description: "Match beginning of text" },
      { id: "ends_with", name: "Ends With", description: "Match end of text" },
      { id: "is_null", name: "Is Null", description: "Find empty/missing values" },
      { id: "is_not_null", name: "Is Not Null", description: "Find non-empty values" },
    ],
  },
  // === LOGICAL OPERATORS ===
  {
    id: "logical",
    name: "Logical Operators",
    icon: "Binary",
    description: "Combine multiple conditions with AND, OR, NOT",
    subConcepts: [
      { id: "and", name: "AND", description: "All conditions must be true" },
      { id: "or", name: "OR", description: "Any condition can be true" },
      { id: "not", name: "NOT", description: "Reverse the condition result" },
      { id: "complex", name: "Complex Logic", description: "Combine AND, OR with parentheses" },
    ],
  },
  // === SORTING ===
  {
    id: "sort",
    name: "Sort Data (ORDER BY)",
    icon: "ArrowUpDown",
    description: "Arrange your data in a specific order",
    subConcepts: [
      { id: "ascending", name: "Ascending (ASC)", description: "A→Z, 0→9, oldest first" },
      { id: "descending", name: "Descending (DESC)", description: "Z→A, 9→0, newest first" },
      { id: "multi_sort", name: "Multiple Columns", description: "Sort by several columns" },
      { id: "nulls_first", name: "Nulls First", description: "Put empty values at the top" },
      { id: "nulls_last", name: "Nulls Last", description: "Put empty values at the bottom" },
    ],
  },
  // === AGGREGATION ===
  {
    id: "aggregate",
    name: "Aggregate Functions",
    icon: "Calculator",
    description: "Calculate totals, averages, counts, and statistics",
    subConcepts: [
      { id: "count", name: "COUNT", description: "Count the number of rows" },
      { id: "count_distinct", name: "COUNT DISTINCT", description: "Count unique values" },
      { id: "sum", name: "SUM", description: "Add up all values", requiredColumnTypes: ["number"] },
      { id: "average", name: "AVG", description: "Calculate the mean", requiredColumnTypes: ["number"] },
      { id: "min", name: "MIN", description: "Find the smallest value", requiredColumnTypes: ["number"] },
      { id: "max", name: "MAX", description: "Find the largest value", requiredColumnTypes: ["number"] },
      { id: "median", name: "MEDIAN", description: "Find the middle value", requiredColumnTypes: ["number"] },
      { id: "mode", name: "MODE", description: "Find the most common value" },
      { id: "variance", name: "VARIANCE", description: "Measure data spread", requiredColumnTypes: ["number"] },
      { id: "stddev", name: "STD DEV", description: "Standard deviation", requiredColumnTypes: ["number"] },
    ],
  },
  // === GROUPING ===
  {
    id: "group",
    name: "Group Data (GROUP BY)",
    icon: "Layers",
    description: "Organize data into categories for aggregation",
    subConcepts: [
      { id: "by_column", name: "By Column", description: "Group by a specific column" },
      { id: "by_multiple", name: "Multiple Columns", description: "Group by several columns" },
      { id: "by_date", name: "By Date Parts", description: "Group by day, month, year", requiredColumnTypes: ["date"] },
      { id: "by_range", name: "By Range/Buckets", description: "Group numbers into ranges", requiredColumnTypes: ["number"] },
      { id: "having", name: "HAVING Clause", description: "Filter groups after aggregation" },
    ],
  },
  // === JOINS ===
  {
    id: "join",
    name: "Join Datasets",
    icon: "Merge",
    description: "Combine data from multiple tables/datasets",
    subConcepts: [
      { id: "inner", name: "INNER JOIN", description: "Only matching rows from both" },
      { id: "left", name: "LEFT JOIN", description: "All from left, matching from right" },
      { id: "right", name: "RIGHT JOIN", description: "All from right, matching from left" },
      { id: "full", name: "FULL OUTER JOIN", description: "All rows from both datasets" },
      { id: "cross", name: "CROSS JOIN", description: "Every combination of rows" },
      { id: "self", name: "SELF JOIN", description: "Join a table to itself" },
    ],
  },
  // === SET OPERATIONS ===
  {
    id: "set_operations",
    name: "Set Operations",
    icon: "Combine",
    description: "Combine results from multiple queries",
    subConcepts: [
      { id: "union", name: "UNION", description: "Combine unique rows from queries" },
      { id: "union_all", name: "UNION ALL", description: "Combine all rows including duplicates" },
      { id: "intersect", name: "INTERSECT", description: "Only rows in both queries" },
      { id: "except", name: "EXCEPT/MINUS", description: "Rows in first but not second" },
    ],
  },
  // === SUBQUERIES ===
  {
    id: "subquery",
    name: "Subqueries",
    icon: "Braces",
    description: "Use query results within another query",
    subConcepts: [
      { id: "scalar", name: "Scalar Subquery", description: "Returns a single value" },
      { id: "row", name: "Row Subquery", description: "Returns a single row" },
      { id: "table", name: "Table Subquery", description: "Returns a table of results" },
      { id: "exists", name: "EXISTS", description: "Check if subquery returns rows" },
      { id: "in_subquery", name: "IN (Subquery)", description: "Filter using subquery results" },
    ],
  },
  // === STRING FUNCTIONS ===
  {
    id: "string_functions",
    name: "String Functions",
    icon: "Type",
    description: "Manipulate and transform text data",
    subConcepts: [
      { id: "concat", name: "CONCAT", description: "Combine text values", requiredColumnTypes: ["string"] },
      { id: "substring", name: "SUBSTRING", description: "Extract part of text", requiredColumnTypes: ["string"] },
      { id: "upper_lower", name: "UPPER/LOWER", description: "Change text case", requiredColumnTypes: ["string"] },
      { id: "trim", name: "TRIM", description: "Remove spaces", requiredColumnTypes: ["string"] },
      { id: "replace", name: "REPLACE", description: "Replace text patterns", requiredColumnTypes: ["string"] },
      { id: "length", name: "LENGTH", description: "Get text length", requiredColumnTypes: ["string"] },
      { id: "split", name: "SPLIT", description: "Split text into parts", requiredColumnTypes: ["string"] },
    ],
  },
  // === DATE FUNCTIONS ===
  {
    id: "date_functions",
    name: "Date Functions",
    icon: "Calendar",
    description: "Work with date and time data",
    subConcepts: [
      { id: "extract", name: "EXTRACT", description: "Get year, month, day, etc.", requiredColumnTypes: ["date"] },
      { id: "date_add", name: "DATE ADD", description: "Add time to a date", requiredColumnTypes: ["date"] },
      { id: "date_diff", name: "DATE DIFF", description: "Calculate time between dates", requiredColumnTypes: ["date"] },
      { id: "format", name: "FORMAT DATE", description: "Change date display format", requiredColumnTypes: ["date"] },
      { id: "current", name: "Current Date/Time", description: "Get today's date or current time" },
      { id: "truncate", name: "TRUNCATE", description: "Round to day, month, year", requiredColumnTypes: ["date"] },
    ],
  },
  // === NUMERIC FUNCTIONS ===
  {
    id: "numeric_functions",
    name: "Numeric Functions",
    icon: "Hash",
    description: "Mathematical operations on numbers",
    subConcepts: [
      { id: "round", name: "ROUND", description: "Round to decimal places", requiredColumnTypes: ["number"] },
      { id: "ceiling_floor", name: "CEILING/FLOOR", description: "Round up or down", requiredColumnTypes: ["number"] },
      { id: "abs", name: "ABS", description: "Absolute value", requiredColumnTypes: ["number"] },
      { id: "mod", name: "MOD/Modulo", description: "Remainder after division", requiredColumnTypes: ["number"] },
      { id: "power", name: "POWER", description: "Raise to a power", requiredColumnTypes: ["number"] },
      { id: "sqrt", name: "SQRT", description: "Square root", requiredColumnTypes: ["number"] },
      { id: "arithmetic", name: "Arithmetic (+−×÷)", description: "Basic math operations", requiredColumnTypes: ["number"] },
    ],
  },
  // === CONDITIONAL LOGIC ===
  {
    id: "conditional",
    name: "Conditional Logic",
    icon: "GitBranch",
    description: "Create if-then-else logic in queries",
    subConcepts: [
      { id: "case_when", name: "CASE WHEN", description: "If-then-else conditions" },
      { id: "coalesce", name: "COALESCE", description: "Return first non-null value" },
      { id: "nullif", name: "NULLIF", description: "Return null if values match" },
      { id: "ifnull", name: "IFNULL/NVL", description: "Replace null with default" },
      { id: "iif", name: "IIF", description: "Simple if condition" },
    ],
  },
  // === WINDOW FUNCTIONS ===
  {
    id: "window",
    name: "Window Functions",
    icon: "LayoutGrid",
    description: "Calculations across related rows",
    subConcepts: [
      { id: "row_number", name: "ROW_NUMBER", description: "Assign sequential numbers" },
      { id: "rank", name: "RANK", description: "Rank with gaps for ties", requiredColumnTypes: ["number"] },
      { id: "dense_rank", name: "DENSE_RANK", description: "Rank without gaps", requiredColumnTypes: ["number"] },
      { id: "ntile", name: "NTILE", description: "Divide into equal groups" },
      { id: "lag_lead", name: "LAG/LEAD", description: "Access previous/next row" },
      { id: "first_last", name: "FIRST/LAST", description: "First or last value in group" },
      { id: "running_total", name: "Running Total", description: "Cumulative sum", requiredColumnTypes: ["number"] },
      { id: "moving_avg", name: "Moving Average", description: "Average over a window", requiredColumnTypes: ["number"] },
    ],
  },
  // === LIMITING RESULTS ===
  {
    id: "limit",
    name: "Limit Results",
    icon: "ListEnd",
    description: "Control how many rows are returned",
    subConcepts: [
      { id: "top_n", name: "TOP N / LIMIT", description: "Return first N rows" },
      { id: "offset", name: "OFFSET", description: "Skip first N rows" },
      { id: "pagination", name: "Pagination", description: "Page through results" },
      { id: "sample", name: "SAMPLE/TABLESAMPLE", description: "Random sample of rows" },
      { id: "percent", name: "TOP PERCENT", description: "Return percentage of rows" },
    ],
  },
  // === DATA MODIFICATION ===
  {
    id: "modify",
    name: "Data Modification",
    icon: "Edit",
    description: "Insert, update, or delete data",
    subConcepts: [
      { id: "insert", name: "INSERT", description: "Add new rows" },
      { id: "update", name: "UPDATE", description: "Modify existing rows" },
      { id: "delete", name: "DELETE", description: "Remove rows" },
      { id: "upsert", name: "UPSERT/MERGE", description: "Insert or update" },
      { id: "truncate", name: "TRUNCATE", description: "Remove all rows quickly" },
    ],
  },
  // === DATA TYPES & CONVERSION ===
  {
    id: "type_conversion",
    name: "Type Conversion",
    icon: "ArrowLeftRight",
    description: "Convert data between types",
    subConcepts: [
      { id: "cast", name: "CAST", description: "Convert to different type" },
      { id: "convert", name: "CONVERT", description: "Change data format" },
      { id: "to_number", name: "To Number", description: "Text to number" },
      { id: "to_date", name: "To Date", description: "Text to date" },
      { id: "to_string", name: "To String", description: "Convert to text" },
    ],
  },
  // === NULL HANDLING ===
  {
    id: "null_handling",
    name: "Null Handling",
    icon: "CircleSlash",
    description: "Work with missing/null values",
    subConcepts: [
      { id: "is_null", name: "IS NULL", description: "Check for null values" },
      { id: "is_not_null", name: "IS NOT NULL", description: "Check for non-null" },
      { id: "coalesce", name: "COALESCE", description: "Replace null with default" },
      { id: "nullif", name: "NULLIF", description: "Set to null conditionally" },
      { id: "fill_null", name: "Fill Null Values", description: "Replace nulls with values" },
    ],
  },
  // === COMPARISON & ANALYSIS ===
  {
    id: "compare",
    name: "Compare Data",
    icon: "GitCompare",
    description: "Compare values across different groups",
    subConcepts: [
      { id: "side_by_side", name: "Side by Side", description: "Compare two columns" },
      { id: "percentage", name: "Percentage Change", description: "Calculate % difference", requiredColumnTypes: ["number"] },
      { id: "ranking", name: "Ranking", description: "Rank items by value", requiredColumnTypes: ["number"] },
      { id: "variance_analysis", name: "Variance Analysis", description: "Compare to baseline", requiredColumnTypes: ["number"] },
      { id: "top_bottom", name: "Top/Bottom N", description: "Highest and lowest values" },
    ],
  },
  // === TIME SERIES ===
  {
    id: "time_analysis",
    name: "Time-Based Analysis",
    icon: "TrendingUp",
    description: "Analyze trends and patterns over time",
    subConcepts: [
      { id: "daily", name: "Daily Analysis", description: "View data by day", requiredColumnTypes: ["date"] },
      { id: "weekly", name: "Weekly Analysis", description: "View data by week", requiredColumnTypes: ["date"] },
      { id: "monthly", name: "Monthly Analysis", description: "View data by month", requiredColumnTypes: ["date"] },
      { id: "quarterly", name: "Quarterly Analysis", description: "View data by quarter", requiredColumnTypes: ["date"] },
      { id: "yearly", name: "Yearly Analysis", description: "View data by year", requiredColumnTypes: ["date"] },
      { id: "trend", name: "Trend Analysis", description: "Identify patterns", requiredColumnTypes: ["date", "number"] },
      { id: "yoy", name: "Year-over-Year", description: "Compare to same period last year", requiredColumnTypes: ["date", "number"] },
      { id: "mom", name: "Month-over-Month", description: "Compare to previous month", requiredColumnTypes: ["date", "number"] },
    ],
  },
  // === SUMMARY & INSIGHTS ===
  {
    id: "summary",
    name: "Summary & Insights",
    icon: "Lightbulb",
    description: "Get quick overview and key metrics",
    subConcepts: [
      { id: "overview", name: "Data Overview", description: "Quick summary of your data" },
      { id: "statistics", name: "Descriptive Stats", description: "Mean, median, mode, etc." },
      { id: "distribution", name: "Distribution", description: "See how values are spread" },
      { id: "outliers", name: "Outlier Detection", description: "Find unusual values" },
      { id: "correlation", name: "Correlation", description: "Find related columns", requiredColumnTypes: ["number"] },
    ],
  },
  // === TRANSACTIONS & ACID ===
  {
    id: "transactions",
    name: "Transactions (ACID)",
    icon: "Shield",
    description: "Ensure data integrity with ACID properties",
    subConcepts: [
      { id: "begin", name: "BEGIN TRANSACTION", description: "Start a transaction" },
      { id: "commit", name: "COMMIT", description: "Save all changes" },
      { id: "rollback", name: "ROLLBACK", description: "Undo all changes" },
      { id: "savepoint", name: "SAVEPOINT", description: "Create restore point" },
      { id: "atomicity", name: "Atomicity", description: "All-or-nothing execution" },
      { id: "consistency", name: "Consistency", description: "Data stays valid" },
      { id: "isolation", name: "Isolation", description: "Transactions don't interfere" },
      { id: "durability", name: "Durability", description: "Changes are permanent" },
    ],
  },
  // === CONSTRAINTS & VALIDATION ===
  {
    id: "constraints",
    name: "Constraints",
    icon: "Lock",
    description: "Define rules for data validity",
    subConcepts: [
      { id: "primary_key", name: "PRIMARY KEY", description: "Unique identifier for rows" },
      { id: "foreign_key", name: "FOREIGN KEY", description: "Link to another table" },
      { id: "unique", name: "UNIQUE", description: "No duplicate values" },
      { id: "not_null", name: "NOT NULL", description: "Value required" },
      { id: "check", name: "CHECK", description: "Custom validation rule" },
      { id: "default", name: "DEFAULT", description: "Auto-fill value" },
    ],
  },
  // === INDEXES & PERFORMANCE ===
  {
    id: "performance",
    name: "Performance",
    icon: "Zap",
    description: "Optimize query speed",
    subConcepts: [
      { id: "index", name: "INDEX", description: "Speed up searches" },
      { id: "explain", name: "EXPLAIN", description: "View query execution plan" },
      { id: "optimize", name: "OPTIMIZE", description: "Improve table performance" },
      { id: "partition", name: "PARTITION", description: "Divide large tables" },
    ],
  },
];
