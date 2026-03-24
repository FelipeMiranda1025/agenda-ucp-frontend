

## Plan: Formulario Condicional Post-Login de Actividades y Responsabilidades Docentes

### Resumen

Crear un formulario tipo cuestionario que aparece entre el login y la agenda docente. Basado en el rol del usuario y la normativa institucional (Artículos 1-8), presenta preguntas con checkboxes para determinar las horas de docencia directa, detectar conflictos normativos y generar observaciones automáticas.

### 1. Nueva tabla en base de datos: `docente_semester_config`

Persiste las respuestas del formulario por docente y semestre.

```sql
CREATE TABLE public.docente_semester_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cc text NOT NULL,
  semester_label text NOT NULL DEFAULT '2025-1',
  responses jsonb NOT NULL DEFAULT '{}',
  computed_direct_hours integer NOT NULL DEFAULT 16,
  observations text[] DEFAULT '{}',
  conflicts text[] DEFAULT '{}',
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_cc, semester_label)
);

ALTER TABLE public.docente_semester_config ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura y escritura para anon/authenticated (igual que agendas)
CREATE POLICY "Anyone can read docente_semester_config" ON public.docente_semester_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert docente_semester_config" ON public.docente_semester_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update docente_semester_config" ON public.docente_semester_config FOR UPDATE TO anon, authenticated USING (true);
```

### 2. Nuevo componente: `src/components/PreAgendaQuestionnaire.tsx`

Formulario modal compacto (mismo estilo que LoginDialog). Contiene:

**Preguntas por rol (checkboxes):**

Todos los roles (base DocentePlanta):
- `isInvestigadorPrincipal`: "¿Es investigador principal de un proyecto aprobado por la DII?" → 10h docencia directa + 11h investigación
- `isCoInvestigador`: "¿Participa como co-investigador en un proyecto aprobado?" → 13h docencia directa + 6h investigación  
- `isFormacionDoctorado`: "¿Está en formación de doctorado?" → hasta 8h docencia directa + 15h investigación
- `isFormacionMaestria`: "¿Está en formación de maestría?" → hasta 12h docencia directa + 7h investigación
- `isCoordinadorArea`: "¿Tiene a cargo la coordinación de un área?" → reducción de hasta 3h + 6h registro
- `isFormacionPedagogica`: "¿Participa en procesos de formación pedagógica avalados por Vicerrectoría?" → reducción de hasta 3h
- `isProduccionPendiente`: "¿Tiene compromisos de producción intelectual pendientes del semestre anterior?" → 16h obligatorias, sin tiempo para investigación
- `isDirectorDoctorado`: "¿Dirige un programa de Doctorado?" → 1 curso asignado
- `isDecano`: "¿Ejerce como Decano de Facultad?" → 1 curso asignado
- `isVicerrector`: "¿Ejerce como Vicerrector Académico?" → 1 curso asignado

Solo para DirectorPrograma (id_rol=2):
- `isDirectorPregrado`: "¿Es director de un programa de pregrado?" → 6h docencia directa
- `isDirectorPosgrado`: "¿Tiene a cargo la dirección de un programa de posgrado?" → reducción de 5h + 9h registro (máximo 2 direcciones acumulables)
- `cantidadPosgrados`: Si marcó dirección de posgrado, preguntar cantidad (1 o 2)

**Motor de cálculo de horas (en cliente):**

Prioridad de cálculo basada en la normativa:
1. Producción pendiente → fuerza 16h, sin investigación
2. Formación doctorado → hasta 8h (incompatible con investigación y cargos admin)
3. Formación maestría → hasta 12h
4. Investigador principal → 10h
5. Co-investigador → 13h
6. Director programa pregrado → 6h
7. Sin ninguna condición especial → 16h (default)
8. Reducciones acumulables: coordinación área (-3h), formación pedagógica (-3h), dirección posgrado (-5h por cada, máx 2)

**Motor de detección de conflictos:**

| Combinación | Tipo | Mensaje |
|---|---|---|
| Investigador principal + Co-investigador | Observación | Art. 6 Nota: participación múltiple requiere valoración de Vicerrectoría, Decano, Director y DII |
| Formación doctorado + Investigador/Co-investigador | Conflicto | Art. 6k: docente en formación doctoral no puede tener proyectos de investigación |
| Formación doctorado + Director programa/Coordinador área | Conflicto | Art. 6k: docente en formación doctoral no puede tener encargos académico-administrativos |
| Formación maestría + >12h docencia | Advertencia | Art. 6j: límite de 12 horas de docencia directa |
| Producción pendiente + Investigador/Co-investigador | Conflicto | Art. 6c: tiempo de investigación suspendido por incumplimiento |

**Resumen post-respuestas:**
- Horas semanales de docencia directa calculadas
- Lista de observaciones/conflictos con iconos diferenciados (warning/error)
- Botón "Confirmar y continuar" que guarda en DB y pasa a la agenda

### 3. Modificar flujo en `src/App.tsx`

```text
Login → ¿Tiene config confirmada para este semestre?
  → Sí: Mostrar agenda (Index)
  → No: Mostrar PreAgendaQuestionnaire
```

Agregar estado intermedio en `AppContent`:
- Consultar `docente_semester_config` para el usuario logueado
- Si no existe o `confirmed=false`, mostrar `PreAgendaQuestionnaire`
- Si `confirmed=true`, mostrar la agenda normal

### 4. Nuevo hook: `src/hooks/useDocenteConfig.ts`

- `useDocenteConfig(userCc)`: query para obtener la config del semestre actual
- `useUpsertDocenteConfig()`: mutation para insertar/actualizar config
- Exporta también la lógica de cálculo de horas y conflictos como funciones puras

### 5. Integración con agenda y comentarios

- Al confirmar la agenda (botón "Confirmar datos" en SummaryPanel), si existen conflictos en `docente_semester_config`, se insertan automáticamente como `agenda_comments` con el texto de cada conflicto/observación
- `AgendaContext` recibe las horas calculadas del pre-formulario como referencia para validaciones

### 6. Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| DB migration | Crear tabla `docente_semester_config` |
| `src/components/PreAgendaQuestionnaire.tsx` | Crear: formulario condicional completo |
| `src/hooks/useDocenteConfig.ts` | Crear: hooks de DB + lógica de cálculo/conflictos |
| `src/types/docenteConfig.ts` | Crear: tipos para preguntas, respuestas, conflictos |
| `src/App.tsx` | Modificar: agregar paso intermedio post-login |
| `src/components/SummaryPanel.tsx` | Modificar: insertar conflictos como comentarios al confirmar |
| `src/types/database.ts` | Agregar tipo `DbDocenteSemesterConfig` |

