

## Plan: Botón de edición (lapiz) para gestionar asignaturas en la tabla `subjects`

### Resumen

Agregar un botón con icono de lapiz al lado del campo "Asignatura" en el formulario de Docencia Directa. Al hacer clic, abre una ventana emergente (dialog) que permite agregar, modificar y eliminar registros de la tabla `subjects` directamente desde la interfaz.

### 1. Migración de base de datos

Agregar políticas RLS para permitir INSERT, UPDATE y DELETE en la tabla `subjects` para todos los usuarios (anon y authenticated):

```sql
CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update subjects" ON public.subjects FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete subjects" ON public.subjects FOR DELETE TO anon, authenticated USING (true);
```

### 2. Crear componente `SubjectManagementDialog`

**Archivo:** `src/components/SubjectManagementDialog.tsx`

Ventana emergente con:
- **Lista de asignaturas existentes** con botones de editar y eliminar por cada fila
- **Formulario de agregar/editar** con todos los campos de la tabla `subjects`:
  - `name` (texto, requerido, max 200 caracteres)
  - `id_semester` (dropdown de semestres, nullable)
  - `id_faculty` (dropdown de facultades, nullable)
  - `id_professional_career` (dropdown de carreras, nullable)
  - `id_education_level` (dropdown de niveles, nullable)
  - `id_state` (dropdown de estados, nullable)
  - `weekly_hours` (entero, requerido, min 1)
  - `number_weeks` (entero, requerido, min 1)

- **Al eliminar**: cargar todos los datos asociados a la asignatura y mostrarlos en el formulario para que el usuario confirme
- **Al editar**: cargar todos los campos y permitir modificación
- **Validaciones**: campos requeridos no nulos, enteros positivos para horas/semanas, nombre no vacío
- Operaciones CRUD directas contra la tabla `subjects` via Supabase client
- Invalidar queries de react-query al mutar (`queryKey: ["subjects"]`)
- Soporte de traducción (labels en inglés/español)

### 3. Modificar `SubfunctionForm.tsx`

- Importar `Pencil` de lucide-react y el nuevo componente `SubjectManagementDialog`
- Agregar botón con icono de lapiz al lado del combobox de asignatura (línea ~424, después del cierre del `</Popover>`)
- El botón abre el dialog de gestión de asignaturas

### 4. Agregar traducciones

En `src/i18n/translations.ts`, agregar claves para:
- "subject.manage" (Gestionar asignaturas / Manage subjects)
- "subject.add" (Agregar asignatura / Add subject)
- "subject.edit" (Editar asignatura / Edit subject)
- "subject.delete" (Eliminar asignatura / Delete subject)
- "subject.confirmDelete" (¿Está seguro? / Are you sure?)
- "subject.name" (Nombre / Name)
- Labels para cada campo del formulario

### Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Agregar RLS INSERT/UPDATE/DELETE en `subjects` |
| `src/components/SubjectManagementDialog.tsx` | Nuevo: dialog CRUD para asignaturas |
| `src/components/SubfunctionForm.tsx` | Agregar botón lapiz junto al combobox de asignatura |
| `src/i18n/translations.ts` | Agregar traducciones para gestión de asignaturas |

