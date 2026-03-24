

## Plan: Sistema de trazabilidad con audit log y triggers

### 1. Nueva tabla `audit_log`

Crear una tabla centralizada para registrar todos los cambios:

```sql
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data jsonb,
  new_data jsonb,
  changed_fields text[], -- solo para UPDATE: campos que cambiaron
  user_cc text, -- CC del usuario que hizo el cambio (desde app context)
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: solo lectura para `anon` y `authenticated`.

### 2. Función genérica de auditoría

Crear una función PL/pgSQL `audit_trigger_func()` que:
- En INSERT: guarda `new_data = NEW`, `old_data = NULL`
- En UPDATE: guarda ambos `OLD` y `NEW`, calcula `changed_fields` comparando las columnas
- En DELETE: guarda `old_data = OLD`, `new_data = NULL`
- Extrae `record_id` del campo `id` del registro (cast a text)
- Extrae `user_cc` desde un setting de sesión (`current_setting('app.current_user_cc', true)`) que se configurará desde el frontend

### 3. Triggers en todas las tablas relevantes

Aplicar el trigger `AFTER INSERT OR UPDATE OR DELETE` en las siguientes tablas:
- `agendas`
- `agenda_comments`
- `subjects`
- `users`
- `indirect_teaching`, `investigations`, `social_projects`, `teacher_training`, `degree_works`, `complementary_activities`, `administrative_activities`, `academic_practices`

### 4. Frontend: establecer contexto de usuario

En el cliente Supabase, antes de cada operación de escritura, ejecutar:
```sql
SET LOCAL app.current_user_cc = '<cc_del_usuario>';
```

Esto se hará creando un wrapper en `useDatabase.ts` que use `supabase.rpc()` o una función auxiliar para setear el contexto antes de las mutaciones.

Alternativa más simple: dado que el sistema actual usa `anon` key sin auth de Supabase, pasar el `user_cc` como campo en un RPC o simplemente registrar el cambio sin usuario específico (ya que los triggers capturan el `OLD`/`NEW` data que contiene campos como `docente_cc` o `reviewer_cc`).

**Decisión**: Usar la alternativa simple — el trigger registra los datos completos del registro (que ya contienen identificadores como `docente_cc`, `reviewer_cc`, `user_id`). No se requiere session variable.

### 5. Frontend: vista de auditoría (opcional pero recomendado)

Agregar un hook `useAuditLog` en `useDatabase.ts` para consultar los registros de auditoría, y opcionalmente un componente para visualizarlos.

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `audit_log`, función `audit_trigger_func()`, y triggers en todas las tablas |
| `src/types/database.ts` | Agregar tipo `DbAuditLog` |
| `src/hooks/useDatabase.ts` | Agregar hook `useAuditLog` para consultar registros |

### Tablas con trigger (13 tablas)

`agendas`, `agenda_comments`, `subjects`, `users`, `indirect_teaching`, `investigations`, `social_projects`, `teacher_training`, `degree_works`, `complementary_activities`, `administrative_activities`, `academic_practices`, `professional_careers`

