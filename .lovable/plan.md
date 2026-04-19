

## Análisis

El usuario pide 5 cambios al `SettingsDialog`:
1. Renombrar columna "Horas" → "Horas semanales"
2. Renombrar "Asignaturas" → "# asignaturas recomendadas"
3. Botón "Añadir nuevo lineamiento"
4. Reemplazar "borrar" por toggle **Activo/Inactivo** (la tabla actualmente no tiene `delete` UI, pero sí debe haber un switch de estado)
5. Botón con icono de **ojo** para mostrar/ocultar lineamientos inactivos

Adicionalmente, las reglas inactivas deben **excluirse** del cálculo en `useRecommendations` (si está inactiva, no aplica).

## Diseño

### 1. Migración SQL
- `ALTER TABLE recommendation_rules ADD COLUMN active boolean NOT NULL DEFAULT true`
- Las 14 reglas existentes quedan en `active=true`.

### 2. `src/hooks/useRecommendationRules.ts`
- Añadir campo `active` a la interface `RecommendationRule`.
- Nuevo hook `useCreateRecommendationRule()` — inserta `{category, rule_key, label, hours, subjects, default_hours, default_subjects, priority, active}`.
- Nuevo hook `useToggleRecommendationRuleActive()` — actualiza `active` por id.
- `useRecommendationRules()` se mantiene (trae todas las reglas activas e inactivas; el filtrado por activo se hace en consumidores).

### 3. `src/hooks/useRecommendations.ts`
- En `getRule()`: si la regla existe pero `active === false`, devolver `FALLBACK[key]` (la regla está desactivada → no se aplica el override; se mantiene comportamiento por defecto).
- Mejor aún: filtrar `rules` por `active===true` antes de pasar a `getRule`. Mantengo lógica idéntica.

### 4. `src/components/SettingsDialog.tsx`
- **Cabecera de tab**: añadir toolbar con:
  - Botón icono **Eye/EyeOff** (toggle local `showInactive`) para mostrar/ocultar reglas con `active=false`.
  - Botón **"+ Añadir lineamiento"** que abre un sub-formulario inline (o un dialog anidado) para capturar: `label`, `hours`, `subjects` (la `category` se infiere del tab activo, `rule_key` se autogenera tipo `custom_<timestamp>`, `priority=0`, `default_hours=hours`, `default_subjects=subjects`, `active=true`).
- **En cada fila**: 
  - Sustituir labels: `"Horas semanales"` y `"# asignaturas recomendadas"`.
  - Añadir un `Switch` etiquetado **Activo/Inactivo** a la derecha. Cambio inmediato vía `useToggleRecommendationRuleActive`.
  - Filas inactivas se ocultan por defecto; visibles solo si `showInactive=true`, con estilo atenuado (`opacity-60`).
- Eliminar/desactivar cualquier botón de borrado físico (no existía, así que solo me aseguro).

### 5. `src/i18n/translations.ts`
Añadir/actualizar claves:
- `settings.hours` → "Horas semanales" / "Weekly hours"
- `settings.subjects` → "# asignaturas recomendadas" / "# recommended subjects"
- `settings.addRule` → "Añadir lineamiento" / "Add guideline"
- `settings.active` / `settings.inactive`
- `settings.showInactive` / `settings.hideInactive`
- `settings.newRuleLabel` → "Nombre del lineamiento" / "Guideline name"
- `settings.create` / `settings.cancel`
- `settings.created` / `settings.statusUpdated`

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | `ALTER TABLE recommendation_rules ADD COLUMN active boolean NOT NULL DEFAULT true` |
| `src/hooks/useRecommendationRules.ts` | Añadir campo `active`; nuevos hooks `useCreateRecommendationRule`, `useToggleRecommendationRuleActive` |
| `src/hooks/useRecommendations.ts` | Ignorar reglas con `active=false` (usar fallback en su lugar) |
| `src/components/SettingsDialog.tsx` | Renombrar labels; toggle Activo/Inactivo por fila; botón ojo para mostrar/ocultar inactivos; formulario "Añadir lineamiento" por categoría |
| `src/i18n/translations.ts` | Nuevas claves ES/EN |

