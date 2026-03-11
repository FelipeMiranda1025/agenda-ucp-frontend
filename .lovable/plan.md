

## Plan: Reemplazar sidebar por vista tipo Excel en un solo framework

### Concepto
Eliminar el menú lateral izquierdo (AppSidebar) y reemplazar la vista actual por una sola página con todas las secciones y subfunciones mostradas en un formato tipo hoja de cálculo continua, similar al Excel de referencia. Cada sección tendrá su encabezado coloreado (naranja/rojo para Producción, azul para Actividades) y debajo las filas de datos con totales parciales.

### Estructura visual (referencia Excel)
```text
┌─────────────────────────────────────────────────────┐
│  Header: Sistema de Gestión + docente selector      │
├─────────────────────────────────────────────────────┤
│  PRODUCCIÓN (encabezado naranja)                    │
│  ┌─ 1.1 Docencia Directa ─────────────────────────┐│
│  │ Asignatura | Programa | H/sem | #Sem | Total   ││
│  │ [fila datos editable]                           ││
│  │ [+ agregar fila]                                ││
│  │ Total docencia directa:              32         ││
│  ├─ 1.2 Docencia Indirecta ───────────────────────┤│
│  │ Actividad | H/sem | #Sem | Total               ││
│  │ ...                                             ││
│  │ Total docencia indirecta:            36         ││
│  ├─ 1.3 Trabajos de Grado ────────────────────────┤│
│  │ ...                                             ││
│  ├─ 1.4 Prácticas Académicas ─────────────────────┤│
│  │ ...                                             ││
│  │         Horas Actividades de Docencia:  68      ││
│  ├─────────────────────────────────────────────────┤│
│  ACTIVIDADES DIFERENTES (encabezado azul)           │
│  ├─ 2.1 Investigación ───────────────────────────┤ │
│  │ ...                                             ││
│  ├─ 2.2 Proyección Social ───────────────────────┤ │
│  │ ...                                             ││
│  │ (continúa 2.3-2.5)                             ││
│  ├─────────────────────────────────────────────────┤│
│  HORARIO PERMANENCIA (enlace a distribución)        │
│  ├─────────────────────────────────────────────────┤│
│  RESUMEN TOTAL + Confirmar datos                    │
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Archivos a modificar

1. **`src/pages/Index.tsx`** -- Eliminar SidebarProvider/AppSidebar. Layout simple: header + contenido scrollable full-width. Mover selector de docente al header. Integrar el nuevo componente SpreadsheetView como contenido principal.

2. **Crear `src/components/SpreadsheetView.tsx`** -- Componente principal que renderiza todas las subfunciones en formato tabla continua:
   - Itera por secciones (producción, actividades)
   - Para cada sección: encabezado coloreado (naranja para producción, azul para actividades, como en el Excel)
   - Para cada subfunción: encabezado con título, tabla con columnas según los fields de la config, filas de registros editables inline, fila para agregar nuevo registro, fila de subtotal
   - Al final de cada sección principal: fila de total de sección
   - Sección "Horario Permanencia": link/botón para ir a distribución horaria (o mostrar horario read-only si existe)
   - Al final: resumen general con métricas y botón "Confirmar datos"

3. **`src/components/AppSidebar.tsx`** -- Ya no se usa, se puede mantener pero no se importa.

4. **`src/components/SubfunctionForm.tsx`** -- Ya no se usa como componente separado; su lógica de formulario inline se integra dentro de SpreadsheetView.

5. **`src/components/SummaryPanel.tsx`** -- Ya no se usa como panel lateral; las métricas y botón confirmar se integran al final del SpreadsheetView.

### Comportamiento clave
- Cada subfunción muestra sus registros en filas de tabla con edición inline (botones editar/eliminar)
- Última fila de cada subfunción: inputs para agregar nuevo registro + botón "+"
- Dropdowns para campos tipo "dropdown" con opción de agregar nuevas opciones
- Campos calculados se muestran automáticamente
- Totales parciales por subfunción y totales por sección
- Todo scrollable verticalmente en una sola página
- El selector de docente se mueve al header

