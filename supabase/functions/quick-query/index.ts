import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { schema, prompt, tableNames } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data query assistant. Given dataset schemas and a user's natural language query, return a JSON query configuration.

Available tables: ${JSON.stringify(tableNames)}
Schema per table: ${JSON.stringify(schema)}

Return ONLY a raw JSON object (no markdown, no explanation) with these fields:
- selectedTable: string (exact table name to query)
- columns: string[] (column names to include, empty array = all columns)
- conditions: array of {column: string, operator: string, value: string} where operator is one of: equals, not_equals, greater_than, less_than, greater_equal, less_equal, contains, starts_with, ends_with, is_empty, is_not_empty, between, in_list
- conditionLogic: "and" or "or" (default "and")
- groupBy: string[] (optional, column names)
- aggregations: array of {column: string, function: string} where function is: sum, average, count, count_distinct, min, max (optional)
- sortBy: array of {column: string, direction: "asc"|"desc"} (optional)
- limit: number (optional)
- distinct: boolean (optional)

Be smart about matching table names - the user might say "sales" when the table is "Sales_Data.csv". Match flexibly.
If the user asks for max, min, sum, avg of a column, use aggregations.
If the user asks to filter/find specific rows, use conditions.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the AI response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const queryConfig = JSON.parse(jsonMatch?.[0] || content);
      return new Response(JSON.stringify(queryConfig), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("quick-query error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
