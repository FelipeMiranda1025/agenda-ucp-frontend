

## Análisis

**Reglas nuevas para `decanoFacultad`:**
- Solo ve agendas **aprobadas por `directorPrograma`** (status `approved` en `agenda_views` por un director).
- Sidebar arranca en **Nivel 1** (carreras de SU facultad), sin nivel 0 de facultades.
- Si una carrera no tiene agendas aprobadas por el director → botón deshabilitado, no avanza a nivel 2.
- Cuando el director aprueba TODAS las agendas de su carrera → notificación: *"Hay un programa por revisar — {nombre carrera}"*.

**Mejora notificación vicerrector:**
- Descripción debe incluir **carrera + facultad**: *"Hay un programa por revisar — {carrera} ({facultad})"*.

**Reto técnico — distinguir quién aprobó:**
Hoy `agenda_views.status='approved'` no dice quién aprobó. Para que vicerrector vea solo lo que aprobó el decano y decano vea solo lo que aprobó el director, necesitamos saber el **rol del aprobador**. Ya existe `reviewer_cc` → cruzamos con `users.id_rol` para filtrar:
- Decano ve agendas cuyo `reviewer_cc` corresponde a un usuario con `id_rol = 2` (DirectorPrograma) Y el docente pertenece a su facultad.
- Vicerrector ve agendas cuyo `reviewer_cc` corresponde a un usuario con `id_rol = 3` (DecanoFacultad).

Esto reemplaza la lógica actual de `useApprovedAgendaCcs` que solo mira `status='approved'` sin filtrar por rol del aprobador.

## Diseño

### 1. `useDatabase.ts` — refactor de hooks de aprobación

**`useApprovedAgendaCcs(forRole)`** — parametrizar:
- `forRole='vicerrector'` → trae CCs de docentes cuyas agendas están `approved` por un usuario con rol 3 (decano).
- `forRole='decano'` → trae CCs de docentes cuyas agendas están `approved` por un usuario con rol 2 (director). Filtrado además por facultad del decano logueado.

**`useFullyApprovedCareers(forRole)`** — parametrizar:
- `forRole='vicerrector'`: carrera completa = todos sus docentes activos tienen agenda aprobada por su decano (rol 3). Devuelve `{careerId, careerName, facultyName}`.
- `forRole='decano'`: carrera completa = todos los docentes de esa carrera (dentro de la facultad del decano) tienen agenda aprobada por su director (rol 2). Devuelve `{careerId, careerName}`.

### 2. `AgendaContext.tsx` — `docentesList` para decano
- Decano ya usa `useSubordinatesWithNames` (jerarquía). Mantener.
- Pero filtrar adicionalmente en sidebar contra el set de aprobados-por-director.

### 3. `AppSidebar.tsx` — comportamiento decano
- Detectar `roleName === "DecanoFacultad"`.
- **Saltar nivel 0**: arrancar `navView = "careers"` y `selectedFacultyId = currentUser.id_faculty` automáticamente al montar (si rol es decano).
- Botón "Volver" del nivel 1 oculto/deshabilitado para decano (no hay raíz a la cual volver).
- Filtrar `subordinates` contra `approvedSet` (agendas aprobadas por director).
- Carreras sin agendas aprobadas → botón deshabilitado (igual que vicerrector).

### 4. `Index.tsx` — notificaciones
- Para decano: usar `useFullyApprovedCareers('decano')` → notificación *"Hay un programa por revisar — {carrera}"*.
- Para vicerrector: actualizar mensaje a *"Hay un programa por revisar — {carrera} ({facultad})"*.
- Mismo sistema `localStorage` `read_career_{id}` ya existe.

### 5. Traducciones
- Actualizar `notifications.programReady` para soportar interpolación con `{career}` y `{faculty}`.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Refactor `useApprovedAgendaCcs` y `useFullyApprovedCareers` aceptando `forRole: 'vicerrector' \| 'decano'`. Cruzar `agenda_views.reviewer_cc` con `users.id_rol` (2 director / 3 decano). Devolver `{id, name, facultyName?}` para enriquecer notificación |
| `src/components/AppSidebar.tsx` | Detectar rol decano: arrancar en nivel 1 con su facultad fija, ocultar botón volver al nivel 0, filtrar contra aprobadas-por-director. Reutilizar lógica de carreras deshabilitadas |
| `src/pages/Index.tsx` | Para decano: notificación con nombre de carrera. Para vicerrector: notificación con carrera + facultad |
| `src/i18n/translations.ts` | Ajustar `notifications.programReady` para incluir interpolación de carrera y facultad |

