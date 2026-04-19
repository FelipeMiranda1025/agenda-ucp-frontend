

## Análisis

El menú perfil (`src/pages/Index.tsx` líneas 378-391) tiene dos opciones: "Ver perfil" y "Registro de auditoría", seguidas de "Cerrar sesión". Necesito insertar **"Ajustes"** después de "Registro de auditoría", visible solo para **VicerrectorAcadémico** (`rolId === 4`).

La lógica de recomendaciones está hardcoded en `src/hooks/useRecommendations.ts` con ~14 reglas distribuidas en 3 categorías:
- **Investigación**: combinaciones IP/Co-inv (10h, 4h, 3h, etc.)
- **Administrativas**: por cargo (Decano=2h, Dir.Depto=6h, Coord.área=13h, etc.)
- **Formación**: por nivel (Doctorado=8h, Maestría=12h, Pedagógicos=13h)

Cada regla devuelve `{ hours, subjects }`.

## Diseño

### 1. Tabla `recommendation_rules` (migración)
```
- id (uuid PK)
- category (text: 'investigacion' | 'administrativas' | 'formacion')
- rule_key (text: identificador único, ej. 'inv_1p_2c', 'admin_decano', 'form_doctorado')
- label (text: nombre legible, ej. "1 Investigador Principal + 2 Co-investigadores")
- hours (integer)
- subjects (integer)
- priority (integer: orden de evaluación)
- updated_at (timestamptz)
```
Seed: las 14 reglas actuales con sus valores por defecto. RLS: lectura pública (anon/auth), escritura permitida (la UI se restringe por rol).

### 2. `src/hooks/useRecommendationRules.ts` (nuevo)
- `useRecommendationRules()` — react-query, cachea reglas activas
- `useUpdateRecommendationRule()` — mutación para actualizar `hours`/`subjects` por `id`
- `useResetRecommendationRules()` — restaura a defaults

### 3. `src/hooks/useRecommendations.ts` (refactor)
Mismas ramas if/else, pero leyendo `hours` y `subjects` desde el mapa `rulesByKey` (con fallback a los valores actuales si la tabla está vacía). Ningún cambio en la lógica de prioridad ni bloqueos.

### 4. `src/components/SettingsDialog.tsx` (nuevo)
Dialog (Sheet/Modal) con tres `Tabs`: Investigación, Administrativas, Formación. Por cada regla:
- Muestra `label` (read-only)
- 2 inputs numéricos: "Horas" y "Asignaturas"
- Botón "Guardar" por fila o "Guardar todo" abajo
- Botón secundario "Restablecer valores por defecto"
Toast de confirmación al guardar.

### 5. `src/pages/Index.tsx`
Insertar entre "Registro de auditoría" y el separador:
```tsx
{user?.rolId === 4 && (
  <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="gap-2 cursor-pointer">
    <Settings className="h-4 w-4" /> {t("profile.settings")}
  </DropdownMenuItem>
)}
```
Estado `settingsOpen` y render de `<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />` al final del componente.

### 6. `src/i18n/translations.ts`
Añadir claves: `profile.settings`, `settings.title`, `settings.investigacion`, `settings.administrativas`, `settings.formacion`, `settings.hours`, `settings.subjects`, `settings.save`, `settings.reset`, `settings.saved`, `settings.resetConfirm`.

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `recommendation_rules` + seed de 14 reglas + RLS abiertas |
| `src/hooks/useRecommendationRules.ts` | **Nuevo**: hooks read/update/reset |
| `src/hooks/useRecommendations.ts` | Refactor: leer hours/subjects desde DB con fallback hardcoded |
| `src/components/SettingsDialog.tsx` | **Nuevo**: Modal con tabs editables (3 categorías) |
| `src/pages/Index.tsx` | Añadir item "Ajustes" en dropdown perfil (solo `rolId === 4`); montar `SettingsDialog` |
| `src/i18n/translations.ts` | Claves ES/EN para Ajustes |

