

## Análisis

En `SubfunctionForm.tsx` (Docencia Directa), al seleccionar una asignatura el `useEffect` de auto-llenado (líneas 215-254) ejecuta `resolveSubjectRecord` que, cuando hay múltiples variantes, devuelve **el primer registro coincidente** y rellena automáticamente programa + facultad + semestre + nivel + horas.

El usuario quiere que, si la asignatura existe en **múltiples carreras profesionales** (`hasMultipleVariants === true`), el campo "programa" se quede vacío mostrando "Seleccionar..." (igual que jornada cuando está vacía), obligando al docente a elegir explícitamente la carrera. Si solo hay 1 variante, el comportamiento actual se mantiene (auto-llenado completo).

Lógicamente, hasta que el usuario elija un `programa`, los campos derivados de la carrera específica (facultad, semestre, nivel, horas, semanas) tampoco deben auto-llenarse, porque esa información depende de cuál variante se elija.

## Cambios

### `src/components/SubfunctionForm.tsx`

**Effect de auto-llenado por asignatura (líneas 215-254):**
- Detectar `hasMultipleVariants` (subjects.length > 1).
- Si hay múltiples variantes Y el usuario aún no eligió `programa` (o el `programa` actual no pertenece a las variantes filtradas):
  - **No** auto-rellenar `programa`, `facultad`, `semestre`, `nivel`, `horasSemana`, `cantidadSemanas`.
  - Limpiar esos campos para forzar selección manual (queda "Seleccionar...").
- Si hay 1 sola variante: comportamiento actual sin cambios.
- Si hay múltiples variantes Y el usuario ya eligió un `programa` válido: el effect existente de "programa change" (líneas 257-285) ya resuelve correctamente el resto.

**Combobox de asignatura (líneas ~528-535):** 
Ya limpia `facultad` y `programa` al cambiar asignatura (línea 532). Confirmado, no necesita cambio.

No se tocan otros archivos. El `Select` de programa ya muestra `t("form.select")` como placeholder cuando `formData["programa"]` está vacío (línea 656).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Modificar effect de auto-llenado por asignatura: cuando hay múltiples variantes y no hay programa elegido, dejar `programa` y campos derivados vacíos para mostrar "Seleccionar..." |

