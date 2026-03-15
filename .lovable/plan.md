

## Plan: Actualizar datos en tablas `roles` y `users`

### Migración de datos (una sola migración SQL)

**Paso 1**: Borrar usuarios primero (dependen de roles), luego borrar roles.

**Paso 2**: Insertar en `roles`:
| name | description |
|------|-------------|
| Docente de planta | rol encargado de hacer la diligencia del formulario |

**Paso 3**: Insertar en `users` referenciando el nuevo rol y el state "Activo" (id=1):
| Campo | Valor |
|-------|-------|
| id_rol | (id del rol recién creado) |
| id_state | 1 (Activo) |
| first_name | Docente |
| second_name | (vacío) |
| first_last_name | Planta |
| second_last_name | Pruebas |
| password | SHA-256 hash de "1234" |
| cc | 1234 |
| email | docenteplanta.pruebas@ucp.edu.co |

Se usará una subconsulta para obtener el `id` del rol recién insertado: `(SELECT id FROM roles WHERE name = 'Docente de planta')`.

### Impacto en el código

El `AuthContext` ya usa SHA-256 para hashear la contraseña al hacer login, y busca por `cc` o `email`. El usuario podrá loguearse con:
- Usuario: `1234` o `docenteplanta.pruebas@ucp.edu.co`
- Contraseña: `1234`

Los roles anteriores (admin, vicerrectoria, etc.) definidos en `src/types/auth.ts` ya no coincidirán con la BD. Se actualizará el archivo `auth.ts` para reflejar el nuevo rol "Docente de planta".

### Archivos a modificar
- **Base de datos**: Una operación de datos (DELETE + INSERT en `users` y `roles`)
- **`src/types/auth.ts`**: Actualizar constante `ROLES` para incluir "Docente de planta" como único rol

