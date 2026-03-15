

## Plan: Reestructurar tablas y actualizar datos

### 1. Migración: Recrear `degree_works`

La tabla actual tiene columnas `id, name, weekly_hours, number_weeks`. La imagen muestra que debe tener `id, name, number_projects (default 0), number_weeks` -- es decir, reemplazar `weekly_hours` por `number_projects`.

```sql
DROP TABLE IF EXISTS degree_works;
CREATE TABLE degree_works (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  number_projects INTEGER NOT NULL DEFAULT 0,
  number_weeks INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE degree_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read degree_works" ON degree_works FOR SELECT TO anon, authenticated USING (true);
```

### 2. Migración: Recrear `academic_practices`

La tabla actual tiene `id, name, weekly_hours, number_weeks`. La imagen muestra `id, name, number_students (default 0), number_weeks`.

```sql
DROP TABLE IF EXISTS academic_practices;
CREATE TABLE academic_practices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  number_students INTEGER NOT NULL DEFAULT 0,
  number_weeks INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE academic_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read academic_practices" ON academic_practices FOR SELECT TO anon, authenticated USING (true);
```

### 3. Insertar datos en `degree_works`

4 registros: Trabajo pregrado (15 semanas), Trabajo especialización (15), Trabajo maestría (30), Trabajo doctorado (45).

### 4. Insertar datos en `academic_practices`

1 registro: Práctica profesional (IST) (10 semanas).

### 5. Limpiar e insertar en `investigations`

Borrar existentes, insertar 2 registros (Investigador principal, Coinvestigador) con weekly_hours=0 y number_weeks=23.

### 6. Limpiar e insertar en `complementary_activities`

Borrar existentes, insertar 3 registros con weekly_hours=0 y number_weeks=23.

### 7. Limpiar e insertar en `teacher_training`

Borrar existentes, insertar 3 registros con weekly_hours=0 y number_weeks=23.

### 8. Limpiar e insertar en `administrative_activities`

Borrar existentes, insertar 4 registros con weekly_hours=0 y number_weeks=23.

### 9. Actualizar tipos TypeScript (`src/types/database.ts`)

Actualizar `DbDegreeWork` para usar `number_projects` en vez de `weekly_hours`, y `DbAcademicPractice` para usar `number_students` en vez de `weekly_hours`.

### 10. Actualizar código dependiente

Revisar `SubfunctionForm.tsx`, `subfunctions.ts`, y `useDatabase.ts` para que reflejen los nuevos campos de las tablas modificadas.

