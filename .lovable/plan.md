

## Plan: Registros por docente de planta

### Problema
Actualmente todos los registros se almacenan en un solo array `records`. Al cambiar de docente, se siguen mostrando los mismos registros.

### Solución
Modificar `src/context/AgendaContext.tsx` para usar un `Map` (objeto) que asocie cada `docenteId` con su array de registros:

- Reemplazar `records: AgendaRecord[]` por `recordsByDocente: { [docenteId: string]: AgendaRecord[] }`
- Derivar `records` del docente seleccionado: `recordsByDocente[selectedDocente?.id] || []`
- `addRecord`, `updateRecord`, `deleteRecord` operan sobre el array del docente seleccionado
- Al cambiar de docente, automáticamente se muestran sus registros (o vacío si no tiene)

### Archivos a modificar
- **`src/context/AgendaContext.tsx`** — Cambiar estructura de estado de records a un objeto indexado por docenteId. La interfaz pública (`records`, `addRecord`, etc.) se mantiene igual, por lo que no se necesitan cambios en ningún otro componente.

