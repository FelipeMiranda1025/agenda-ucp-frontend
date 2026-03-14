

## Plan: Cambios en formularios y panel de resumen

### Cambios

#### 1. `src/components/SubfunctionForm.tsx` — Limpiar campos tras auto-guardar
- Después del `upsertRecord` exitoso (cuando todos los campos están llenos), **limpiar el formData** a `{}` y limpiar el `formDataStore[resolvedId]`.
- Cambiar la lógica de upsert: en vez de hacer upsert por clave primaria simple (primer string), usar una **clave compuesta** que incluya todos los campos dropdown. Para "docencia-directa" esto permite que la misma asignatura con diferente jornada sea un registro separado (ya que jornada es otro dropdown y será parte de la clave compuesta).

#### 2. `src/context/AgendaContext.tsx` — Cambiar lógica de matching en upsertRecord
- Modificar `upsertRecord` para que el match use **todos los valores string** del `data` (no solo el primero). Así, "Matemáticas + Diurna" y "Matemáticas + Nocturna" serán registros diferentes.
- Alternativa más limpia: cambiar a `addRecord` simple (siempre crea nuevo) ya que el formulario se limpia tras guardar y no se edita in-place desde el formulario.

#### 3. `src/components/SummaryPanel.tsx` — Click carga datos en formulario + botón borrar
- Al hacer click en un registro: scroll al formulario correspondiente **y cargar los datos del registro** en el `formDataStore` del formulario, luego forzar re-render.
- Agregar un **botón/icono de borrar** (Trash2) al lado de cada registro. Al click, llamar `deleteRecord(record.id)`.
- Necesitamos una forma de comunicar "cargar estos datos en el formulario". Opción: agregar al contexto `editingRecord: { subfunctionId: string, data: Record["data"] } | null` y `setEditingRecord`. El formulario escucha este estado y cuando cambia, carga los datos.

#### 4. `src/context/AgendaContext.tsx` — Agregar estado editingRecord
- Nuevo estado: `editingRecord` y `setEditingRecord` en el contexto.
- El formulario (`SubfunctionForm`) detecta cuando `editingRecord` tiene su `subfunctionId` y carga los datos en el formData local.

### Archivos a modificar
- `src/context/AgendaContext.tsx` — agregar `editingRecord`/`setEditingRecord`, ajustar upsert matching
- `src/components/SubfunctionForm.tsx` — limpiar campos tras guardar, escuchar `editingRecord`
- `src/components/SummaryPanel.tsx` — click en registro carga datos, agregar botón borrar

