

## Plan: Rediseño completo del layout principal

### Cambios

#### 1. Logo blanco UCP (`src/assets/ucp-logo-white.png`)
- Copiar `user-uploads://Logo_blanco.png` a `src/assets/ucp-logo-white.png`

#### 2. `src/pages/Index.tsx` — Rediseño completo del layout
- **Eliminar** `SidebarProvider`, `AppSidebar` del render principal y `SidebarTrigger`
- **Header sticky** (`sticky top-0 z-40`): logo blanco UCP a la izquierda (reemplaza SidebarTrigger), título, subtítulo dinámico, toggle dark mode, perfil dropdown
- **Subtítulo dinámico**: usar `IntersectionObserver` sobre las secciones para determinar si se muestra "Producción" o "Actividades diferentes a la docencia" según lo visible en scroll. Tamaño de texto `text-sm` similar al que usan las franjas rojas
- **Layout debajo del header**: `flex` con `main` (overflow-auto, solo esta zona hace scroll) + `SummaryPanel` (fijo, sin scroll de página)
- **Botón hamburguesa**: `fixed bottom-6 left-6 z-50`, circular, verde (`bg-green-600`), icono `Menu`
- **Overlay menú**: estado `menuOpen`. Cuando true, fondo negro semitransparente (`bg-black/50`) + panel lateral con el contenido del `AppSidebar` (logo, búsqueda, secciones, selector docente). Al seleccionar opción: cerrar overlay + scroll a sección

#### 3. `src/components/AppSidebar.tsx` — Refactorizar como componente overlay
- Cambiar para funcionar independientemente de `SidebarProvider`
- Recibir prop `onClose: () => void`
- Al click en cualquier ítem del menú: llamar `onClose()`, hacer `scrollIntoView` a la sección correspondiente
- Mantener búsqueda, selector de docente, secciones Producción/Actividades/Horario

#### 4. `src/components/SubfunctionForm.tsx` — Auto-guardar y eliminar tabla/botón
- **Eliminar** botón "Agregar registro" (líneas 255-257)
- **Eliminar** card con tabla de registros (líneas 261-345)
- **Persistir formData por subfunción**: cambiar `useState` local a un `useRef` map o usar contexto. Usar `formDataMap: { [subfunctionId]: formData }` como estado local del componente con key por subfunctionId para que no se pierdan al hacer scroll
- **Auto-agregar registro**: `useEffect` que detecta cuando todos los campos requeridos (dropdowns con valor + numbers > 0) están completos → llama `addRecord` automáticamente. Si ya existe un registro con mismo subfunctionId y misma clave primaria (primer campo dropdown), actualiza en vez de crear duplicado

#### 5. `src/context/AgendaContext.tsx` — Soporte para upsert
- Agregar función `upsertRecord(subfunctionId, data, totalHoras)`: busca registro existente con mismo subfunctionId y misma clave principal (primer valor string en data). Si existe, actualiza; si no, crea nuevo

#### 6. `src/components/SummaryPanel.tsx` — Click navega al formulario
- Al click en un registro: hacer `document.getElementById('section-' + subfunctionId)?.scrollIntoView({ behavior: 'smooth' })` (ya hace algo similar, asegurar que funcione con el nuevo layout)

### Archivos a crear/modificar
- **Copiar**: `user-uploads://Logo_blanco.png` → `src/assets/ucp-logo-white.png`
- **Modificar**: `src/pages/Index.tsx`, `src/components/AppSidebar.tsx`, `src/components/SubfunctionForm.tsx`, `src/context/AgendaContext.tsx`, `src/components/SummaryPanel.tsx`

