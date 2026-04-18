

## Análisis

Reviso el panel Soporte y la estructura actual.
<lov-tool-use id="toolu_vrtx_01S8Aw3euvLkXtarhGkx85y4" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/SupportPanel.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01KMgF2wcs24C1s7v1M4q4JM" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT id, name, id_faculty FROM professional_careers ORDER BY id\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01RyGBZzCfm4TehuUAqx2mwz" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CN1o1px8GF9cG7bMLxaxeN" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/SupportPanel.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01PLfRGKkhyPd4okZVKKSA2t" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT id, name, id_faculty FROM professional_careers ORDER BY id\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CbdpTsMhyoCF6wnsbz9V3v" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position\"}">
</lov-tool-use>
The `users` table doesn't have `id_faculty` or `id_professional_career` columns. Need to add them. The faculty is derivable from the career (career → faculty), so storing only `id_professional_career` on users is enough — but adding both is also fine for query simplicity. I'll go with just `id_professional_career` (faculty derived) to avoid duplication.

<lov-plan>

## Análisis

- Tabla `users` actual no tiene columnas para facultad/carrera.
- Tabla `professional_careers` ya tiene `id_faculty` (relación carrera → facultad ya existe).
- Tabla `faculties` ya existe con datos.
- `SupportPanel.tsx` usa React Query y muestra una tabla con búsqueda; hay que agregar dos `Select` de filtro y dos `Select` en el formulario de creación/edición.

Como la carrera ya pertenece a una facultad, basta con almacenar `id_professional_career` en `users` y derivar la facultad. Pero para soportar el filtro por facultad de forma directa y permitir asignación explícita, agregaré ambas columnas (`id_faculty` y `id_professional_career`) — el formulario forzará coherencia (al elegir carrera se autocompleta la facultad y al elegir facultad se filtran las carreras).

## Cambios

### 1. Migración BD (`users`)
- Agregar columnas: `id_faculty INT REFERENCES faculties(id)` y `id_professional_career INT REFERENCES professional_careers(id)`, ambas **nullable** (para no romper usuarios existentes ni el rol Soporte que no pertenece a ninguna).

### 2. `src/pages/SupportPanel.tsx`
- **Queries nuevas**: `sp_faculties` y `sp_careers` (con `id_faculty`).
- **Estado de filtros**: `filterFaculty` y `filterCareer` (`"all"` por defecto).
- **UI filtros**: dos `Select` arriba de la tabla, junto al buscador. Carreras se filtran por facultad seleccionada.
- **Filtrado**: `filtered` aplica búsqueda + filtro facultad + filtro carrera.
- **Columnas tabla**: agregar "Facultad" y "Carrera" mostrando el nombre.
- **Formulario crear/editar** (`emptyForm`):
  - Agregar `id_faculty: null` y `id_professional_career: null`.
  - Dos `Select` en el diálogo: Facultad → al cambiar, resetea carrera y filtra opciones; Carrera → al cambiar, autocompleta facultad.
  - El rol Soporte (id=5) puede dejarlos vacíos (opcional, mostrar nota).
- **Mutations** `createUser` / `updateUser`: incluir `id_faculty` y `id_professional_career` en el payload.

### 3. `src/integrations/supabase/types.ts`
Se regenera automáticamente con la migración.

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | `ALTER TABLE users ADD COLUMN id_faculty`, `id_professional_career` con FK |
| `src/pages/SupportPanel.tsx` | Filtros (facultad/carrera), columnas adicionales en tabla, selects en formulario con dependencia jerárquica |

