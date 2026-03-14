

## Diagnóstico

**Causa raíz**: Las políticas RLS de todas las tablas catálogo (`subjects`, `semester`, `faculties`, `education_levels`, `professional_careers`, `indirect_teaching`, etc.) solo permiten lectura al rol `authenticated`. Sin embargo, la app usa un sistema de autenticación personalizado (tabla `users` con SHA-256 + localStorage), **no** Supabase Auth. Esto significa que el cliente Supabase siempre opera como `anon`, y las consultas a estas tablas retornan arrays vacíos sin error.

## Solución

Actualizar las políticas RLS de **todas las tablas catálogo de solo lectura** para permitir también el rol `anon`. Esto es seguro porque son tablas de referencia sin datos sensibles y solo tienen política de SELECT.

### Migración SQL

Para cada tabla catálogo, reemplazar la política existente con una que incluya ambos roles (`anon, authenticated`):

Tablas afectadas (13 tablas):
- `subjects`, `semester`, `faculties`, `education_levels`, `professional_careers`
- `indirect_teaching`, `investigations`, `social_projects`, `teacher_training`
- `degree_works`, `complementary_activities`, `administrative_activities`, `academic_practices`
- `roles`, `states`

Para cada una:
```sql
DROP POLICY "Anyone can read <table>" ON public.<table>;
CREATE POLICY "Anyone can read <table>" ON public.<table>
  FOR SELECT TO anon, authenticated USING (true);
```

### Sin cambios de código
El código en `SubfunctionForm.tsx` y `useDatabase.ts` ya está correcto. Solo falta que las consultas puedan pasar RLS.

