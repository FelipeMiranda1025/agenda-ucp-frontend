

## Plan: Fortalecer seguridad del Login

### Cambios en `src/components/LoginDialog.tsx`

**1. Validación por campo con mensajes individuales**

Reemplazar el estado `error` (string único) por `usernameError` y `passwordError` (strings individuales), cada uno mostrado en rojo, alineado a la izquierda, debajo de su campo respectivo.

- **Usuario**: válido si es cédula (solo dígitos, mínimo 8) O correo con `@ucp.edu.co`. Si no cumple: "Usuario invalido. Intente nuevamente."
- **Contraseña**: válido si tiene mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial. Si no cumple: "Contraseña invalida. Intente nuevamente."

**2. Casos de submit**
- Solo usuario sin contraseña → error de contraseña
- Solo contraseña sin usuario → error de usuario  
- Ambos vacíos → ambos errores
- Ambos con formato válido → intentar login; si credenciales incorrectas, mostrar mensaje genérico "Credenciales inválidas" (sin revelar cuál campo falló)

**3. Eliminar mensaje actual** de "Por favor complete todos los campos" y el bloque `{error && ...}` general.

**4. Medidas de seguridad adicionales**
- **Rate limiting**: Bloquear botón de login por 30 segundos tras 3 intentos fallidos consecutivos, mostrando cuenta regresiva. Estado `failedAttempts` y `lockoutUntil`.
- **Sanitización de inputs**: Aplicar `trim()` y limitar longitud máxima (50 chars usuario, 128 chars contraseña) via `maxLength` en los inputs.
- **Deshabilitar autocompletado de contraseña**: Mantener `autoComplete="current-password"` (estándar seguro).
- **Limpiar contraseña en error**: Vaciar campo de contraseña tras intento fallido de login contra servidor.

### Cambios en `src/context/AuthContext.tsx`

- Cambiar el mensaje de error de credenciales inválidas a algo genérico que no revele si el usuario existe o no: "Credenciales inválidas. Intente nuevamente."

### Archivos modificados
- `src/components/LoginDialog.tsx` — validaciones, rate limiting, mensajes por campo
- `src/context/AuthContext.tsx` — mensaje de error genérico

