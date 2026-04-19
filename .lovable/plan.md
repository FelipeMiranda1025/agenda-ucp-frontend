

## Análisis

Los roles supervisores (DirectorPrograma=2, DecanoFacultad=3, VicerrectorAcadémico=4) revisan agendas de subordinados con `isAgendaReadOnly=true`. Hoy:

1. **`SummaryPanel.handleRecordClick`** (línea 132): retorna temprano si `isAgendaReadOnly`, así que el clic no hace nada.
2. **`SubfunctionForm`** (línea 329-341): si `isAgendaReadOnly`, ignora `editingRecord` y limpia el estado.
3. **`SubfunctionForm`** ya tiene un useEffect de auto-upsert (línea 344-390) que retorna temprano cuando `isAgendaReadOnly`, así que cargar datos NO los va a guardar.
4. Los inputs `Input`/`Select`/`Combobox` no están deshabilitados globalmente cuando `isAgendaReadOnly`.

Necesito permitir el clic en modo solo lectura para **cargar** el registro en el formulario y mostrar todos los campos como **deshabilitados/no editables**, sin permitir guardar, eliminar ni limpiar.

## Cambios

### 1. `src/components/SummaryPanel.tsx`
- `handleRecordClick`: quitar el early-return cuando `isAgendaReadOnly`. Siempre setear `editingRecord` y hacer scroll al formulario.
- Cambiar la clase del `div` del registro para que siempre tenga `cursor-pointer hover:bg-accent/50` (no solo cuando es editable).
- Mantener oculto el botón de borrar (`Trash2`) en read-only.

### 2. `src/components/SubfunctionForm.tsx`
- **useEffect editingRecord (líneas 329-341)**: en lugar de limpiar `editingRecord` cuando `isAgendaReadOnly`, cargarlo igual en `formData` (sin asignar `editingRecordId` para no disparar updates). Limpiar `editingRecord` del context tras cargar.
- **Bloque `inputFields.map`**: cuando `isAgendaReadOnly`, forzar todos los campos a render de solo lectura (mismo `<div className="min-h-10 ...bg-muted...">` que ya se usa para `isReadOnly`). Es la forma más simple y consistente.
- **Botón "Limpiar campos"**: ya está oculto en read-only (línea 443) ✓.
- **No mostrar `editingRecordId` indicador**: pasar también `isAgendaReadOnly` al título de la card → mostrar `t("form.viewing")` (modo visualización) en vez de `t("form.editing")`.
- Añadir un banner sutil arriba del Card en read-only: "Modo lectura — Revisión de agenda".

### 3. `src/i18n/translations.ts`
- Añadir claves: `form.viewing` ("Visualizando registro" / "Viewing record"), `form.readOnlyBanner` ("Modo lectura — Revisión de agenda del docente" / "Read-only mode — Reviewing teacher's agenda").

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Permitir clic en registro aun en read-only; mantener botón borrar oculto |
| `src/components/SubfunctionForm.tsx` | Cargar `editingRecord` también en read-only (sin id de edición); renderizar todos los campos como solo lectura cuando `isAgendaReadOnly`; banner y título "Visualizando" |
| `src/i18n/translations.ts` | Claves ES/EN para `form.viewing` y `form.readOnlyBanner` |

