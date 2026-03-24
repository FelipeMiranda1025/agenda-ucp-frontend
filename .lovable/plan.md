

## Plan: Relación programa-facultad y auto-llenado

La columna `id_faculty` ya existe en `professional_careers` (migración anterior). Falta poblar los datos y actualizar la lógica del frontend.

### 1. Migración SQL: poblar id_faculty

Crear migración con UPDATEs:
```sql
UPDATE professional_careers SET id_faculty = 1 WHERE id IN (1,2,3,4);
UPDATE professional_careers SET id_faculty = 2 WHERE id IN (5,6,7,8,9);
UPDATE professional_careers SET id_faculty = 3 WHERE id IN (10,11,12);
UPDATE professional_careers SET id_faculty = 4 WHERE id IN (13,14,15);
```

### 2. `src/types/database.ts`

Agregar `id_faculty: number | null` a `DbProfessionalCareer`.

### 3. `src/components/SubfunctionForm.tsx`

Cambios en la lógica de Docencia Directa:

- **Facultad siempre read-only**: agregar `"facultad"` siempre a `readOnlyFields` (línea 424-429). Eliminar la condición `!hasMultipleVariants`.
- **Programa editable si hay variantes**: mantener la lógica actual donde programa se habilita cuando `hasMultipleVariants`.
- **Derivar facultad del programa**: en el `useEffect` de auto-fill (línea 223-258), cuando se resuelve el subject, obtener la facultad desde `dbProfessionalCareers.find(c => c.id === subject.id_professional_career)?.id_faculty` y luego buscar el nombre de la facultad con `dbFaculties.find(f => f.id === derivedFacultyId)?.name`.
- **Al cambiar programa** (useEffect línea 261-281): resolver la nueva asignatura y re-derivar la facultad desde el programa seleccionado.
- **Eliminar filtrado de facultades** en el Select (líneas 525-529): ya no se necesita porque facultad es siempre read-only.

### 4. `src/components/SubjectManagementDialog.tsx`

- Cuando el usuario selecciona un programa (`id_professional_career`), auto-llenar `id_faculty` basándose en `dbProfessionalCareers.find(c => c.id === selectedCareerIdid_faculty`.
- El campo de facultad queda como read-only (disabled) en el formulario.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | UPDATE id_faculty en 15 registros |
| `src/types/database.ts` | Agregar `id_faculty` a `DbProfessionalCareer` |
| `src/components/SubfunctionForm.tsx` | Facultad siempre read-only y derivada del programa |
| `src/components/SubjectManagementDialog.tsx` | Auto-llenar facultad al seleccionar programa, campo read-only |

