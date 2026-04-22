

## Análisis

El Dashboard se renderiza dentro de `<AgendaErrorBoundary><AgendaProvider>...` (`src/App.tsx` líneas 64-79). Cuando el Vicerrector entra a `/dashboard` y no existen agendas creadas/aprobadas, `AgendaProvider` falla al inicializar (no encuentra registros del usuario actual → lanza error) y la `AgendaErrorBoundary` muestra `"Error al cargar la agenda. Recarga la página."` con pantalla en blanco.

Adicionalmente, `Dashboard.tsx` tampoco maneja el caso `isError` del hook `useDashboardData` ni un dataset vacío de forma explícita: si la query falla, queda atrapado en el spinner de "loading" indefinidamente (líneas 307-313).

## Solución

### 1. Sacar `Dashboard` (y otras rutas que no necesitan agenda) del `AgendaProvider`
En `src/App.tsx` reorganizar `AppContent` así:
- `BrowserRouter` envuelve TODAS las rutas.
- Las rutas que **no** dependen del `AgendaProvider` (`/dashboard`, `/audit`, `/profile`) se montan directamente.
- Sólo `/` y `/schedule` se envuelven en `<AgendaErrorBoundary><AgendaProvider>...`.

```text
BrowserRouter
├── /dashboard      → <Dashboard />        (sin AgendaProvider)
├── /audit          → <AuditLog />         (sin AgendaProvider)
├── /profile        → <Profile />          (sin AgendaProvider)
├── /               → <AgendaErrorBoundary><AgendaProvider><Index/></...>
├── /schedule       → <AgendaErrorBoundary><AgendaProvider><ScheduleBuilder/></...>
└── *               → <NotFound />
```

Esto elimina la causa raíz del "Ha ocurrido un error" al entrar a `/dashboard`.

### 2. `Dashboard.tsx` — degradación elegante con dataset vacío
- Extraer también `isError` y `error` de `useDashboardData()`.
- Reemplazar el guard actual (`if (isLoading || !data || !kpis)`) por:
  - Si `isLoading` → spinner.
  - Si `isError` → banner de aviso (no pantalla blanca) **encima del framework** + continuar renderizando con dataset vacío.
  - Si `data` está disponible pero vacío → renderizar normalmente; los `useMemo` ya producen arrays vacíos y KPIs en 0.
- Asegurar que `kpis` nunca sea `null`: cambiar `if (!filtered) return null;` por `if (!filtered) return { docentesConAgenda: 0, totalHoras: 0, pctAprobadas: 0, promedio: 0 };`.
- Igual para `filtered`: cuando `data` no existe, devolver una estructura vacía coherente (`{ agendas: [], views: [], users: [], faculties: [], careers: [], userByCc: new Map(), allowedCcs: new Set(), latestViewByCc: new Map() }`) en lugar de `null`, para que todos los `useMemo` sigan devolviendo `[]`.
- Añadir, debajo de los KPIs, un mensaje sutil `t("dashboard.noData")` ("Aún no hay agendas registradas") cuando `agendas.length === 0` — la página sigue siendo navegable y muestra todo en cero.

### 3. i18n — clave nueva
- `dashboard.noData` ES: "Aún no hay agendas registradas. Las estadísticas se mostrarán en cero hasta que existan datos." / EN equivalente.
- `dashboard.error`: "No se pudo cargar la información. Mostrando dashboard en cero." / EN equivalente.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Mover `BrowserRouter` afuera del `AgendaProvider`; envolver sólo `/` y `/schedule` con `<AgendaErrorBoundary><AgendaProvider>`. `/dashboard`, `/audit`, `/profile`, `*` van fuera |
| `src/pages/Dashboard.tsx` | `filtered` y `kpis` devuelven estructura vacía en lugar de `null`; manejar `isError`; banner cuando no hay agendas; renderizar siempre el framework |
| `src/i18n/translations.ts` | Añadir `dashboard.noData` y `dashboard.error` (ES/EN) |

