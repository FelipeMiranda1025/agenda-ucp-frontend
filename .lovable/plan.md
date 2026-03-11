

## Plan: Mostrar todos los formularios apilados en la página principal

### Problema
Actualmente solo se muestra un formulario a la vez según la selección del sidebar. El usuario quiere ver **todos** los formularios de subfunciones apilados verticalmente en la página principal (Docencia Directa, luego Docencia Indirecta, luego Trabajos de Grado, etc.).

### Solución

**`src/pages/Index.tsx`**: En lugar de renderizar un solo `<SubfunctionForm />`, iterar sobre todas las subfunciones (excepto `distribucion-horaria`) y renderizar un `<SubfunctionForm subfunctionId={id} />` por cada una, apilados verticalmente.

**`src/components/SubfunctionForm.tsx`**: 
- Cambiar el componente para aceptar una prop `subfunctionId` opcional. Si se pasa, usar esa; si no, usar `activeSubfunction` del contexto (para mantener compatibilidad con la vista individual de distribución horaria).
- El componente ya tiene toda la lógica de formulario + tabla de registros, así que cada instancia funcionará independientemente.

**Sidebar (`AppSidebar.tsx`)**: Al hacer click en una opción del sidebar, hacer scroll hasta la sección correspondiente en la página (usando `id` en cada sección y `scrollIntoView`), en vez de cambiar `activeSubfunction`.

### Archivos a modificar
- `src/pages/Index.tsx` — renderizar todos los formularios apilados
- `src/components/SubfunctionForm.tsx` — aceptar prop `subfunctionId` para renderizar un formulario específico
- `src/components/AppSidebar.tsx` — al hacer click, scroll a la sección correspondiente

