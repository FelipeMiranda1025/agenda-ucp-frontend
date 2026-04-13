

# Plan: Mostrar nombre del docente seleccionado en formularios y resumen

## Resumen

Tres cambios:
1. En los formularios y el panel "Resumen de Datos", cuando se está revisando la agenda de un subordinado, mostrar el nombre del docente autor de la agenda en lugar del usuario logueado
2. En el sidebar izquierdo debajo de "DOCENTE DE PLANTA", mostrar la lista de subordinados con sus nombres
3. Al cambiar el docente seleccionado en el dropdown, cargar automáticamente su agenda pendiente

## Cambios

### 1. Mostrar nombre del docente seleccionado en formularios y resumen

**Archivos:** `src/components/SubfunctionForm.tsx`, `src/components/SummaryPanel.tsx`

- Importar `useAgenda` para obtener `selectedDocente`
- Cuando `selectedDocente` no es "Yo" (es decir, `selectedDocente.firstName !== "Yo"`), mostrar el nombre del docente seleccionado (`selectedDocente.firstName secondName firstLastName`) en lugar de `user.firstName user.firstLastName`
- Cuando es "Yo", seguir mostrando el nombre del usuario logueado como actualmente
- Afecta ~4 lugares en `SubfunctionForm.tsx` (líneas 39, 62, 430 y la sección de schedule) y 1 lugar en `SummaryPanel.tsx` (línea 101)

### 2. Lista de docentes en sidebar izquierdo (ya existe)

**Archivo:** `src/components/AppSidebar.tsx`

- El dropdown ya existe con "Yo" + subordinados. Verificar que se muestra correctamente debajo de "DOCENTE DE PLANTA" con los nombres completos de los subordinados

### 3. Carga automática al cambiar docente (ya existe)

**Archivo:** `src/context/AgendaContext.tsx`

- Ya hay un `useEffect` en línea 271-278 que carga `loadFromAgendaView` al cambiar `docenteId`. Verificar que funciona correctamente
- Ya existe el toast en `AppSidebar.tsx` cuando no hay agenda

## Detalle técnico

Crear un helper reutilizable para obtener el nombre a mostrar:

```typescript
// En cada componente que lo necesite:
const displayName = selectedDocente && selectedDocente.firstName !== "Yo"
  ? [selectedDocente.firstName, selectedDocente.secondName, selectedDocente.firstLastName].filter(Boolean).join(' ')
  : [user?.firstName, user?.firstLastName].filter(Boolean).join(' ');
```

Reemplazar todas las instancias de `{[user.firstName, user.firstLastName].filter(Boolean).join(' ')}` con `{displayName}`.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Usar nombre del docente seleccionado en ~4 encabezados de formulario |
| `src/components/SummaryPanel.tsx` | Usar nombre del docente seleccionado en encabezado del panel |

