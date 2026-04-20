

## Análisis

El usuario quiere un nuevo ítem **"Dashboard"** en el menú del avatar del Vicerrector (rolId=4), ubicado **encima de "Interruptor"** (entre "Ajustes" y "Interruptor"). Al hacer clic, abre una página nueva (`/dashboard`) con gráficas totalizadoras de TODA la actividad registrada en la app, con filtros por docente, facultad y/o programa, para generar reportes.

### Datos disponibles
- `agendas` (jsonb `data`, `subfunction_id`, `docente_cc`, `total_horas`) → fuente principal de registros por subfunción.
- `agenda_views` (`status`: pending/approved/returned, `user_cc`, `reviewer_cc`, `reviewed_at`) → estado de aprobaciones.
- `users` (cc, nombres, `id_faculty`, `id_professional_career`, `id_rol`).
- `faculties`, `professional_careers`, `subjects`.
- 11 subfunciones (`subfunctions.ts`): Docencia Directa, Indirecta, Trabajos de Grado, Prácticas, Investigación, Proyección Social, Complementarias, Formación Docentes, Administrativas, etc.

## Estructura de la página `/dashboard`

Layout:
- **Header**: título "Dashboard de reportes", botón "Volver", botón "Exportar PDF" (futuro, opcional v1).
- **Barra de filtros** (sticky, parte superior):
  - Combobox **Docente** (con búsqueda — todos los docentes o "Todos").
  - Select **Facultad** ("Todas" / cada facultad).
  - Select **Programa** (filtrado por facultad seleccionada / "Todos").
  - Select **Estado de agenda** (Todos / Aprobada / Pendiente / Devuelta).
  - Botón "Limpiar filtros".
- **Cards de KPIs** (4 tarjetas resumen, top):
  1. Total docentes con agenda registrada
  2. Total horas semestrales acumuladas
  3. % Agendas aprobadas
  4. Promedio horas/docente
- **Gráficas** (grid 2 columnas, 1 col en móvil), una por subfunción + cruzadas:
  1. **Barras horizontales** — Total horas por subfunción (Docencia Directa, Indirecta, Investigación, Proyección Social, Complementarias, Formación, Administrativas, Trabajos de Grado, Prácticas).
  2. **Pastel** — Estados de agenda (Aprobadas / Pendientes / Devueltas).
  3. **Barras** — Docentes que dictaron 16 horas exactas de Docencia Directa vs. otros (cumplimiento norma).
  4. **Barras apiladas** — Distribución de horas por docente (top 10) según subfunción.
  5. **Barras** — Total horas por facultad.
  6. **Barras** — Total horas por programa (top 10 si "Todos").
  7. **Pastel** — Distribución de actividades académico-administrativas aprobadas (cuenta de docentes con `administrativas` aprobadas).
  8. **Línea/Barras** — Aprobaciones por mes (últimos 6 meses, según `reviewed_at`).
  9. **Barras** — Cantidad total de proyectos de Trabajos de Grado.
  10. **Barras** — Cantidad total de estudiantes en Prácticas Académicas.

Todas las gráficas se recalculan reactivamente al cambiar filtros (en cliente con `useMemo`).

## Arquitectura técnica

### 1. Hook nuevo `src/hooks/useDashboardData.ts`
Una sola query consolidada que trae:
- `agendas` (todas, con `data`, `subfunction_id`, `docente_cc`, `total_horas`)
- `agenda_views` (todas)
- `users` (todos los docentes — rolId 1, 2, 3) con join virtual a `faculties`/`professional_careers`
- `faculties`
- `professional_careers`

Devuelve estructura normalizada lista para filtrado/agregación.

### 2. Página nueva `src/pages/Dashboard.tsx`
- Protegida: solo `rolId === 4` (Vicerrector). Si otro rol entra, redirige a `/`.
- Usa `useDashboardData()` + estado local de filtros.
- `useMemo` para agregaciones derivadas (por subfunción, facultad, programa, docente).
- Renderiza KPIs + grid de `ChartContainer` (recharts ya disponible en `src/components/ui/chart.tsx`).

### 3. Componentes auxiliares (en mismo archivo o separados)
- `<KpiCard title value icon />`
- `<DashboardFilters />` (Combobox docente con `cmdk`, igual patrón que asignatura).
- Cada gráfica como sub-componente pequeño dentro de `Dashboard.tsx`.

### 4. Ruta `src/App.tsx`
Añadir `<Route path="/dashboard" element={<Dashboard />} />`.

### 5. `src/pages/Index.tsx`
Insertar nuevo `DropdownMenuItem` **antes** del bloque del Interruptor (línea 409), visible solo si `user?.rolId === 4`:
```tsx
<DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2 cursor-pointer">
  <BarChart3 className="h-4 w-4" /> {t("profile.dashboard")}
</DropdownMenuItem>
```
Importar `BarChart3` de lucide-react.

### 6. i18n `src/i18n/translations.ts`
Añadir claves ES/EN: `profile.dashboard`, `dashboard.title`, `dashboard.back`, `dashboard.filters.*`, `dashboard.kpi.*`, `dashboard.chart.*`, etc.

## Reglas de agregación clave
- **"Cuántos docentes dictaron 16 h de Docencia Directa"**: contar docentes únicos cuya suma de `horasSemana` en registros de `subfunction_id='docencia-directa'` sea exactamente 16 (cumple norma).
- **"Aprobados de actividades académico-administrativas"**: cruzar `agendas` con `subfunction_id='administrativas'` y `agenda_views.status='approved'` por `docente_cc=user_cc`.
- **Filtros**: si Docente seleccionado → filtrar todo a sus agendas; si Facultad → filtrar usuarios con `id_faculty` y luego sus agendas; idem Programa.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useDashboardData.ts` | **Nuevo** — Queries consolidadas (agendas + agenda_views + users + faculties + careers) |
| `src/pages/Dashboard.tsx` | **Nuevo** — Página con filtros, KPIs y 10 gráficas usando recharts |
| `src/App.tsx` | Añadir ruta `/dashboard` |
| `src/pages/Index.tsx` | Añadir `DropdownMenuItem` "Dashboard" encima de "Interruptor" (solo rolId=4) |
| `src/i18n/translations.ts` | Claves ES/EN para Dashboard, filtros, KPIs y títulos de gráficas |

