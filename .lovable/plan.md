

## Plan: Distribución Horaria con Drag & Drop

### Resumen
Al confirmar datos, redirigir a una nueva vista de distribución horaria donde los registros del docente se convierten en bloques arrastrables (1 bloque = 1 hora semanal) que se colocan en una grilla de horario (Lunes-Sábado, 8:00am-10:00pm). Agregar sección "Horario Permanencia" en el sidebar con subfunción "Distribución horaria".

### 1. Tipos nuevos (`src/types/agenda.ts`)
- Agregar `ScheduleBlock`: `{ recordId, subfunctionId, label, color, day, hour }` 
- Agregar `ScheduleData`: `{ docenteId, blocks: ScheduleBlock[], lastModified }` al contexto
- Ampliar `sectionId` a `"produccion" | "actividades" | "horario"`

### 2. Nueva subfunción en `src/data/subfunctions.ts`
- Agregar entrada con `id: "distribucion-horaria"`, `sectionId: "horario"`, `title: "3.1 Distribución horaria"`, `shortTitle: "Distribución Horaria"`, sin fields

### 3. Sidebar (`src/components/AppSidebar.tsx`)
- Agregar tercera sección "Horario Permanencia" con las subfunciones de `sectionId === "horario"`
- Icono: `Calendar` de lucide

### 4. AgendaContext -- estado del horario
- Agregar `scheduleByDocente: { [docenteId]: ScheduleData }` al estado
- Funciones: `saveSchedule(blocks)`, `getSchedule()` 
- Flag `hasSchedule` derivado del docente seleccionado

### 5. Nueva página `src/pages/ScheduleBuilder.tsx`
- Layout: header verde igual al Index, contenido principal con grilla de horario, barra lateral derecha con bloques arrastrables
- **Barra lateral derecha**: Genera bloques desde `records` del docente. Cada registro con `horasSemana` genera N bloques de 1 hora. Colores distintos por subfunción. Muestra nombre asignatura/actividad + "Xh restantes"
- **Grilla horario**: Tabla con columnas Lun-Sáb, filas 8:00-22:00 (14 filas). Celdas droppable. Al soltar bloque se asigna día+hora
- **Drag & Drop**: Usar HTML5 drag and drop nativo (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) -- sin librería extra
- Botón "Volver" navega a `/`
- Botón "Guardar" guarda schedule en contexto y navega a `/`
- Ruta `/schedule` en App.tsx

### 6. Confirmar datos redirige (`src/components/SummaryPanel.tsx`)
- `handleConfirm` usa `useNavigate` para ir a `/schedule` en vez de mostrar toast

### 7. SubfunctionForm -- caso "distribucion-horaria"
- Cuando `activeSubfunction === "distribucion-horaria"`:
  - Si hay horario guardado: mostrar grilla de solo lectura con los bloques
  - Si no hay horario: mostrar mensaje "Aún no se ha creado horario. Confirma las asignaturas en el resumen de registros."

### 8. Colores por subfunción
Paleta fija mapeada por `subfunctionId`:
- docencia-directa: blue
- docencia-indirecta: emerald
- trabajos-grado: amber
- practicas-academicas: purple
- investigacion: rose
- proyeccion-social: orange
- complementarias: teal
- formacion-docentes: indigo
- administrativas: slate

### Archivos a crear/modificar
- `src/types/agenda.ts` -- tipos ScheduleBlock, ScheduleData
- `src/data/subfunctions.ts` -- agregar distribucion-horaria
- `src/context/AgendaContext.tsx` -- estado schedule, saveSchedule, getSchedule, hasSchedule
- `src/components/AppSidebar.tsx` -- sección Horario Permanencia
- `src/pages/ScheduleBuilder.tsx` -- nueva página drag & drop
- `src/components/SummaryPanel.tsx` -- confirmar redirige a /schedule
- `src/components/SubfunctionForm.tsx` -- caso distribucion-horaria (solo lectura o mensaje vacío)
- `src/App.tsx` -- ruta /schedule

