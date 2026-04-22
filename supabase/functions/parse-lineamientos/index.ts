import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres analista experto en lineamientos académicos de la Universidad Católica de Pereira (UCP).
Tu tarea es leer el PDF oficial de lineamientos del semestre y extraer TODAS las reglas cuantificables que rigen
la asignación de horas docentes y cargas académicas.

Para cada regla devuelve:
- category: una de "investigacion" | "administrativas" | "formacion"
  · "investigacion": investigadores principales, co-investigadores, sin proyecto, registros de investigación
  · "administrativas": cargos directivos, coordinaciones, comités, liderazgos, lecturas/asesorías de grado
  · "formacion": estudios de doctorado, maestría, formación pedagógica del docente
- rule_key: identificador único en snake_case (ej. "investigador_principal", "director_programa", "lider_colectivo")
- label: texto humano corto y claro de la regla (en español)
- hours: número de horas semanales asociadas (0 si no aplica)
- subjects: número de asignaturas, lecturas o proyectos asociados (0 si no aplica)
- source_article: artículo o sección de origen (ej. "Art. 6.a", "Art. 7")

Sé exhaustivo: extrae cada inciso, literal o tabla con valores numéricos. No inventes reglas que no estén en el PDF.`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "save_extracted_rules",
    description: "Guarda las reglas cuantificables extraídas del PDF de lineamientos",
    parameters: {
      type: "object",
      properties: {
        rules: {
          type: "array",
          description: "Lista de reglas extraídas del documento",
          items: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["investigacion", "administrativas", "formacion"] },
              rule_key: { type: "string", description: "snake_case identifier" },
              label: { type: "string" },
              hours: { type: "number" },
              subjects: { type: "number" },
              source_article: { type: "string" },
            },
            required: ["category", "rule_key", "label", "hours", "subjects", "source_article"],
            additionalProperties: false,
          },
        },
        summary: { type: "string", description: "Resumen ejecutivo en 2-3 frases del documento" },
      },
      required: ["rules", "summary"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath || typeof filePath !== "string") {
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY || !LOVABLE_API_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Download PDF from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("lineamientos")
      .download(filePath);
    if (dlErr || !fileData) {
      console.error("Download error:", dlErr);
      throw new Error(`Could not download PDF: ${dlErr?.message ?? "unknown"}`);
    }

    // Convert to base64 for multimodal request
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    const base64Pdf = btoa(binary);

    // Call Lovable AI Gateway (Gemini 2.5 Pro supports PDF as multimodal input)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza este PDF de lineamientos institucionales y extrae las reglas cuantificables.",
              },
              {
                type: "file",
                file: {
                  filename: "lineamientos.pdf",
                  file_data: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "save_extracted_rules" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados en Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("La IA no devolvió reglas extraídas");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const rules = Array.isArray(parsed.rules) ? parsed.rules : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    return new Response(JSON.stringify({ rules, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-lineamientos error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
