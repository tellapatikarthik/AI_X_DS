// Advanced query parser for complex natural language to SQL
export const parseNaturalQuery = (prompt: string, columns: string[]) => {
  const lower = prompt.toLowerCase().trim();
  
  // Initialize result
  const result: any = {
    selectedTable: 'data',
    columns: [],
    conditions: [],
    aggregations: [],
    groupBy: [],
    sortBy: [],
    limit: 0,
    distinct: false,
    conditionLogic: 'and',
  };
  
  // Helper: Find columns mentioned in text
  const findColumns = (text: string): string[] => {
    const found: string[] = [];
    for (const col of columns) {
      const colLower = col.toLowerCase();
      // Match exact word or part of phrase
      if (text.includes(colLower) || text.split(/\s+/).some(w => colLower.includes(w) || w.includes(colLower))) {
        found.push(col);
      }
    }
    return found;
  };
  
  // 1. DETECT SELECT COLUMNS - improved patterns
  const selectPatterns = [
    /(?:select|show|get|display|list|give me|find)\s+(?:only\s+)?([^where|from|order|group|limit|top|starts|ends|contains]+?)(?:\s+where|\s+from|\s+order|\s+group|\s+limit|\s+top|\s+starts|\s+ends|\s+contains|$)/i,
    /^([\w\s,]+?)(?:\s+where|\s+top|\s+starts|\s+ends|\s+contains)/i,
  ];
  
  for (const pattern of selectPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const selectPart = match[1].trim();
      const mentionedCols = findColumns(selectPart);
      if (mentionedCols.length > 0) {
        result.columns = mentionedCols;
        break;
      }
    }
  }
  
  // 2. DETECT WHERE CONDITIONS
  
  // Starts with - improved
  const startsPatterns = [
    /(\w+)\s+starts?\s+with\s+['\"]?([a-z0-9]+)['\"]?/i,
    /starts?\s+with\s+['\"]?([a-z0-9]+)['\"]?/i,
  ];
  for (const pattern of startsPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const colName = match.length > 2 ? match[1] : null;
      const value = match.length > 2 ? match[2] : match[1];
      const col = colName ? columns.find(c => c.toLowerCase() === colName.toLowerCase()) : findColumns(lower)[0];
      if (col) {
        result.conditions.push({ column: col, operator: 'starts_with', value });
        break;
      }
    }
  }
  
  // Ends with - improved
  const endsPatterns = [
    /(\w+)\s+ends?\s+with\s+['\"]?([a-z0-9]+)['\"]?/i,
    /ends?\s+with\s+['\"]?([a-z0-9]+)['\"]?/i,
  ];
  for (const pattern of endsPatterns) {
    const match = lower.match(pattern);
    if (match && !result.conditions.some(c => c.operator === 'starts_with')) {
      const colName = match.length > 2 ? match[1] : null;
      const value = match.length > 2 ? match[2] : match[1];
      const col = colName ? columns.find(c => c.toLowerCase() === colName.toLowerCase()) : findColumns(lower)[0];
      if (col) {
        result.conditions.push({ column: col, operator: 'ends_with', value });
        break;
      }
    }
  }
  
  // Contains
  const containsMatch = lower.match(/(\w+)\s+contains?\s+['\"]?([a-z0-9\s]+)['\"]?/i);
  if (containsMatch && result.conditions.length === 0) {
    const col = columns.find(c => c.toLowerCase() === containsMatch[1].toLowerCase()) || findColumns(lower)[0];
    if (col) {
      result.conditions.push({ column: col, operator: 'contains', value: containsMatch[2] });
    }
  }
  
  // Greater than
  const greaterMatches = [
    lower.match(/(\w+)\s+(?:greater than|>|more than|above)\s+([\d.]+)/i),
    lower.match(/where\s+(\w+)\s*>\s*([\d.]+)/i),
  ];
  for (const match of greaterMatches) {
    if (match) {
      const col = columns.find(c => c.toLowerCase() === match[1].toLowerCase());
      if (col) {
        result.conditions.push({ column: col, operator: 'greater_than', value: parseFloat(match[2]) });
        break;
      }
    }
  }
  
  // Less than
  const lessMatches = [
    lower.match(/(\w+)\s+(?:less than|<|below|under)\s+([\d.]+)/i),
    lower.match(/where\s+(\w+)\s*<\s*([\d.]+)/i),
  ];
  for (const match of lessMatches) {
    if (match) {
      const col = columns.find(c => c.toLowerCase() === match[1].toLowerCase());
      if (col) {
        result.conditions.push({ column: col, operator: 'less_than', value: parseFloat(match[2]) });
        break;
      }
    }
  }
  
  // Equals
  const equalsMatches = [
    lower.match(/(\w+)\s+(?:equals?|is|=)\s+['\"]?([a-z0-9\s]+)['\"]?/i),
    lower.match(/where\s+(\w+)\s*=\s*['\"]?([a-z0-9\s]+)['\"]?/i),
  ];
  for (const match of equalsMatches) {
    if (match && result.conditions.length === 0) {
      const col = columns.find(c => c.toLowerCase() === match[1].toLowerCase());
      if (col) {
        result.conditions.push({ column: col, operator: 'equals', value: match[2].trim() });
        break;
      }
    }
  }
  
  // Between
  const betweenMatch = lower.match(/(\w+)\s+between\s+([\d.]+)\s+and\s+([\d.]+)/i);
  if (betweenMatch) {
    const col = columns.find(c => c.toLowerCase() === betweenMatch[1].toLowerCase());
    if (col) {
      result.conditions.push({ column: col, operator: 'between', value: `${betweenMatch[2]},${betweenMatch[3]}` });
    }
  }
  
  // 3. DETECT AGGREGATIONS - improved
  const aggPatterns = [
    { regex: /\b(sum|total)\s+(?:of\s+)?(\w+)/i, func: 'sum' },
    { regex: /\b(count|number of|how many)\s+(?:of\s+)?(\w+)?/i, func: 'count' },
    { regex: /\b(average|avg|mean)\s+(?:of\s+)?(\w+)/i, func: 'average' },
    { regex: /\b(min|minimum|lowest)\s+(?:of\s+)?(\w+)/i, func: 'min' },
    { regex: /\b(max|maximum|highest)\s+(?:of\s+)?(\w+)/i, func: 'max' },
  ];
  
  for (const { regex, func } of aggPatterns) {
    const match = lower.match(regex);
    if (match) {
      const colName = match[2];
      const col = colName ? columns.find(c => c.toLowerCase() === colName.toLowerCase()) : findColumns(lower)[0] || columns[0];
      if (col) {
        result.aggregations.push({ function: func, column: col });
      }
      break;
    }
  }
  
  // 4. DETECT GROUP BY - improved
  const groupByPatterns = [
    /(?:group by|by|per|each|for each)\s+(\w+)/i,
    /by\s+(\w+)/i,
  ];
  
  if (result.aggregations.length > 0) {
    for (const pattern of groupByPatterns) {
      const match = lower.match(pattern);
      if (match) {
        const col = columns.find(c => c.toLowerCase() === match[1].toLowerCase());
        if (col && !result.groupBy.includes(col)) {
          result.groupBy.push(col);
          break;
        }
      }
    }
  }
  
  // 5. DETECT ORDER BY - improved
  const orderPatterns = [
    /order by\s+(\w+)\s+(asc|desc)/i,
    /sort by\s+(\w+)\s+(asc|desc)/i,
    /(\w+)\s+(ascending|descending)/i,
    /sorted by\s+(\w+)/i,
  ];
  
  for (const pattern of orderPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const col = columns.find(c => c.toLowerCase() === match[1].toLowerCase());
      if (col) {
        const dir = match[2] ? (match[2].toLowerCase().startsWith('asc') ? 'asc' : 'desc') : 'asc';
        result.sortBy.push({ column: col, direction: dir });
        break;
      }
    }
  }
  
  // Auto-detect sort from keywords
  if (result.sortBy.length === 0) {
    if (lower.match(/\b(top|highest|largest|biggest|maximum)\b/)) {
      // Find numeric column or use aggregation column
      const sortCol = result.aggregations.length > 0 
        ? result.aggregations[0].column 
        : columns.find(c => lower.includes(c.toLowerCase())) || columns[1] || columns[0];
      if (sortCol) {
        result.sortBy.push({ column: sortCol, direction: 'desc' });
      }
    } else if (lower.match(/\b(bottom|lowest|smallest|minimum)\b/)) {
      const sortCol = result.aggregations.length > 0 
        ? result.aggregations[0].column 
        : columns.find(c => lower.includes(c.toLowerCase())) || columns[1] || columns[0];
      if (sortCol) {
        result.sortBy.push({ column: sortCol, direction: 'asc' });
      }
    }
  }
  
  // 6. DETECT LIMIT - improved
  const limitPatterns = [
    /top\s+(\d+)/i,
    /limit\s+(\d+)/i,
    /first\s+(\d+)/i,
    /(\d+)\s+(?:countries|rows|records|items|results)/i,
  ];
  
  for (const pattern of limitPatterns) {
    const match = lower.match(pattern);
    if (match) {
      result.limit = parseInt(match[1]);
      break;
    }
  }
  
  // 7. DETECT DISTINCT
  result.distinct = lower.match(/\b(distinct|unique)\b/) !== null;
  
  // 8. Smart defaults
  // If no columns selected but has conditions/limit, select all
  if (result.columns.length === 0 && (result.conditions.length > 0 || result.limit > 0)) {
    result.columns = [...columns];
  }
  
  // If has aggregation but no group by, and columns selected, those are group by
  if (result.aggregations.length > 0 && result.groupBy.length === 0 && result.columns.length > 0) {
    result.groupBy = [...result.columns];
  }
  
  // If "all" or "everything" mentioned, select all columns
  if (lower.match(/\b(all|everything|entire|complete)\b/) && result.columns.length === 0) {
    result.columns = [...columns];
  }
  
  return result;
};
