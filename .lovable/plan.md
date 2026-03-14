

## Plan: Activar Lovable Cloud y crear todas las tablas de la base de datos

### Tablas identificadas de las capturas MySQL

**Catálogos:**
1. `roles` — idRol (PK), name, description
2. `states` — idState (PK), name, description
3. `semester` — idSemester (PK), number, description
4. `faculties` — idFaculty (PK), name, description
5. `education_levels` — idEducationLevel (PK), name, description
6. `professional_careers` — idProfessionalCareer (PK), name, description

**Actividades (tablas de opciones con horas):**
7. `indirect_teaching` — id (PK), name, weekly_hour, number_weeks
8. `investigations` — id (PK), name, weekly_hour, number_weeks
9. `social_projects` — id (PK), name, weekly_hour, number_weeks
10. `teacher_training` — id (PK), name, weekly_hour, number_weeks
11. `degree_works` — id (PK), name, weekly_hour, number_weeks
12. `complementary_activities` — id (PK), name, weekly_hour, number_weeks
13. `administrative_activities` — id (PK), name, weekly_hour, number_weeks
14. `academic_practices` — id (PK), name, weekly_hour, number_weeks

**Entidades principales:**
15. `subjects` — id (PK), id_semester (FK), id_education_level (FK), id_state (FK), id_faculty (FK), id_professional_career (FK), name, weekly_hour, number_weeks
16. `users` — id (PK, auto), id_rol (FK), id_state (FK), first_name, second_name, first_last_name, second_last_name, password, cc, email

**Nueva tabla:**
17. `agendas` — Tabla para guardar registros confirmados desde el panel lateral derecho. Campos: id (PK), user_id (FK→users), docente_cc (cédula del docente), subfunction_id (texto: docencia-directa, investigacion, etc.), data (JSONB con los valores del formulario), total_horas (INT), confirmed_at (TIMESTAMP), semester_id (FK→semester)

### Implementación

#### 1. Activar Lovable Cloud
- Crear la base de datos PostgreSQL vía Lovable Cloud

#### 2. Migraciones — Crear las 17 tablas
- Una migración con todas las tablas, FKs, y constraints
- Convención PostgreSQL: snake_case para columnas
- `agendas.data` será JSONB para almacenar flexiblemente los campos de cada subfunción

#### 3. Insertar datos iniciales
- `roles`: admin, vicerrectoria, decanatura, docenteAdministrativo, docentePlanta
- `states`: activo, inactivo
- `semester`: 1-10
- `faculties`: Facultad de ciencias básicas e ingeniería
- `education_levels`: Pregrado, Especialización, Maestría, Doctorado
- `professional_careers`: Tecnología en desarrollo de software
- Actividades: poblar con los datos actuales de `initialDropdownOptions.ts`
- `users`: admin y docente administrativo iniciales
- `subjects`: las 9 asignaturas actuales

#### 4. Tipos TypeScript (`src/types/database.ts`)
- Crear interfaces que reflejen exactamente las tablas para uso local y futura dockerización:
```text
Role, State, Semester, Faculty, EducationLevel, ProfessionalCareer,
Subject, IndirectTeaching, Investigation, SocialProject, TeacherTraining,
DegreeWork, ComplementaryActivity, AdministrativeActivity, AcademicPractice,
User (DB version), Agenda
```

#### 5. Conectar frontend con Supabase
- Crear `src/integrations/supabase/client.ts` y types
- Crear hooks `useSubjects`, `useRoles`, etc. con `@tanstack/react-query` para leer las tablas
- Actualizar `AgendaContext` para que `upsertRecord` también persista en la tabla `agendas` al confirmar
- Actualizar `AuthContext` para validar contra la tabla `users` de Supabase

### Archivos a crear/modificar
- **Crear**: `src/types/database.ts` (tipos TypeScript de todas las tablas)
- **Crear**: Migración SQL con las 17 tablas
- **Crear**: Inserts de datos iniciales
- **Crear**: `src/hooks/useDatabase.ts` (hooks de consulta)
- **Modificar**: `src/context/AgendaContext.tsx` — persistir en `agendas`
- **Modificar**: `src/context/AuthContext.tsx` — validar contra DB

