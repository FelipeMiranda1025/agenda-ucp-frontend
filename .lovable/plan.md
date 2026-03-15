

## Plan: Mostrar nombre del usuario autenticado en lugar de "selectedDocente"

### Problema
Actualmente los formularios y paneles muestran el nombre del docente seleccionado en el sidebar (`selectedDocente`), que por defecto es "Mateo Jiménez Castañeda". Se necesita mostrar el nombre del usuario logueado (`useAuth().user`).

### Archivos a modificar

1. **`src/components/SubfunctionForm.tsx`** (3 lugares):
   - Importar `useAuth` y obtener `user`.
   - Reemplazar las 3 instancias donde se muestra `selectedDocente.firstName/firstLastName` por `user.firstName` y `user.firstLastName`.

2. **`src/components/SummaryPanel.tsx`** (1 lugar):
   - Importar `useAuth`, reemplazar `selectedDocente.firstName/firstLastName` en el header del panel por los datos del usuario autenticado.

3. **`src/pages/ScheduleBuilder.tsx`** (1 lugar):
   - Importar `useAuth`, reemplazar `selectedDocente.firstName/firstLastName` por datos del usuario autenticado.

### Cambio en cada instancia
```tsx
// Antes
{[selectedDocente.firstName, selectedDocente.firstLastName].filter(Boolean).join(' ')}

// Después
const { user } = useAuth();
{[user?.firstName, user?.firstLastName].filter(Boolean).join(' ')}
```

El dropdown de "Docente de planta" en el sidebar izquierdo se mantiene sin cambios ya que cumple otra función (selección para la agenda).

