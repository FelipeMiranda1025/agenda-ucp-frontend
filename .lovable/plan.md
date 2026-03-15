

## Plan: Auto-llenar `cantidadSemanas`/`cantidadHoras` al seleccionar actividad en 7 subfunciones

### Contexto
Ya existe un patrón en `SubfunctionForm.tsx` que auto-llena campos cuando se selecciona una asignatura en "docencia-directa". Se replicará este patrón para las 7 subfunciones restantes, cargando `number_weeks` desde la tabla correspondiente en la base de datos al campo `cantidadSemanas` o `cantidadHoras` del formulario.

### Mapeo subfunción → tabla → campo destino

| Subfunción | Tabla DB | Campo dropdown | Campo a auto-llenar |
|---|---|---|---|
| trabajos-grado | degree_works | tipoTrabajo | cantidadHoras |
| practicas-academicas | academic_practices | actividad | cantidadHoras |
| investigacion | investigations | actividad | cantidadSemanas |
| proyeccion-social | social_projects | actividad | cantidadSemanas |
| complementarias | complementary_activities | actividad | cantidadSemanas |
| formacion-docentes | teacher_training | actividad | cantidadSemanas |
| administrativas | administrative_activities | actividad | cantidadSemanas |

### Cambios en `src/components/SubfunctionForm.tsx`

1. **Importar los hooks de DB faltantes**: `useDegreeWorks`, `useAcademicPractices`, `useInvestigations`, `useSocialProjects`, `useComplementaryActivities`, `useTeacherTraining`, `useAdministrativeActivities`.

2. **Llamar los hooks** dentro del componente para obtener los datos de cada tabla.

3. **Agregar un `useEffect`** que, al detectar un cambio en el campo dropdown de la subfunción activa, busque el registro correspondiente por `name` en los datos de la tabla y asigne `number_weeks` al campo `cantidadSemanas` o `cantidadHoras` según corresponda.

4. **Usar los datos de DB como opciones del dropdown** para las categorías correspondientes (igual que se hace con `dbSubjects` para asignaturas), reemplazando las opciones manuales de `dropdownOptions`.

### Archivos a modificar
- **`src/components/SubfunctionForm.tsx`**: Agregar hooks, efecto de auto-llenado, y uso de datos DB en dropdowns.

No se requieren cambios en la base de datos ni en otros archivos.

