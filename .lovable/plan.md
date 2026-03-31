

# Plan: Mejoras integrales al sistema de Agenda Docente

## Resumen ejecutivo
Se implementarán 14 cambios agrupados en 7 bloques de trabajo: validación de login, sistema de inactividad con cierre de sesión, rediseño del formulario filtro con nuevas reglas de negocio, mejoras a formularios, mensaje recomendativo de asesorías, lógica condicional de horas, y sistema de comentarios globales con notificaciones.

---

## Bloque 1: Validación de cédula mínimo 6 caracteres (Punto 1)

**Archivos:** `src/components/LoginDialog.tsx`, migración SQL

- Cambiar la validación de cédula de 8 a 6 caracteres mínimos en `getUsernameError()`
- Cambiar el mensaje de error a "Mínimo de 6 caracteres"
- Agregar constraint CHECK en la tabla `users` para `cc`: `LENGTH(cc) >= 6`

---

## Bloque 2: Sistema de inactividad y cierre de sesión (Punto 2)

**Archivos:** `src/context/AuthContext.tsx`, nuevo componente `src/components/InactivityWarning.tsx`, `src/App.tsx`

- Crear un hook/componente `InactivityMonitor` que:
  - Detecte inactividad (mousemove, keydown, click, scroll) con temporizador de 5 minutos
  - A los 4 minutos (faltando 1 min), muestre un diálogo modal con cuenta regresiva de 60 segundos
  - El mensaje: "El sistema se cerrará por inactividad en los próximos segundos: XX"
  - Al llegar a 0, ejecute `logout()` del AuthContext
  - Cualquier interacción del usuario reinicia el temporizador
- La sesión en `localStorage` no cambia; al cerrar sesión por inactividad:
  - Si `docente_semester_config.confirmed = false` → el formulario filtro reaparece automáticamente (ya funciona así)
  - Si `confirmed = true` → carga la agenda con registros existentes (ya funciona así)

---

## Bloque 3: Rediseño del formulario filtro (Punto 3, 6-13)

**Archivos:** `src/types/docenteConfig.ts`, `src/hooks/useDocenteConfig.ts`, `src/components/PreAgendaQuestionnaire.tsx`

### 3.1 Nuevas preguntas con checkboxes duales

Reemplazar las preguntas actuales por el siguiente esquema. Cada pregunta con "De 1 o 2" tendrá dos checkboxes independientes (ej: "1 proyecto" y "2 proyectos"):

| Pregunta | Tipo | Campos en DocenteResponses |
|---|---|---|
| ¿Eres investigador principal? | 1 o 2 checkboxes | `investPrincipal1`, `investPrincipal2` |
| ¿Eres co-investigador? | 1 o 2 checkboxes | `coInvestigador1`, `coInvestigador2` |
| ¿Eres jefe de depto/director pregrado? | 1 checkbox | `isJefeDeptoPregrado` |
| ¿Eres director de posgrado? | 1 o 2 checkboxes | `dirPosgrado1`, `dirPosgrado2` |
| ¿Eres coordinador de área? | 1 checkbox | `isCoordinadorArea` |
| ¿Eres director de doctorado? | 1 checkbox | `isDirectorDoctorado` |
| ¿Eres decano de facultad? | 1 checkbox | `isDecano` |
| ¿Eres vicerrector académico? | 1 checkbox | `isVicerrector` |
| ¿Estás en formación de doctorado? | 1 checkbox | `isFormacionDoctorado` |
| ¿Estás en formación de maestría? | 1 checkbox | `isFormacionMaestria` |
| ¿Estás en formación pedagógica? | 1 checkbox | `isFormacionPedagogica` |

Se eliminará `isProduccionPendiente`, `isDirectorPregrado`, `cantidadPosgrados`, y se añadirán los nuevos campos.

### 3.2 Lógica de horas y bloqueos

Reescribir `calculateHours()` con estas reglas:

| Selección | Horas docencia directa | Asignaturas recomendadas |
|---|---|---|
| Invest. Principal x1 | 10h | 3 |
| Invest. Principal x2 | 4h | 1 |
| Co-investigador x1 | 13h | 4 |
| Co-investigador x2 | 9h | 3 |
| Invest. Principal x1 + Co-invest. x1 | 6h | 3 |
| Jefe depto/director pregrado | 6h | 2 |
| Director posgrado x1 | 11h | 4 |
| Director posgrado x2 | 6h (17h semanales en resumen) | 3 |
| Coordinador de área | 13h | 4 |
| Director doctorado / Decano / Vicerrector | (base 4h) | 1 |
| Formación doctorado | 8h | 2 |
| Formación maestría | 12h | 4 |
| Formación pedagógica | 13h | 4 |

**Reglas de bloqueo:**
- Invest. Principal x2 → bloquea Co-investigador (ambos)
- Co-investigador x2 → bloquea Invest. Principal (ambos)
- Máximo 2 proyectos combinados (cualquier mezcla)
- Formación doctorado → bloquea TODAS las demás opciones excepto sí misma

