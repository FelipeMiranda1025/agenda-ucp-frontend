

## Análisis

**Estado actual** — cuando un supervisor selecciona a un subordinado en `selectedDocente`, el sistema:
- Carga los registros del subordinado en `recordsByDocente[docenteId]`.
- `SubfunctionForm` sigue **completamente editable**: inputs, selects, botón "Limpiar", auto-upsert al llenar campos, eliminación desde el panel resumen, edición al hacer click en un registro.
- Solo el `SummaryPanel` cambia (muestra botones Aprobar/Retornar en vez de Confirmar).
- Resultado: un decano/director/vicerrector **puede modificar** la agenda del subordinado mientras la revisa. Esto rompe la regla.

**Regla nueva**: Ningún rol puede diligenciar agendas ajenas. Si `selectedDocente.firstName !== "Yo"` → toda la UI de la agenda pasa a **modo lectura**. Solo permanece habilitada la acción de **Aprobar / Retornar con observación** (ya existente en `SummaryPanel`).

**Alcance del bloqueo (modo lectura cuando se revisa subordinado):**

| Componente | Elemento | Acción |
|---|---|---|
| `SubfunctionForm` | Inputs de número, Selects, Combobox de asignaturas | `disabled` |
| `SubfunctionForm` | Botones "+" para agregar opción, "Pencil" para gestionar asignaturas/actividades | ocultos |
| `SubfunctionForm` | Botón "Limpiar" (Eraser) en header rojo | oculto |
| `SubfunctionForm` | `useEffect` de auto-upsert (línea ~338) | early-return si revisando subordinado |
| `SubfunctionForm` | Click sobre registro → `setEditingRecord` | sigue permitido (solo lleva al formulario, pero el form ya estará disabled) — preferimos **no** cargar `editingRecord` en modo lectura para evitar confusión |
| `SummaryPanel` | Botón papelera (Trash2) por registro | oculto |
| `SummaryPanel` | Click en registro → editar | desactivado (sin handler en modo lectura) |
| `SummaryPanel` | Input "horasSemestreDefecto" | `disabled` |
| `SummaryPanel` | Botón "Confirmar" | ya está oculto (se muestran Aprobar/Retornar) ✓ |
| `ScheduleBuilder` (`/schedule`) | Drag & drop de bloques, botón "Guardar horario" | bloqueado/oculto si revisando subordinado |
| `AgendaContext` | `addRecord`, `updateRecord`, `deleteRecord`, `upsertRecord`, `saveSchedule` | hard-guard: si `docenteId !== user.id` → no-op + warning en consola (defensa en profundidad) |

**Comentarios/observaciones**: la sección `AgendaComments` y el textarea de "Retornar" siguen activos — son los canales de comunicación permitidos por la regla.

## Diseño

### 1. Helper centralizado en `AgendaContext`
Exponer un booleano `isReadOnly` derivado: `selectedDocente && selectedDocente.id !== user?.id`. Así todos los componentes leen una sola fuente de verdad.

### 2. Hard-guard en mutaciones del context
En `addRecord`, `updateRecord`, `deleteRecord`, `upsertRecord`, `saveSchedule`: comparar `docenteId` con `user.id`; si no coincide, retornar sin mutar. Defensa contra bugs futuros.

### 3. `SubfunctionForm`
- Leer `isReadOnly` del context.
- Pasar `disabled={isReadOnly}` a Inputs/Selects/Combobox triggers.
- Ocultar botones "Limpiar", "+", "Pencil" cuando `isReadOnly`.
- En el `useEffect` de auto-upsert: `if (isReadOnly) return;`.
- En el `useEffect` que carga `editingRecord`: `if (isReadOnly) { setEditingRecord(null); return; }`.

### 4. `SummaryPanel`
- Leer `isReadOnly`.
- Ocultar botón papelera y handler de click-para-editar cuando `isReadOnly`.
- `disabled` en el input `horasSemestreDefecto`.

### 5. `ScheduleBuilder`
- Si `isReadOnly`: renderizar la grilla en modo solo-visualización (reutilizando lógica existente similar a `ScheduleReadOnlyView`) y ocultar botón "Guardar horario".

## Archivos

| Archivo | Cambio |
|---|---|
| `src/context/AgendaContext.tsx` | Exponer `isReadOnly` en el value del provider; añadir guards en `addRecord`/`updateRecord`/`deleteRecord`/`upsertRecord`/`saveSchedule` que abortan si `docenteId !== user.id` |
| `src/components/SubfunctionForm.tsx` | Consumir `isReadOnly`; aplicar `disabled` a Inputs/Selects/Combobox; ocultar botones Limpiar/"+"/Pencil; bloquear auto-upsert y la carga de `editingRecord` |
| `src/components/SummaryPanel.tsx` | Consumir `isReadOnly`; ocultar botón papelera y desactivar click-para-editar; `disabled` en input "horasSemestreDefecto" |
| `src/pages/ScheduleBuilder.tsx` | Si `isReadOnly`: renderizar versión solo lectura del horario y ocultar botón "Guardar horario" |

