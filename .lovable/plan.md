

## Plan: Crear migración de seed con todos los datos existentes

### Qué se hará
Crear un único archivo de migración SQL en `supabase/migrations/` que inserte todos los registros actuales de las 16 tablas de datos. Se usará `INSERT ... ON CONFLICT DO NOTHING` para que sea idempotente (no falle si los datos ya existen).

### Archivo a crear
**`supabase/migrations/20260316_seed_initial_data.sql`**

Contendrá los INSERTs en orden correcto (respetando dependencias de foreign keys):

1. **roles** — 1 registro (id:6, Docente de planta)
2. **states** — 2 registros (Activo, Inactivo)
3. **semester** — 6 registros (semestres 1-6)
4. **faculties** — 1 registro (Facultad de ciencias básicas e ingeniería)
5. **education_levels** — 4 registros (Pregrado, Especialización, Maestría, Doctorado)
6. **professional_careers** — 1 registro (Tecnología en desarrollo de software)
7. **subjects** — 29 registros (todas las asignaturas con sus FK)
8. **users** — 1 registro (Docente Planta Pruebas, cc:1234)
9. **indirect_teaching** — 2 registros (Preparación de clases, Asesorías)
10. **investigations** — 2 registros (Investigador principal, Coinvestigador)
11. **social_projects** — 1 registro
12. **teacher_training** — 3 registros (Estudios maestría/doctorado/otros)
13. **degree_works** — 4 registros (Trabajo pregrado/especialización/maestría/doctorado)
14. **complementary_activities** — 3 registros
15. **administrative_activities** — 4 registros
16. **academic_practices** — 1 registro

Cada INSERT incluirá los IDs explícitos y reseteará las secuencias para evitar conflictos futuros.

### Resultado
Al clonar el repo y ejecutar las migraciones (`supabase db push` o al conectar con Lovable Cloud), todos los datos estarán disponibles automáticamente.

