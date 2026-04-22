

## Análisis

El Vicerrector no quiere editar regla por regla. Su flujo real es: subir el PDF de lineamientos del semestre y que el sistema **interprete el texto** y actualice automáticamente las reglas de recomendación. El PDF adjunto (Lineamientos 2025-2) contiene los Artículos 1-8 con reglas cuantificables claras: cargas horarias por rol/situación (10h, 13h, 16h, 6h, 5h, etc.), límites de trabajos de grado/lecturas (hasta 4), tiempos por actividad (Líder Colectivo 4h, Comité Curricular 3h, etc.) y equivalencias posgrado→pregrado.

La opción "Ajustes" debe **mantener todo lo actual** (tabs Investigación/Administrativas/Formación con edición manual, switch activo/inactivo, crear, restablecer) y **añadir un nuevo bloque superior** para subir el PDF e importar reglas automáticamente vía IA.

## Solución

### 1. Storage para los PDFs históricos
Crear bucket `lineamientos` (privado) para guardar cada PDF subido (auditoría/historial).

### 2. Tabla nueva `lineamientos_documents`
Registra cada subida: `id`, `semester_label`, `file_path`, `uploaded_by`, `uploaded_at`, `rules_extracted` (jsonb con las reglas que la IA extrajo), `applied` (bool). RLS abierta como las demás.

### 3. Edge Function `parse-lineamientos`
- Recibe `{ filePath }`.
- Descarga el PDF del bucket vía service role.
- Extrae texto (usa `pdfjs-dist` desde Deno o convierte a base64 y lo manda a Gemini directamente — Gemini 2.5 Pro acepta PDF como input multimodal, así que **se manda el PDF completo a `google/gemini-2.5-pro` vía Lovable AI Gateway** sin parser intermedio).
- Prompt de sistema: "Eres analista de lineamientos académicos UCP. Extrae las reglas cuantificables del PDF y devuélvelas como JSON estricto…" + schema de salida.
- Schema de tool calling:
  ```json
  {
    "rules": [
      {
        "category": "investigacion|administrativas|formacion",
        "rule_key": "string snake_case",
        "label": "Texto humano de la regla",
        "hours": number,
        "subjects": number,
        "source_article": "Art. 6.a"
      }
    ],
    "summary": "string"
  }
  ```
- Devuelve `{ rules, summary, raw_text? }`.
- Configurar `verify_jwt = false` en `supabase/config.toml` para que el cliente la invoque sin sesión Supabase (usamos auth local).

### 4. Hook `useLineamientosImport.ts`
- `useUploadLineamientos()`: sube PDF al bucket → invoca edge function → guarda fila en `lineamientos_documents` con `rules_extracted`.
- `useApplyExtractedRules()`: dada una lista de reglas extraídas, hace upsert en `recommendation_rules` (match por `rule_key`; crea si no existe, actualiza `hours`/`subjects`/`label` si existe). Marca `applied=true` en el documento.

### 5. UI — `SettingsDialog.tsx` rediseñado

Estructura nueva con dos secciones colapsables/separadas:

**Bloque A (NUEVO, arriba) — "Importar lineamientos desde PDF"**
- Visible solo para `rolId === 4` (Vicerrector).
- Dropzone + input file `accept=".pdf"` con drag-and-drop.
- Estado: `idle → uploading → parsing → preview → applied`.
- Botón "Procesar con IA" → llama edge function.
- **Vista previa**: tabla de reglas extraídas agrupadas por categoría con columnas `Etiqueta · Horas · #Asignaturas · Artículo fuente · ✓ aplicar`. Checkbox por fila para incluir/excluir.
- Botones: "Aplicar reglas seleccionadas" (ejecuta upsert masivo + invalida `recommendation_rules` para refrescar tabs inferiores) y "Descartar".
- Banner: "Última importación: <semester_label> · <fecha> · <usuario>" con link "Ver historial" → muestra `lineamientos_documents` ordenado desc.

