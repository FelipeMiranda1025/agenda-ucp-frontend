

# Plan: Agregar sección "Docente" al menú lateral izquierdo

## Resumen

Mover el dropdown de selección de docente desde la parte inferior del sidebar (border-t) a una nueva sección dentro del área scrollable, al mismo nivel visual que "Producción", "Actividades diferentes" y "Horario de permanencia". El título será "Docente" con el mismo estilo uppercase.

## Cambios

### `src/components/AppSidebar.tsx`

- Eliminar el bloque inferior fijo (`div.p-4.border-t`) que contiene el dropdown de docentes (líneas 101-131)
- Agregar una nueva sección dentro del `div.flex-1.overflow-auto` (después de "Horario de permanencia") con:
  - Título "Docente" con el mismo estilo `font-semibold uppercase text-xs tracking-wider text-muted-foreground`
  - Debajo, una lista de botones con los nombres de cada docente subordinado y "Yo" (similar al estilo de los items de subfunciones)
  - Al hacer click en un nombre, se ejecuta la misma lógica actual: `setSelectedDocente(d)` + `loadFromAgendaView()` + toast si no hay agenda
  - El docente actualmente seleccionado se resaltará con el estilo `bg-accent`

### `src/i18n/translations.ts`

- Agregar clave `sidebar.docenteSection` con valor "Docente" / "Teacher"

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AppSidebar.tsx` | Reemplazar dropdown inferior por sección "Docente" en el área scrollable |
| `src/i18n/translations.ts` | Nueva clave de traducción |

