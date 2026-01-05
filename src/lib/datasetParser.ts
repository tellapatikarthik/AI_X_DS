import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedDataset = {
  data: Record<string, any>[];
  columns: string[];
};

const normalizeHeader = (header: unknown) => {
  const base = String(header ?? "")
    .replace(/^\uFEFF/, "") // BOM
    .trim()
    .replace(/^"|"$/g, "")
    .normalize("NFKC")
    .replace(/\s+/g, " ");

  return base;
};

const uniqueify = (headers: string[]) => {
  const seen = new Map<string, number>();
  return headers.map((h, idx) => {
    const base = h || `Column ${idx + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
};

const coerceValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;

  const s = String(value).trim();
  if (!s) return "";

  // Handle common numeric formats like 1,234.56
  const normalized = s.replace(/,/g, "");
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const n = Number(normalized);
    if (!Number.isNaN(n)) return n;
  }

  return s;
};

export function applyColumnAliases(
  dataset: ParsedDataset,
  aliases: Record<string, string>
): ParsedDataset {
  const baseColumns = dataset.columns;
  const requested = baseColumns.map((col) => normalizeHeader(aliases[col] ?? col));
  const finalColumns = uniqueify(requested);

  const data = dataset.data.map((row) => {
    const out: Record<string, any> = {};
    baseColumns.forEach((baseCol, i) => {
      out[finalColumns[i]] = row[baseCol];
    });
    return out;
  });

  return { data, columns: finalColumns };
}

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) throw new Error("Excel file has no sheets");

    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    if (!rows.length) throw new Error("File is empty");

    const rawHeaders = (rows[0] ?? []).map((h) => normalizeHeader(h));
    const headers = uniqueify(rawHeaders);

    const data = rows.slice(1).filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
      .map((r) => {
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          row[header] = coerceValue(r[i]);
        });
        return row;
      });

    return { data, columns: headers };
  }

  if (ext === "csv" || ext === "tsv" || file.type === "text/csv") {
    const text = await file.text();

    const parsed = Papa.parse<Record<string, any>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: ext === "tsv" ? "\t" : undefined,
      transformHeader: (h) => h, // normalize ourselves for uniqueness
    });

    if (parsed.errors?.length) {
      const first = parsed.errors[0];
      throw new Error(first.message || "Failed to parse CSV");
    }

    const fields = parsed.meta.fields ?? Object.keys(parsed.data?.[0] ?? {});
    if (!fields.length) throw new Error("Could not detect columns");

    const normalizedFields = uniqueify(fields.map((f) => normalizeHeader(f)));
    const fieldMap = new Map<string, string>();
    fields.forEach((f, i) => fieldMap.set(f, normalizedFields[i]));

    const data = (parsed.data ?? []).map((row) => {
      const out: Record<string, any> = {};
      fields.forEach((f) => {
        out[fieldMap.get(f) as string] = coerceValue(row[f]);
      });
      return out;
    });

    return { data, columns: normalizedFields };
  }

  throw new Error("Unsupported file type. Please upload CSV or Excel (XLSX/XLS)." );
}
