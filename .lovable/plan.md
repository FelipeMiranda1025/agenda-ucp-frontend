

## Plan: Reiniciar datos de catálogos y asignaturas

### Situacion actual
- Las tablas `users` tienen FK a `states` (id_state=1) y `roles` (id_rol). Al borrar `states`, se romperían estas referencias.
- `subjects` tiene FK a `semester`, `education_levels`, `states`, `faculties`, `professional_careers`.
- `agendas` está vacía, no hay conflicto.

### Estrategia
Ejecutar una migración de datos que:
1. Borre `subjects` (depende de los catálogos)
2. Borre `users` temporalmente (depende de `states`)
3. Borre y reinicie las 5 tablas catálogo con `TRUNCATE ... RESTART IDENTITY CASCADE`
4. Reinserte los catálogos con IDs predecibles (empezando desde 1)
5. Reinserte los 2 usuarios originales (admin y docente administrativo)
6. Inserte las 29 asignaturas con las FK correctas

### Datos a insertar

**semester** (6 registros): 1-Primer semestre, 2-Segundo semestre, ..., 6-Sexto semestre

**faculties** (1 registro): "Facultad de ciencias básicas e ingeniería"

**professional_careers** (1 registro): "Tecnología en desarrollo de software"

**education_levels** (4 registros): Pregrado, Especialización, Maestría, Doctorado

**states** (2 registros): Activo, Inactivo

**subjects** (29 registros): Todas las asignaturas indicadas, con sus horas semanales (2-6), 16 semanas, y FK apuntando al semestre correspondiente (1-6). Todas referencian education_level=1, state=1, faculty=1, professional_career=1.

### Archivos que NO se modifican
Solo se ejecutan operaciones de datos (INSERT/DELETE/TRUNCATE) en la base de datos. No hay cambios de código.

