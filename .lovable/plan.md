

## Plan: Relación programa-facultad y nuevo auto-llenado

### 1. Base de datos: agregar columna `id_faculty` a `professional_careers`

Migración SQL para agregar `id_faculty INTEGER REFERENCES faculties(id)` a la tabla `professional_careers`. Luego, usando el insert tool, actualizar cada registro con su facultad correspondiente:

| career_id | faculty_id |
|-----------|-----------|
| 1,2,3,4 | 1 (Ciencias básicas e ingeniería) |
| 5,6,7,9 | 2 (Arquitectura y diseño) |
| 10,11,12 | 3 (Ciencias humanas) |
| 13,14,15 | 4 (Ciencias económicas) |

Nota: id=8 ("Diseño audiovisual") no fue mencionado por el usuario, se dejará con `id_faculty = NULL` o se preguntará.

### 2. TypeScript: actualizar tipo `DbProfessionalCareer`

En `src/types/database.ts`, agregar `id_faculty: number | null` al tipo `DbProfessionalCareer`.

### 3. Lógica de auto-llenado en `SubfunctionForm.tsx`

Cambiar la lógica de Docencia Directa:
- Al seleccionar una asignatura, auto-llenar **todos** los campos (programa, facultad, semestre, nivel, horas, semanas) basándose en la primera variante (por defecto, la del programa "Tecnología en desarrollo de software").
- **Facultad siempre bloqueada** (read-only). Se deriva automáticamente del programa seleccionado usando la nueva relación `professional_careers.id_faculty`.
- **Programa**: si hay múltiples variantes de la asignatura, se habilita como selector filtrado (solo los programas que tienen esa asignatura). Al cambiar el programa, se resuelve la nueva asignatura y se auto-llena la facultad desde `professional_careers.id_faculty`.
- Eliminar la lógica actual que usa `filteredFacultyIds` para filtrar facultades en el Select. En su lugar, la facultad siempre viene del programa.

### 4. `SubjectManagementDialog.tsx`

Cuando se selecciona un programa al crear/editar asignatura, auto-llenar la facultad basándose en `professional_careers.id_faculty`. El campo facultad queda read-only en este diálogo también.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | Agregar columna `id_faculty` a `professional_careers` |
| Insert SQL | Actualizar `id_faculty` en los 14 registros |
| `src/types/database.ts` | Agregar `id_faculty` a `DbProfessionalCareer` |
| `src/components/SubfunctionForm.tsx` | Facultad siempre read-only, derivada del programa; programa editable si hay variantes |
| `src/components/SubjectManagementDialog.tsx` | Auto-llenar facultad al seleccionar programa |

