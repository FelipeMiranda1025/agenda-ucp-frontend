

## Plan: Deduplicación de asignaturas y validación de unicidad nombre+facultad+programa

### Problema actual
- El combobox de asignaturas muestra todas las filas de `subjects`, incluyendo duplicados por nombre (ej: "Matemáticas I" puede existir para varias facultades/programas).
- No hay validación que impida crear asignaturas duplicadas con la misma combinación nombre+facultad+programa.

### Cambios

#### 1. SubjectManagementDialog.tsx — Validación al crear/editar
Antes de insertar o actualizar, consultar la tabla `subjects` para verificar si ya existe un registro con el mismo `name`, `id_faculty` e `id_professional_career`. Si existe (y no es el mismo registro en caso de edición), mostrar un toast de error indicando que ya existe esa asignatura para esa facultad y programa.

#### 2. SubfunctionForm.tsx — Deduplicar nombres en combobox y auto-completar facultad/programa
- En el combobox de asignaturas, en vez de listar todos los `subjects`, deduplicar por nombre: mostrar solo un item por cada nombre único.
- Al seleccionar un nombre de asignatura:
  - Si solo hay una asignatura con ese nombre, auto-completar facultad y programa como antes.
  - Si hay múltiples asignaturas con ese nombre, seleccionar la primera por defecto y habilitar los campos de facultad y programa como selectores filtrados (solo mostrando las opciones que corresponden a asignaturas con ese nombre).
  - Al cambiar la facultad o programa, actualizar la referencia interna a la asignatura correspondiente (la que coincide con nombre+facultad+programa seleccionados).

#### 3. Lógica de auto-fill al seleccionar asignatura
Cuando el usuario selecciona una asignatura en el combobox:
- Buscar todas las `subjects` con ese nombre.
- Si hay una sola: llenar automáticamente facultad, programa, semestre, nivel, horas y semanas.
- Si hay varias: llenar los campos comunes, y para facultad/programa mostrar solo las opciones correspondientes a asignaturas con ese nombre.

#### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/components/SubjectManagementDialog.tsx` | Agregar validación de duplicado nombre+facultad+programa antes de insert/update |
| `src/components/SubfunctionForm.tsx` | Deduplicar nombres en combobox, lógica de selección con múltiples variantes, filtro dinámico de facultad/programa |
| `src/i18n/translations.ts` | Agregar mensaje de error "asignatura ya existe" |

