

## Plan: Header con perfil/dark mode, selector de docente y tabla docentePlanta

### 1. Header verde -- agregar dark mode toggle y menú de perfil

**`src/pages/Index.tsx`** -- En el header, después de "Universidad Católica de Pereira":
- Botón toggle dark mode (icono sol/luna) usando `next-themes` (ya instalado)
- Avatar con iniciales del usuario logueado + flecha hacia abajo (`ChevronDown`)
- DropdownMenu con opciones: "Ver perfil" y "Cerrar sesión"

**`src/App.tsx`** -- Envolver con `ThemeProvider` de `next-themes`

### 2. Página de perfil

**`src/pages/Profile.tsx`** (nuevo) -- Framework con:
- Avatar grande a la izquierda (iniciales, circulo grande)
- A la derecha: tabla/card con toda la info del usuario (nombre, apellido, email, cédula, rol, estado)
- Botón "Editar perfil" en esquina superior derecha que habilita edición inline
- Ruta `/profile` en App.tsx

### 3. Selector de docente de planta en sidebar

**`src/types/docentePlanta.ts`** (nuevo) -- Interface `DocentePlanta` con id, firstName, secondName, firstLastName, secondLastName

**`src/data/docentesPlanta.ts`** (nuevo) -- 3 docentes hardcodeados:
- Mateo Jiménez Castañeda
- Jorge Leonardo Bañol
- Francy Nelly Largo Muñoz

**`src/context/AgendaContext.tsx`** -- Agregar estado `selectedDocente` y `setSelectedDocente`

**`src/components/AppSidebar.tsx`** -- En la parte inferior (SidebarFooter), un Select para elegir docente de planta. Al cambiar docente, se cargan sus registros (si existen).

### 4. Nombre del docente en barra roja del formulario

**`src/components/SubfunctionForm.tsx`** -- En el CardHeader rojo, debajo del título de la subfunción, mostrar el nombre del docente seleccionado.

**`src/components/SummaryPanel.tsx`** -- En la barra roja del resumen, también mostrar nombre del docente.

### 5. Estructura de datos docentePlanta

```text
┌─────────────────────────────┐
│ docentePlanta               │
├─────────────────────────────┤
│ id: string (cédula, PK)    │
│ firstName: string           │
│ secondName: string          │
│ firstLastName: string       │
│ secondLastName: string      │
└─────────────────────────────┘
```

### Archivos a crear/modificar
- `src/App.tsx` -- ThemeProvider + ruta /profile
- `src/pages/Index.tsx` -- dark mode toggle + avatar dropdown en header
- `src/pages/Profile.tsx` -- nueva página de perfil
- `src/types/docentePlanta.ts` -- interface
- `src/data/docentesPlanta.ts` -- datos iniciales
- `src/context/AgendaContext.tsx` -- selectedDocente state
- `src/components/AppSidebar.tsx` -- selector docente en footer
- `src/components/SubfunctionForm.tsx` -- nombre docente bajo título rojo
- `src/components/SummaryPanel.tsx` -- nombre docente bajo título rojo

