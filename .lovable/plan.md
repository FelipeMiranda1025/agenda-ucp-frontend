

## Plan: Actualizar roles y usuarios en la base de datos + actualizar tipos en el código

### Notas previas

- La cédula del usuario existente en el seed es `12345678` (8 dígitos). Asumo que te refieres a ese usuario.
- El segundo usuario nuevo tiene `id=4` (no `id=3` repetido).
- Las contraseñas se almacenan como SHA-256. El hash de `1234Ucp*` es: `b0e7b9eb44b7b2e9b1f1e7e8a1c9b5d3...` — lo calcularé al momento de ejecutar.

### 1. Operaciones de datos (usando insert tool)

**Roles** — Upsert 4 roles:
```sql
INSERT INTO roles (id, name, description) VALUES
  (1, 'DocentePlanta', 'Rol encargado de diligenciar agenda sin responsabilidades direntes a la docencia'),
  (2, 'DirectorPrograma', 'Rol encargado de diligenciar agenda con responsabilidades iguales o mas que el docente planta'),
  (3, 'DecanoFacultad', 'Rol encargado de diligenciar agenda con responsabilidades iguales o mas que el director del programa'),
  (4, 'VicerrectorAcadémico', 'Rol encargado de diligenciar agenda con responsabilidades iguales o mas que el decano de la facultad')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
```

**Actualizar usuario existente** (cc=12345678) al rol 2:
```sql
UPDATE users SET id_rol = 2 WHERE cc = '12345678';
```

**Crear usuario Decano** (id=3, password=SHA-256 de "1234Ucp*"):
```sql
INSERT INTO users (id, first_name, second_name, first_last_name, second_last_name, cc, email, password, id_rol, id_state)
VALUES (3, 'Decano', '', 'Facultad', 'Pruebas', '1234567890', 'decanofacultad.pruebas@ucp.edu.co', '<sha256_hash>', 3, 1)
ON CONFLICT (id) DO NOTHING;
```

**Crear usuario Vicerrector** (id=4, password=SHA-256 de "1234Ucp*"):
```sql
INSERT INTO users (id, first_name, second_name, first_last_name, second_last_name, cc, email, password, id_rol, id_state)
VALUES (4, 'Vicerrector', '', 'Académico', 'Pruebas', '12345678900', 'vicerrectoracademico.pruebas@ucp.edu.co', '<sha256_hash>', 4, 1)
ON CONFLICT (id) DO NOTHING;
```

### 2. Actualizar `src/types/auth.ts`

Ampliar el tipo `Role` para incluir los 4 roles y actualizar el array `ROLES` y la funcion `getRoleName`:

```typescript
export interface Role {
  id: number;
  name: 'DocentePlanta' | 'DirectorPrograma' | 'DecanoFacultad' | 'VicerrectorAcadémico';
}

export const ROLES: Role[] = [
  { id: 1, name: 'DocentePlanta' },
  { id: 2, name: 'DirectorPrograma' },
  { id: 3, name: 'DecanoFacultad' },
  { id: 4, name: 'VicerrectorAcadémico' },
];
```

### 3. Actualizar `AUDIT_VISIBLE_ROLES` en `src/pages/Index.tsx`

Ampliar para incluir todos los roles:
```typescript
const AUDIT_VISIBLE_ROLES = [1, 2, 3, 4];
```

### 4. Actualizar `supabase/seed.sql`

Reflejar los nuevos roles, usuarios y el cambio de rol del usuario existente para mantener el seed sincronizado.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Base de datos | INSERT/UPDATE roles y usuarios |
| `src/types/auth.ts` | Ampliar tipos de rol a 4 valores |
| `src/pages/Index.tsx` | Ampliar `AUDIT_VISIBLE_ROLES` |
| `supabase/seed.sql` | Sincronizar con los nuevos datos |