**Bloque B (existente, abajo) — Tabs de edición manual**
- Mantiene tal cual: tabs Investigación/Administrativas/Formación, edición línea por línea, switch activo/inactivo, crear regla nueva, restablecer, guardar todo.
- Sin cambios funcionales.

### 6. Manejo del PDF de muestra
El PDF que adjuntaste se usa como **caso de prueba** del prompt: el sistema debe extraer al menos:
- Investigador principal → 10h docencia / 11h registro
- Co-investigador → 13h / 6h
- Sin proyecto → 16h
- Director programa/jefe departamento → 6h
- Director posgrado → 5h descarga / 9h registro
- Coordinación de área → 3h descarga / 6h registro
- Decanos/Vicerrector/Director Doctorado → 1 curso
- Formación doctorado → 8h / 15h registro
- Formación maestría → 12h / 7h registro
- Formación pedagógica → hasta 3h descarga
- Asesorías trabajo grado → hasta 4
- Lectura trabajos grado → hasta 4
- Líder Colectivo 4h, Participación Colectivo 2h, Comité Curricular 3h, Comité Básico Facultad 2h, Líder Grupo Investigación 4h, Líder Revista 2h
- Equivalencias posgrado: Especialización ×1.5, Maestría ×2.0, Doctorado ×2.5

### 7. i18n nuevas claves (`src/i18n/translations.ts`)

| key | ES | EN |
|---|---|---|
| `settings.importPdfTitle` | "Importar lineamientos (PDF)" | "Import guidelines (PDF)" |
| `settings.importPdfDesc` | "Sube el PDF oficial del semestre. La IA extraerá las reglas y podrás revisarlas antes de aplicar." | "Upload the official semester PDF. AI will extract rules for you to review before applying." |
| `settings.dropPdf` | "Arrastra el PDF aquí o haz clic para seleccionar" | "Drag the PDF here or click to select" |
| `settings.processWithAi` | "Procesar con IA" | "Process with AI" |
| `settings.processing` | "Analizando documento…" | "Analyzing document…" |
| `settings.extractedRules` | "Reglas extraídas" | "Extracted rules" |
| `settings.sourceArticle` | "Artículo fuente" | "Source article" |
| `settings.applySelected` | "Aplicar reglas seleccionadas" | "Apply selected rules" |
| `settings.appliedSuccess` | "Lineamientos aplicados correctamente" | "Guidelines applied successfully" |
| `settings.lastImport` | "Última importación" | "Last import" |
| `settings.viewHistory` | "Ver historial" | "View history" |
| `settings.importError` | "No se pudo procesar el PDF" | "Could not process the PDF" |
| `settings.notVicerrector` | "Solo el Vicerrector Académico puede importar lineamientos" | "Only the Academic Vice-Rector can import guidelines" |

### 8. Restricción de acceso
El bloque de importación solo aparece si `user.rolId === 4`. Para otros roles que abran "Ajustes" (no aplica hoy porque el item está restringido a Vicerrector en `Index.tsx`) se ocultaría también.

## Archivos

| Archivo | Cambio |
|---|---|
| `supabase/migrations/<timestamp>_lineamientos.sql` | Crear bucket `lineamientos` (privado) + políticas storage; crear tabla `lineamientos_documents` con RLS abierta |
| `supabase/functions/parse-lineamientos/index.ts` | **Nuevo** — recibe `filePath`, descarga del bucket, envía PDF a `google/gemini-2.5-pro` vía Lovable AI Gateway con tool-call schema, devuelve `{ rules, summary }` |
| `supabase/config.toml` | Añadir bloque `[functions.parse-lineamientos]` con `verify_jwt = false` |
| `src/hooks/useLineamientosImport.ts` | **Nuevo** — `useUploadLineamientos`, `useApplyExtractedRules`, `useLineamientosHistory` |
| `src/components/SettingsDialog.tsx` | Añadir bloque superior "Importar lineamientos PDF" (dropzone + preview + aplicar) **conservando** las tabs existentes intactas |
| `src/i18n/translations.ts` | Añadir las claves listadas en sección 7 (ES/EN) |

