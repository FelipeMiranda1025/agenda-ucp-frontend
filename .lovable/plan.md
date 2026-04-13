

# Plan: Reemplazar lista de botones por dropdown en sección "Docente"

## Resumen

Reemplazar la lista de botones interactivos en la sección "Docente" del sidebar izquierdo por un componente `Select` (dropdown) similar a los usados en los formularios.

## Cambios

### `src/components/AppSidebar.tsx`

- Importar `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` desde `@/components/ui/select`
- Reemplazar el bloque de botones (líneas 101-131) por un `Select` con:
  - `SelectTrigger` mostrando el nombre del docente seleccionado
  - `SelectItem` para cada docente en `docentesList` ("Yo" + subordinados)
  - `onValueChange` que busca el docente por id, ejecuta `setSelectedDocente`, y si no es "Yo", llama `loadFromAgendaView` con toast si no hay agenda
- Eliminar import de `User` icon (ya no se usa en la lista)

### Fix runtime error

- El error `useLanguage must be used within LanguageProvider` se investigará y corregirá si persiste (puede ser transitorio por HMR)

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AppSidebar.tsx` | Reemplazar botones por Select dropdown |

