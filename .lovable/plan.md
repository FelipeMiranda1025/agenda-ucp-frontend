

## Plan: Sistema de Login con Autenticación Local y Roles

### Contexto
No hay Supabase conectado. Se implementará autenticación local con estado en memoria y localStorage, con usuarios hardcodeados (contraseñas hasheadas con SHA-256 via Web Crypto API). Cuando se conecte Supabase, se migrará a base de datos.

### Estructura de datos (en memoria por ahora)

**Tabla `rol`:**
| id (tinyint) | nombre |
|---|---|
| 1 | vicerrectoria |
| 2 | decanatura |
| 3 | docenteAdministrativo |
| 4 | docentePlanta |

**Tabla `estado`:**
| id (tinyint) | nombre |
|---|---|
| 1 | activo |
| 0 | inactivo |

**Tabla `usuarios`:**
| Campo | Tipo |
|---|---|
| id | string (cédula, PK) |
| email | string (único) |
| firstName | string |
| secondName | string |
| firstLastName | string |
| secondLastName | string |
| password | string (hash SHA-256) |
| rolId | number (FK a rol) |
| statusId | number (FK a estado) |

### Usuarios iniciales
- **admin** / admin123* — rol: admin (todos los permisos), id: "admin"
- **docenteAdministrativo** — rol: docenteAdministrativo, permisos de formularios y confirmar datos

### Archivos a crear/modificar

1. **`src/types/auth.ts`** — Interfaces User, Role, Status, AuthState

2. **`src/context/AuthContext.tsx`** — Context con:
   - Estado de autenticación (user, isAuthenticated)
   - Función login(username, password) que hashea y compara
   - Función logout()
   - Usuarios hardcodeados con contraseñas hasheadas
   - Persistencia en localStorage (sesión)

3. **`src/components/LoginDialog.tsx`** — Ventana emergente (Dialog modal, sin poder cerrar) con:
   - Campo "Número de cédula o correo institucional"
   - Campo "Contraseña"
   - Botón de login con colores institucionales UCP
   - Logo UCP
   - Mensajes de error

4. **`src/App.tsx`** — Envolver con AuthProvider, mostrar LoginDialog cuando no autenticado

5. **`src/pages/Index.tsx`** — Sin cambios estructurales, solo se muestra cuando hay sesión activa

### Flujo
1. Usuario abre la app → ve ventana modal de login (no se puede cerrar)
2. Ingresa cédula/correo + contraseña
3. Se hashea contraseña, se compara con hash almacenado
4. Si es válido → se guarda sesión, se muestra el framework según rol
5. Si no → mensaje de error

### Seguridad
- Contraseñas almacenadas como hash SHA-256 (no texto plano)
- Sesión en localStorage con datos no sensibles (sin contraseña)
- Nota: cuando se conecte Supabase, se migrará a auth real con bcrypt server-side

