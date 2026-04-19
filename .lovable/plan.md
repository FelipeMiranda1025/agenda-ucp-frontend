

## Análisis

**Estado actual del DirectorPrograma:**
- `AgendaContext` usa `useSubordinatesWithNames(user.id)` → trae todos los subordinados según `user_hierarchy` (docentes asignados al director).
- En el sidebar, el director ve la lista de docentes en el "Nivel 0/raíz" (sin filtro por carrera ni por estado de agenda).
- No hay filtrado por agendas confirmadas/aprobadas — un director ve a todos sus subordinados aparezca o no su agenda.

**Reglas nuevas para `DirectorPrograma`:**
1. Solo ver docentes (`DocentePlanta`, rol 1) que pertenezcan a **su misma carrera profesional** (`id_professional_career`). Esto refuerza la jerarquía: aunque `user_hierarchy` ya debería garantizarlo, agregamos el filtro defensivo en el sidebar.
2. Solo ver agendas que el `DocentePlanta` ya **diligenció y confirmó** (existe registro en `agenda_views` con `status` ∈ {`pending`, `approved`, `returned`} — basta con que el docente la haya enviado para revisión: status `pending`). Misma idea que vicerrector/decano pero un nivel abajo.
3. Mantener su estructura simple: no necesita niveles de Facultad/Carrera (todos los docentes visibles ya son de su misma carrera) → sigue mostrándolos como lista plana bajo "Yo".

**Reto técnico — quién diligenció:**
Para vicerrector/decano filtramos por `agenda_views.status='approved'` + rol del aprobador. Para el director NO necesitamos un aprobador previo (él es el primer revisor en la cadena). Basta con que exista una `agenda_views` para ese `user_cc` con status diferente de `null` (es decir, la agenda fue confirmada al menos una vez por el docente). 

Reutilizaremos `useApprovedAgendaCcs` parametrizándolo con un nuevo valor `forRole='director'` que devuelva todos los `user_cc` que tengan al menos una `agenda_view` (sin importar status ni reviewer), restringido a docentes con rol 1 dentro de la misma carrera del director.

## Diseño

### 1. `useDatabase.ts` — extender `useApprovedAgendaCcs`
- Aceptar `forRole: 'vicerrector' | 'decano' | 'director'`.
- Caso `'director'`:
  - Obtener `id_professional_career` del director (por `currentUserCc`).
  - Traer `agenda_views.user_cc` (cualquier status — basta que exista el registro porque solo se crea al confirmar).
  - Cruzar contra `users` filtrando `id_rol=1` y `id_professional_career=<carrera del director>`.
  - Devolver el set de `cc`.

### 2. `AppSidebar.tsx` — comportamiento director
- Detectar `roleName === "DirectorPrograma"`.
- Llamar `useApprovedAgendaCcs('director', user.id, isDirector)`.
- Filtrar `subordinates` contra `approvedSet` (mismo patrón que vicerrector/decano).
- Como el director no necesita navegación por facultad/carrera, mantener el render plano actual (lista directa bajo "Yo") pero solo sobre el set filtrado.
- No tocar la jerarquía de niveles existente para vicerrector/decano.

### 3. Sin cambios en notificaciones
El director no recibe alerta de "programa por revisar" — esa lógica es exclusiva de decano/vicerrector. No se modifica `Index.tsx` ni traducciones.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Extender `useApprovedAgendaCcs` para soportar `forRole='director'`: devuelve CCs de docentes (rol 1) en la misma carrera del director que tengan al menos una `agenda_view` registrada |
| `src/components/AppSidebar.tsx` | Detectar rol director; consumir `useApprovedAgendaCcs('director', user.id)`; filtrar subordinados visibles contra ese set en la sección plana de docentes |

