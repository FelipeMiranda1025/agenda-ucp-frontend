

## Plan: Auto-llenado de Docencia Directa + Registros automáticos de Docencia Indirecta

### 1. Migración SQL
- Cambiar `indirect_teaching.weekly_hours` de `integer` a `numeric(5,2)` para soportar 0.5
- Borrar registros existentes e insertar:
  - "Preparación de clases" (weekly_hours: 0.5, number_weeks: 18)
  - "Asesorías de estudiantes" (weekly_hours: 1, number_weeks: 18)

### 2. Auto-llenado en formulario de Docencia Directa (`SubfunctionForm.tsx`)
- Importar hooks: `useSubjects`, `useSemesters`, `useFaculties`, `useEducationLevels`, `useProfessionalCareers`
- Cuando el usuario selecciona una asignatura en el dropdown:
  - Buscar el subject en la DB por nombre
  - Resolver las FK (id_semester → nombre semestre, id_faculty → nombre facultad, etc.)
  - Auto-llenar: semestre, facultad, programa, nivel, horasSemana, cantidadSemanas
  - El campo "jornada" queda manual (no existe en subjects)

### 3. Registros automáticos de Docencia Indirecta (`AgendaContext.tsx`)
- Después de cada upsert exitoso en `docencia-directa`:
  - Recopilar todas las asignaturas registradas en docencia directa
  - Calcular **Preparación de clases**: sumar `horasSemana × 0.5` de cada asignatura → ese es el `horasSemana`, multiplicar por 18 semanas → `totalHoras`
  - Calcular **Asesorías de estudiantes**: sumar `horasSemana × 1` de cada asignatura → ese es el `horasSemana`, multiplicar por 18 semanas → `totalHoras`
  - Hacer upsert automático de ambos registros en la subfunción `docencia-indirecta`
- Estos registros aparecerán automáticamente en el panel lateral derecho bajo "Docencia Indirecta"
- Si se eliminan todas las asignaturas de docencia directa, se eliminan los registros de docencia indirecta

### Archivos a modificar
- **Migración SQL**: ALTER column + DELETE + INSERT en `indirect_teaching`
- **`src/components/SubfunctionForm.tsx`**: Lógica de auto-llenado al seleccionar asignatura
- **`src/context/AgendaContext.tsx`**: Auto-generación de 2 registros de docencia indirecta tras cada upsert de docencia directa