### 3.3 Pre-carga en resumen de registros

Al confirmar el formulario filtro, las selecciones se pre-cargan como registros en el `AgendaContext` en las subfunciones correspondientes (investigación, administrativas, formación docentes, etc.) para que aparezcan en el panel de resumen.

---

## Bloque 4: Ajustes a formularios (Puntos 3, 3.1, 4)

**Archivos:** `src/components/SubfunctionForm.tsx`

### 4.1 Eliminar "Total de horas semanales" de todos los formularios excepto docencia directa
- Condicionar la sección final del componente para que solo se muestre cuando `resolvedId === "docencia-directa"`.

### 4.2 Mensaje recomendativo de asignaturas bajo docencia directa
- Debajo del total de horas semanales, añadir: "Se recomiendan X asignaturas" donde X proviene de la configuración del formulario filtro (calculado según las reglas del Bloque 3).

### 4.3 Botón "Limpiar" en todos los formularios
- Mover el botón `Eraser` (actualmente solo en docencia-directa) al header de TODOS los formularios.

---

## Bloque 5: Mensaje recomendativo de asesorías (Punto 5)

**Archivos:** `src/components/SubfunctionForm.tsx`, `src/context/AgendaContext.tsx`

- En los formularios de "Trabajos de grado" y "Prácticas académicas", mostrar un mensaje compartido: "Se recomienda X asesorías" donde X empieza en 4
- Cada registro agregado en trabajos de grado resta 1 al contador
- Cada registro agregado en prácticas académicas resta 1 al contador
- El mínimo combinado debe ser 4 entre ambos formularios
- El contador se calcula en tiempo real desde los records del AgendaContext

---

## Bloque 6: Director posgrado x2 — ajuste especial en resumen (Punto 8)

**Archivos:** `src/context/AgendaContext.tsx`, `src/components/SummaryPanel.tsx`

- Cuando el formulario filtro indica director de posgrado x2, los registros pre-cargados mostrarán 17h semanales en total (no 9+9=18), con una lógica especial de ajuste en el cálculo de métricas.

---

## Bloque 7: Comentarios globales y notificaciones (Punto 14)

**Archivos:** `src/components/AgendaComments.tsx`, `src/pages/Index.tsx`, `src/context/AgendaContext.tsx` o nuevo contexto de notificaciones

- Los comentarios en el panel de resumen serán globales (visibles para todos los actores/roles)
- Al enviar un comentario, el campo se limpiará automáticamente (ya funciona así)
- Los comentarios se mostrarán en el apartado de comentarios en la parte superior (sección de mensajes en el header)
- Para otros actores distintos al autor, se incrementará el badge de la campanita con una nueva notificación
- La notificación persistirá hasta que el usuario abra el dropdown de notificaciones
- Se usará estado local (o un campo en BD) para rastrear comentarios no leídos por usuario

### Detalle técnico de notificaciones
- Agregar campo `read_by` (text[]) a la tabla `agenda_comments` para rastrear quiénes han leído cada comentario
- Al abrir el dropdown de notificaciones, marcar los comentarios como leídos para el usuario actual
- El badge muestra el count de comentarios donde `user.id NOT IN read_by`

---

## Migración SQL necesaria

```sql
-- 1. Constraint mínimo 6 caracteres en cc
ALTER TABLE public.users ADD CONSTRAINT users_cc_min_length CHECK (LENGTH(cc) >= 6);

-- 2. Campo read_by en agenda_comments
ALTER TABLE public.agenda_comments ADD COLUMN read_by text[] DEFAULT '{}';
```

---

## Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `src/components/LoginDialog.tsx` | Modificar validación cédula a 6 chars |
| `src/components/InactivityWarning.tsx` | **Crear** — modal cuenta regresiva |
| `src/App.tsx` | Agregar InactivityMonitor |
| `src/context/AuthContext.tsx` | Sin cambios mayores |
| `src/types/docenteConfig.ts` | Rediseñar DocenteResponses con nuevos campos |
| `src/hooks/useDocenteConfig.ts` | Reescribir QUESTIONS, calculateHours, detectConflicts |
| `src/components/PreAgendaQuestionnaire.tsx` | Rediseñar UI con checkboxes duales y bloqueos |
| `src/components/SubfunctionForm.tsx` | Eliminar total horas (excepto DD), botón limpiar global, mensaje recomendativo |
| `src/components/SummaryPanel.tsx` | Ajustar pre-carga de registros del filtro |
| `src/context/AgendaContext.tsx` | Pre-cargar registros desde config, lógica asesorías compartidas |
| `src/components/AgendaComments.tsx` | Comentarios globales |
| `src/pages/Index.tsx` | Notificaciones con badge dinámico |
| Migración SQL | Constraints y columna read_by |

