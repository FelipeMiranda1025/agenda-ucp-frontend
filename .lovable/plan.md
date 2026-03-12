

## Plan: Rediseño del layout principal

### Cambios

**1. `src/pages/Index.tsx`** — Eliminar sidebar izquierdo, header sticky, sección dinámica
- Quitar `SidebarProvider`, `AppSidebar`, `SidebarTrigger`
- Header sticky (`sticky top-0 z-50`) con:
  - Logo UCP en recuadro redondeado verde (reemplaza el SidebarTrigger)
  - Título "Sistema de Gestión de Agenda Docente"
  - Debajo del título: texto dinámico que muestra "Producción" o "Actividades diferentes a la docencia" según la sección visible (usar IntersectionObserver en las secciones)
  - Toggle dark mode + perfil dropdown (se mantienen)
- Layout: main scrollable a la izquierda + SummaryPanel fijo a la derecha
- Main area: solo scroll en los formularios apilados

**2. `src/components/SubfunctionForm.tsx`** — Simplificar formularios
- Eliminar botón "Agregar registro" — el registro se agrega automáticamente cuando todos los campos requeridos están llenos (detectar en onChange)
- Eliminar la tabla/card de resumen de registros debajo de cada formulario
- Los valores del formulario NO se limpian al agregar un registro (mantener `formData` persistente para edición in-place)
- Cuando se edita un campo, si ya hay un registro para ese formulario, actualizar el registro existente en vez de crear uno nuevo

**3. `src/components/SummaryPanel.tsx`** — Click en registro scrollea al formulario
- Al hacer click en un registro, hacer `scrollIntoView` al `section-{subfunctionId}` correspondiente (ya existe parcialmente, cambiar `setActiveSubfunction` por scroll directo)

**4. Selector de docente** — Mover al header o summary panel
- Como se elimina el sidebar izquierdo, mover el selector de docente de planta a la parte superior del SummaryPanel o al header

### Archivos a modificar
- `src/pages/Index.tsx` — layout sin sidebar, header sticky con logo y sección dinámica
- `src/components/SubfunctionForm.tsx` — auto-agregar registro, sin botón, sin tabla resumen, persistir valores
- `src/components/SummaryPanel.tsx` — click scrollea al formulario

