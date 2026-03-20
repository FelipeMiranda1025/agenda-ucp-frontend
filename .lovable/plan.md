

## Plan: Migración a Supabase Self-Hosted con Docker

### Contexto

No hay URLs ni claves hardcodeadas en el codigo fuente (confirmado por busqueda). El cliente ya usa variables de entorno. Solo hay una referencia al project ID en `supabase/config.toml` (archivo auto-generado).

### Archivos a modificar

**1. `.env.example`** — Actualizar con valores para self-hosted:
```
# Supabase self-hosted (Docker) — completar con los valores generados
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=local
```

**2. `src/integrations/supabase/client.ts`** — Agregar validacion de variables de entorno y remover opciones de auth hardcodeadas, segun tu especificacion:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno...');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**3. `README.md`** — Cambiar "Backend: Lovable Cloud (Supabase)" por "Backend: Supabase Self-Hosted (Docker)" y agregar la seccion completa de "Despliegue con Docker (Self-Hosted)" que proporcionaste, despues de la seccion de instalacion.

**4. `init.sql` (archivo nuevo en la raiz)** — Crear el archivo con el script SQL consolidado que proporcionaste (schema + RLS + triggers + seed data).

### Archivos que NO se modifican
- `.env` — Es auto-generado por la plataforma, no se puede editar directamente. El `.env.example` sirve de referencia para cuando clonen el repo.
- `supabase/config.toml` — Auto-generado, contiene el project ID de Cloud. No se modifica.
- Ningun componente, hook, contexto o pagina requiere cambios.

### Nota importante
El archivo `.env` de este entorno Lovable es auto-generado y no puede editarse manualmente. Cuando el proyecto se clone y se ejecute contra Docker, el desarrollador creara su propio `.env` a partir del `.env.example`.

