# Plan — Desconectar Supabase del frontend y conectar al backend Express

## Objetivo

Reemplazar `@supabase/supabase-js` por `fetch()` nativo apuntando al backend Express en `:4000/api`, manteniendo intactos componentes, páginas, tipos, i18n, estilos y tests. La autenticación pasa a JWT (Bearer token en `localStorage`).

## Alcance real (verificado contra el código)

El prompt menciona 3 archivos a tocar (`AuthContext`, `useDatabase`, `package.json`). En realidad **14 archivos del frontend** importan o usan `supabase`. Todos deben migrarse para que la build no rompa al borrar `src/integrations/supabase/`.

```text
src/context/AuthContext.tsx              ← login con JWT
src/hooks/useDatabase.ts                 ← ~40 queries CRUD
src/hooks/useSystemEnabled.ts            ← system_settings + realtime
src/hooks/useDocenteConfig.ts            ← docente_config
src/hooks/useDashboardData.ts            ← dashboard
src/hooks/useSemesterArchive.ts          ← semester_archive
src/hooks/useRecommendationRules.ts      ← recommendation_rules
src/hooks/useLineamientosImport.ts       ← storage + edge function
src/context/AgendaContext.tsx            ← agenda persistence
src/components/ActivityManagementDialog.tsx
src/components/SubjectManagementDialog.tsx
src/components/AppSidebar.tsx
src/components/LoginDialog.tsx           ← request-password-reset
src/pages/SupportPanel.tsx               ← user CRUD + jerarquía
```

## Cambios

### 1. Cliente HTTP central — `src/lib/api.ts` (nuevo)

Wrapper sobre `fetch()` con inyección automática de `Authorization: Bearer <token>` desde `localStorage` (clave `ucp_token`). Expone `api.get / post / put / patch / delete` y `uploadFile()` para `multipart/form-data`. Lee `VITE_API_URL` (default `http://localhost:4000/api`).

### 2. `src/context/AuthContext.tsx` (reemplazar)

- `login()` llama a `POST /auth/login` con `{ username, password }`.
- Guarda `token` en `localStorage[ucp_token]` y `user` en `localStorage[ucp_session]`.
- `logout()` limpia ambas claves.
- Mantiene la misma forma `AuthState` y `getRoleName()` para no afectar a la UI.

### 3. `src/hooks/useDatabase.ts` (reescribir 1:1)

Cada `supabase.from('X').select/insert/update/delete()` se traduce a `api.get/post/put/delete('/X', ...)`. Se conservan todos los hooks y sus firmas (`useRoles`, `useAgendas`, `useUserHierarchy`, `useApprovedAgendaCcs`, `useFullyApprovedCareers`, etc.) para no tocar componentes.

Las queries compuestas (`useApprovedAgendaCcs`, `useFullyApprovedCareers`, `usePendingAgendaViewsForSupervisor`) seguirán componiendo varias llamadas en el `queryFn`, igual que ahora, pero contra los endpoints REST. Ejemplo: `supabase.from('users').select().in('id', ids)` → `api.get('/users?ids=1,2,3')` (el backend ya soporta filtros básicos por query string).

`findUserByCredentials()` se elimina — el login ya no hashea en cliente; lo hace el backend.

### 4. Hooks y componentes colaterales (migrar a `api`)

- `useSystemEnabled.ts`: `GET/PUT /system-settings/system_enabled`. **Se elimina realtime** (no hay WebSocket en el backend Express); se usa `refetchInterval: 15000` como en otros hooks de polling.
- `useDocenteConfig.ts`: `GET/POST /docente-config`.
- `useDashboardData.ts`, `useSemesterArchive.ts`, `useRecommendationRules.ts`: traducción directa a `api.get/post/...`.
- `AgendaContext.tsx`, `ActivityManagementDialog.tsx`, `SubjectManagementDialog.tsx`, `AppSidebar.tsx`, `SupportPanel.tsx`: reemplazar todos los `supabase.from(...)` por las llamadas equivalentes en `api`.

### 5. Subida de lineamientos — `useLineamientosImport.ts`

Hoy usa `supabase.storage.from('lineamientos').upload()` + `supabase.functions.invoke('parse-lineamientos')`. Migrar a:

- `POST /upload/parse-document` con `FormData` (campo `file`) usando `uploadFile()`. El backend ya integra `pdf-parse`/`mammoth` y devuelve el texto extraído, por lo que un único endpoint reemplaza storage + edge function.

### 6. Recuperación de contraseña — `LoginDialog.tsx`

`supabase.functions.invoke('request-password-reset')` → `api.post('/auth/forgot-password', { email })`. El flujo de reset ya existe en `backend/src/routes/auth.ts`.

### 7. `package.json`

Eliminar:
- `@supabase/supabase-js`

No se añade nada nuevo (se usa `fetch` + TanStack Query ya instalado).

### 8. Variables de entorno

- `.env` → `VITE_API_URL=http://localhost:4000/api`
- `.env.example` → mismo valor con comentario para producción UCP.
- Se eliminan las variables `VITE_SUPABASE_*`.

### 9. Borrar carpetas obsoletas

- `src/integrations/supabase/` (incluye `client.ts` y `types.ts`).
- `supabase/` (config, edge functions, seed) — el backend Express ya cubre su funcionalidad.
- `.lovable/` si existe.

### 10. Verificación

`npx tsc --noEmit` y `bunx vitest run` para asegurar que la migración no rompe tipos ni tests existentes.

## Lo que NO se toca

`src/components/ui/**`, `src/pages/**` (excepto `SupportPanel.tsx`), `src/types/**`, `src/i18n/**`, `src/data/**`, estilos, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `src/test/**`.

## Riesgos y notas

- **Realtime perdido**: `useSystemEnabled` y `useAllAgendaComments` ya no recibirán eventos push. Mitigación: polling (`refetchInterval`) — coherente con el resto de la app.
- **Endpoints faltantes**: el backend Express ya expone todos los endpoints listados (verificado en `backend/src/routes/`). Si alguno responde distinto a lo esperado durante la integración, se ajustará el `queryFn` correspondiente.
- **Tras desplegar**: el preview de Lovable seguirá funcionando para la UI, pero las llamadas API fallarán hasta que el contenedor `backend` esté corriendo en `localhost:4000` (o se ajuste `VITE_API_URL`).
