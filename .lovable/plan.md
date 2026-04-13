

# Plan: Notificaciones clickeables, dropdown de docentes subordinados y carga de registros

## Resumen

Tres cambios principales:
1. Al hacer click en una notificación de agenda pendiente, cargar los registros del docente en el panel derecho (Resumen de Datos)
2. En el sidebar izquierdo, reemplazar el dropdown de docentes con uno dinámico que muestre "Yo" + los docentes subordinados (para el director cc=123456789, mostrará "Yo" y el docente cc=12345678)
3. Al seleccionar un docente en el dropdown, el Resumen de Datos carga sus registros desde `agenda_views`

## Cambios

### 1. Hacer las notificaciones clickeables (`src/pages/Index.tsx`)

- Cada notificación de agenda pendiente será un botón/link clickeable
- Al hacer click:
  - Cambiar el `selectedDocente` en el contexto al docente correspondiente (cc del subordinado)
  - Cargar los records de su `agenda_views` en `recordsByDocente`
  - El SummaryPanel se actualizará automáticamente al cambiar el docente seleccionado

### 2. Dropdown dinámico de docentes en sidebar (`src/components/AppSidebar.tsx`)

- Reemplazar la lista estática `docentesPlanta` con una lista dinámica que incluye:
  - **"Yo"**: referencia al usuario logueado (cc del usuario actual)
  - Los docentes subordinados obtenidos de `usePendingAgendaViewsForSupervisor` o una nueva query a `user_hierarchy`
- Para el rol `DocentePlanta` (sin subordinados), solo mostrar "Yo"
- Para el rol `DirectorPrograma`, mostrar "Yo" + sus subordinados

### 3. Modificar `AgendaContext` para soportar docentes dinámicos

**Archivo:** `src/context/AgendaContext.tsx`

- Cambiar `docentesList` de estático (`docentesPlanta`) a dinámico, construido a partir del usuario logueado + subordinados
- Agregar el usuario logueado como primer item con label "Yo"
- Al seleccionar un docente del dropdown, `loadFromAgendaView` se ejecutará automáticamente para cargar sus registros guardados

### 4. Nuevo hook para obtener subordinados (`src/hooks/useDatabase.ts`)

- `useSubordinates(supervisorCc)`: obtiene los datos de los subordinados directos del usuario logueado desde `user_hierarchy` + `users`
- Retorna un array de `DocentePlanta` compatible con el dropdown existente

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Nuevo hook `useSubordinates(supervisorCc)` |
| `src/context/AgendaContext.tsx` | `docentesList` dinámico con "Yo" + subordinados; recibir user del AuthContext |
| `src/components/AppSidebar.tsx` | Mostrar "Yo" en dropdown + subordinados dinámicos |
| `src/pages/Index.tsx` | Notificaciones clickeables que cambian docente seleccionado y cargan registros |

