

## Plan: Migrar registros en tablas `roles` y `users`, actualizar referencias en código

### 1. Operaciones en base de datos

Se ejecutarán estas operaciones con la herramienta de inserción/actualización:

**Tabla `roles`:**
- INSERT id=1 con name='Docente de planta', description='rol encargado de hacer la diligencia del formulario'
- DELETE id=6

**Tabla `users`:**
- INSERT id=1 copiando datos del id=3, pero cambiando `id_rol` de 6 a 1 (por la migración del rol), `cc` a `12345678`, y `password` al hash SHA-256 de `1234Ucp*` (`74d18a339850e92425fe1c8b3efeddd5ff024d5291c629d79b35720c4bfe8e53`)
- DELETE id=3

**Nota:** El usuario id=3 tiene `id_rol=6`. Como el rol se migra de id=6 a id=1, el nuevo usuario id=1 tendrá `id_rol=1`.

### 2. Actualizar código fuente

**`src/types/auth.ts`** — Cambiar la referencia del rol de id 6 a id 1:
```typescript
export const ROLES: Role[] = [
  { id: 1, name: 'docentePlanta' },
];
```

**`supabase/seed.sql`** — Actualizar los INSERTs de roles (id=1) y users (id=1, cc=12345678, id_rol=1).

### Archivos modificados
- `src/types/auth.ts`
- `supabase/seed.sql`
- Base de datos: tablas `roles` y `users`

