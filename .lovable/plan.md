

## Plan: Sistema de Gestión de Agenda Docente - Universidad Católica de Pereira

### Identidad Visual
- Paleta UCP: verde institucional (#2E7D32 nav), rojo/granate (#8B1A1A header), blanco, gris claro
- Logo UCP en la barra lateral superior
- Tipografía limpia sans-serif, bordes redondeados, estilo institucional

### Estructura de la Aplicación

**Layout Principal:**
- Barra lateral colapsable con logo UCP, campo de búsqueda y menú de navegación con las 2 secciones principales y sus subfunciones
- Área principal de contenido donde se abren los formularios/tablas de cada subfunción
- Pie de página fijo con métricas consolidadas en tiempo real

**Sección 1: PRODUCCIÓN** (4 subfunciones)
- 1.1 Docencia directa — formulario con dropdowns (Asignatura, Semestre, Facultad, Programa, Jornada, Nivel), campos numéricos (Horas/semana, Semanas), cálculos automáticos
- 1.2 Docencia indirecta — dropdown Actividad, campos numéricos, cálculos
- 1.3 Dirección/asesorías trabajos de grado — dropdown Tipo trabajo, campos numéricos, cálculos
- 1.4 Asesorías prácticas académicas — dropdown Actividad, campos numéricos, cálculos
- Subtotal: "Total horas semestrales de producción"

**Sección 2: ACTIVIDADES DIFERENTES A LA DOCENCIA** (5 subfunciones)
- 2.1 Investigación y desarrollo tecnológico
- 2.2 Proyección social
- 2.3 Actividades complementarias
- 2.4 Formación de docentes
- 2.5 Actividades académico-administrativas
- Cada una con dropdown de Actividad, campos numéricos y cálculos automáticos
- Subtotal: "Total horas semestrales actividades diferentes"

**Pie de página con métricas:**
- Total horas semestrales (suma de ambas secciones)
- Promedio horas/semana (÷18)
- Horas semestre/defecto (configurable, default 920)
- Horas faltantes (diferencia)

### Base de Datos (Lovable Cloud / Supabase)

**Tablas principales:**
- `dropdown_options` — almacena opciones dinámicas por categoría (asignatura, semestre, actividad, etc.)
- `docencia_directa` — registros de la subfunción 1.1
- `docencia_indirecta` — registros 1.2
- `trabajos_grado` — registros 1.3
- `practicas_academicas` — registros 1.4
- `actividades_investigacion` — registros 2.1
- `actividades_proyeccion` — registros 2.2
- `actividades_complementarias` — registros 2.3
- `formacion_docentes` — registros 2.4
- `actividades_administrativas` — registros 2.5
- `configuracion` — valores como horas semestre/defecto

**Autenticación:** Login con email/password para docentes administrativos. Sin necesidad de tabla de perfiles adicional por ahora.

### Funcionalidades Clave
- CRUD completo en cada subfunción (crear, editar, eliminar registros)
- Agregar nuevas opciones a cualquier dropdown dinámicamente (botón "+" junto a cada select)
- Cálculos automáticos en cliente (JavaScript) con actualización en tiempo real
- Validación: solo números positivos en campos numéricos
- Búsqueda sistematizada en la barra lateral para filtrar subfunciones
- Responsive para desktop y tablet
- Tablas con los registros existentes debajo de cada formulario

### Flujo de Implementación
1. Setup de identidad visual y layout con sidebar
2. Base de datos: tablas y opciones iniciales de dropdowns
3. Componente reutilizable de formulario con cálculos automáticos
4. Implementar las 9 subfunciones usando el componente reutilizable
5. Pie de página con métricas consolidadas en tiempo real
6. Gestión dinámica de opciones de dropdowns
7. Autenticación y protección de rutas

