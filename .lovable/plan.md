

## Análisis

El usuario quiere un script SQL completo, listo para copiar/pegar en DBeaver (PostgreSQL), que reproduzca toda la BD del proyecto: tablas, índices, FKs, triggers, vistas, funciones, RLS y datos semilla. Debe ejecutarse sin errores en una BD vacía.

Voy a inspeccionar el estado real de la BD (estructura + datos actuales) para garantizar fidelidad antes de generar el script.

## Pasos antes de entregar

1. Listar todas las migraciones existentes para reconstruir el esquema actual.
2. Consultar `information_schema` y `pg_indexes` para FKs, índices, defaults reales.
3. Consultar contenido de catálogos y datos seed (`roles`, `states`, `semester`, `faculties`, `education_levels`, `professional_careers`, `subjects`, `users`, `indirect_teaching`, `investigations`, `social_projects`, `teacher_training`, `degree_works`, `complementary_activities`, `administrative_activities`, `academic_practices`, `user_hierarchy`, `recommendation_rules`, `system_settings`).
4. Consolidar en un único bloque SQL idempotente:
   - `CREATE SCHEMA IF NOT EXISTS public`
   - `CREATE TABLE IF NOT EXISTS` para las 23 tablas con tipos, defaults, PKs y UNIQUE
   - Funciones `update_updated_at_column()` y `audit_trigger_func()`
   - Triggers (audit + updated_at) en las tablas relevantes
   - Índices auxiliares (`agendas(docente_cc, subfunction_id)`, `agenda_views(user_cc)`, `audit_log(table_name, record_id)`, etc.)
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + políticas RLS tal como están en producción
   - `INSERT ... ON CONFLICT DO NOTHING` con todos los datos actuales (roles, states, users, subjects, asignaturas, jerarquía, etc.)
   - `SELECT setval(...)` al final para resetear secuencias
5. Entregar el script en un único bloque ```sql en el chat (sin archivos, sin documentos, sin presentation-artifact).

## Compatibilidad DBeaver

- 100% PostgreSQL estándar (mismo dialecto que Supabase usa).
- Sin `auth.*`, sin `storage.*`, sin extensiones propietarias de Supabase. Las políticas RLS usan roles `anon` y `authenticated`; agregaré al inicio `CREATE ROLE IF NOT EXISTS` envueltos en bloques `DO $$` para que no falle si esos roles no existen en una BD limpia.
- Usaré `gen_random_uuid()` (requiere `pgcrypto`); incluiré `CREATE EXTENSION IF NOT EXISTS pgcrypto`.
- Todo idempotente: `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`.

## Entrega

La respuesta final será un único mensaje en chat que comienza con una breve nota de uso (1-2 líneas) y a continuación un solo bloque ```sql … ``` con todo el script. Sin archivos adjuntos, sin descargas.

