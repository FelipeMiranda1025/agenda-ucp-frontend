
## Análisis

En `SubfunctionForm.tsx` (Docencia Directa), el campo `programa` actualmente usa un `Select` estándar (Radix) sin búsqueda. El usuario quiere convertirlo en un **Combobox con búsqueda por nombre**, igual que el campo de asignatura (que ya usa `cmdk` Command + Popover con `CommandInput`).

El campo asignatura usa el patrón:
- `Popover` + `PopoverTrigger` (botón con valor actual + chevron)
- `Command` + `CommandInput` (input de búsqueda)
- `CommandList` + `CommandEmpty` + `CommandGroup` + `CommandItem` (opciones filtradas)

Hay que replicar ese mismo patrón para el campo `programa`, manteniendo:
- El placeholder "Seleccionar..." cuando esté vacío.
- Los handlers `onValueChange` existentes (que disparan el effect de auto-llenado de facultad/semestre/nivel/horas).
- El estado `isReadOnly` / `isAgendaReadOnly` (sigue mostrando el div de solo lectura).
- El filtrado de opciones por variantes cuando hay múltiples carreras para la misma asignatura.

## Cambios

### `src/components/SubfunctionForm.tsx`
- Identificar el bloque `Select` del campo `programa` (≈línea 656).
- Reemplazarlo por un `Popover + Command` con `CommandInput` (búsqueda case-insensitive por `label`).
- Añadir un `useState` local `programaOpen` para controlar el popover (similar a `subjectOpen` que ya existe).
- Mantener todos los demás campos `Select` intactos (jornada, semestre, nivel, etc.).
- Conservar la lógica de filtrado actual de opciones de programa (las variantes).

No se modifican otros archivos. No hay cambios de i18n (se reutiliza `t("form.select")` y se puede añadir placeholder "Buscar programa..." reutilizando el patrón de asignatura o una clave existente).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Reemplazar el `Select` del campo `programa` por un Combobox `Popover + Command` con búsqueda por nombre, manteniendo handlers y estado read-only |
