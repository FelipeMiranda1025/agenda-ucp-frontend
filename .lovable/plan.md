

## Análisis

El usuario quiere que el VicerrectorAcadémico (rolId=4) tenga un nuevo ítem en su menú del avatar, debajo de "Ajustes", llamado **"Interruptor"**, que actúa como switch global del sistema:

- **Encendido (default)**: comportamiento actual.
- **Apagado**: todos los demás roles (DocentePlanta, DirectorPrograma, DecanoFacultad) ven una pantalla de "Sistema en mantenimiento" al iniciar sesión y NO pueden acceder a la app. Soporte (rol 5) y VicerrectorAcadémico (rol 4) siguen accediendo normalmente.

El estado debe persistir en BD (afecta a todos los usuarios) y reflejarse en tiempo real para los usuarios ya logueados.

## Cambios

### 1. Base de datos — nueva tabla `system_settings`

Migración:
- Tabla con una sola fila singleton: `key text PK`, `value jsonb`, `updated_at`, `updated_by text`.
- Insertar fila inicial: `('system_enabled', '{"enabled": true}')`.
- RLS: lectura pública (anon+authenticated); update permitido (la app valida rol antes de mutar, igual que el resto del proyecto).
- Habilitar realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings`.

### 2. Hook nuevo `src/hooks/useSystemEnabled.ts`
- `useSystemEnabled()`: query a `system_settings` donde `key='system_enabled'`, devuelve `boolean`.
- Suscripción realtime a `postgres_changes` para invalidar la query cuando cambie.
- `useToggleSystemEnabled()`: mutación que hace upsert con el nuevo valor + `updated_by = user.id`.

### 3. `src/pages/Index.tsx`
- Agregar ítem `DropdownMenuItem` debajo de "Ajustes", visible solo si `user?.rolId === 4`:
  - Icono `Power` de lucide-react.
  - Label: `t("profile.systemSwitch")` ("Interruptor" / "System Switch").
  - Al hacer clic abre un `AlertDialog` de confirmación con el estado actual ("Encendido / Apagado") y un botón para alternar.
- Mostrar un badge sutil junto al ítem indicando el estado actual (punto verde/rojo).

### 4. Bloqueo global — `src/App.tsx`
- En `AppContent`, después de validar `isAuthenticated`, leer `useSystemEnabled()`.
- Si `enabled === false` y `roleName !== "Soporte"` y `roleName !== "VicerrectorAcadémico"` → renderizar pantalla de mantenimiento (componente nuevo `SystemMaintenance.tsx`) con icono, mensaje y botón de cerrar sesión.

### 5. `src/components/SystemMaintenance.tsx` (nuevo)
Pantalla full-screen con logo UCP, icono de candado/herramientas, título "Sistema en mantenimiento", subtítulo explicativo y botón "Cerrar sesión".

### 6. i18n — `src/i18n/translations.ts`
Agregar claves:
- `profile.systemSwitch` → "Interruptor" / "System Switch"
- `profile.systemSwitchOn` / `Off`
- `profile.systemSwitchConfirmTitle/Description/Action`
- `maintenance.title` → "Sistema en mantenimiento" / "System under maintenance"
- `maintenance.description` → "El acceso al sistema fue temporalmente deshabilitado por el Vicerrector Académico. Intente más tarde."
- `maintenance.logout` → "Cerrar sesión"

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `system_settings`, insertar fila inicial, RLS, realtime |
| `src/hooks/useSystemEnabled.ts` | Nuevo hook con query + realtime + mutación toggle |
| `src/pages/Index.tsx` | Nuevo `DropdownMenuItem` "Interruptor" con AlertDialog (solo rolId=4) |
| `src/App.tsx` | Renderizar `SystemMaintenance` cuando enabled=false y rol bloqueado |
| `src/components/SystemMaintenance.tsx` | Nuevo componente pantalla de mantenimiento |
| `src/i18n/translations.ts` | Claves ES/EN para interruptor y mantenimiento |

