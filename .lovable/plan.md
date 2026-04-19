

## Análisis

**Reglas de negocio nuevas:**
- `vicerrectorAcademico` (rol 4) y `soporte` (rol 5) **no pertenecen** a ninguna facultad/carrera (`id_faculty` / `id_professional_career` = NULL).
- `vicerrectorAcademico` ve **TODAS** las agendas del sistema (no usa `user_hierarchy`).
- `soporte` no tiene UI de agenda — solo CRUD usuarios (ya existe `/support`).
- Para `vicerrectorAcademico`: el sidebar **siempre muestra las 4 facultades completas** (no solo las que tienen subordinados), y **siempre muestra todas las carreras** de la facultad seleccionada. Solo el nivel 2 (docentes) se condiciona: si la carrera no tiene docentes con agenda, el click no avanza.

**Estado actual del código:**
- `useSubordinatesWithNames` filtra por `user_hierarchy` → no sirve para vicerrector.
- `AppSidebar` solo lista facultades/carreras que tienen subordinados (lógica de "pruning") → para vicerrector hay que mostrar TODO el catálogo.
- Faltan filtros en BD para los usuarios vicerrector/soporte (deben tener faculty/career = NULL).

## Diseño

### 1. Datos
- **Migración SQL**: `UPDATE users SET id_faculty = NULL, id_professional_career = NULL WHERE id_rol IN (4, 5);`
- **Nuevo hook** `useAllDocentes()` en `useDatabase.ts`: trae **todos** los usuarios con rol 1, 2 o 3 (sin filtrar por jerarquía). Devuelve la misma forma que `SubordinateDocente`.

### 2. `AgendaContext` / `useAgenda`
- Detectar si el usuario actual es `vicerrectorAcademico`. Si lo es, `docentesList` = `useAllDocentes()` en lugar de `useSubordinatesWithNames()`.
- Mantener entrada "Yo" (el propio vicerrector, aunque no tenga agenda propia que diligenciar — sigue siendo el atajo de retorno).

### 3. `AppSidebar` — comportamiento condicional por rol

**Para vicerrectorAcademico:**
- **Nivel 0 (raíz):** mostrar `useFaculties()` completo (las 4 facultades), **siempre**, sin importar si tienen docentes.
- **Nivel 1 (carreras):** mostrar `useProfessionalCareers().filter(c => c.id_faculty === selectedFacultyId)` completo, **siempre**.
- **Nivel 2 (docentes):** solo navegar si existen docentes en esa carrera. Si no hay, el botón de carrera queda visible pero **deshabilitado** (estilo `opacity-50 cursor-not-allowed`) y muestra "Sin agendas" como contador en lugar del número.

**Para los demás roles (DirectorPrograma, DecanoFacultad):**
- Comportamiento actual sin cambios (pruning de facultades/carreras vacías vía `user_hierarchy`).

**Para Soporte:** el sidebar de docente no se muestra (ya redirige a `/support`).

### 4. Lógica visual del nivel 1 (vicerrector)
```text
┌─────────────────────────────────┐
│ ← Facultad de Arq. y Diseño     │
│ ▸ Diseño Industrial         3   │  ← clickable
│ ▸ Arquitectura              5   │  ← clickable
│ ▸ Maestría en Arq. y Urb.   —   │  ← disabled (sin agendas)
│ ▸ Esp. en Construcción Sost — │  ← disabled
└─────────────────────────────────┘
```

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | `UPDATE users SET id_faculty=NULL, id_professional_career=NULL WHERE id_rol IN (4,5)` |
| `src/hooks/useDatabase.ts` | Nuevo hook `useAllDocentes()` que trae todos los usuarios con rol 1/2/3 (sin filtrar jerarquía), misma forma que `SubordinateDocente` |
| `src/context/AgendaContext.tsx` | Si `roleName === 'VicerrectorAcadémico'`, usar `useAllDocentes()` en vez de `useSubordinatesWithNames()` para poblar `docentesList` |
| `src/components/AppSidebar.tsx` | Detectar rol vicerrector; en ese caso renderizar **todas** las facultades y **todas** las carreras del catálogo, no solo las que tienen subordinados. Carreras sin docentes con agenda → botón deshabilitado (sin avance al nivel 2) |

