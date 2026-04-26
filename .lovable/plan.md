
# Recuperación de contraseña con envío por correo

## Objetivo

Cuando el usuario hace clic en "Olvidé mi contraseña" e ingresa su **cédula** o **correo institucional**:

1. El backend valida que el usuario exista en la tabla `users` y esté activo (`id_state = 1`).
2. Genera una **contraseña temporal aleatoria** (12 caracteres, segura).
3. La guarda en la BD **hasheada con SHA-256** (mismo algoritmo del login actual) en `users.password`.
4. Envía un correo institucional al `email` del usuario con la **contraseña en texto plano**.
5. El frontend muestra el mensaje "Se envió la nueva contraseña al correo".

El usuario podrá iniciar sesión inmediatamente con esa contraseña temporal.

---

## Cambios en el backend

### 1. `backend/src/routes/auth.ts` — Reescribir `POST /api/auth/forgot-password`

Reemplazar el flujo actual (basado en token + URL de reset, que requiere una página `/reset-password` que no existe) por el flujo que el usuario pidió:

- Recibir `{ identifier }` (puede ser `cc` o `email`, igual que el login).
- Detectar si es numérico (cédula) o texto (correo) y buscar en `public.users`:
  ```sql
  SELECT id, cc, email, first_name FROM users
  WHERE (cc = $1 OR email = $1) AND id_state = 1
  ```
- Si **no existe**: responder `200` con mensaje neutro `"Si el correo existe, recibirás las instrucciones"` (no revelar si existe).
- Si **existe**:
  - Generar contraseña temporal de 12 caracteres con mayúscula + minúscula + número + carácter especial (función `generateTempPassword()`).
  - Hashear con SHA-256 (`crypto.createHash("sha256")`).
  - `UPDATE users SET password = $1 WHERE id = $2`.
  - Llamar `sendTemporaryPasswordEmail(user.email, user.first_name, tempPassword)`.
  - Responder `{ message: "Se envió la nueva contraseña al correo" }`.
- Si el envío de correo falla, registrar en logs **pero igual revertir** el cambio de contraseña no es necesario; el usuario podrá reintentar. Devolver `500` con mensaje claro para que el frontend lo muestre.

Eliminar la ruta `POST /api/auth/reset-password` (ya no aplica).

### 2. `backend/src/services/email.ts` — Añadir `sendTemporaryPasswordEmail()`

Nueva función que envía un correo HTML institucional UCP (mismo estilo que la plantilla actual de reset) con:

- Saludo personalizado al docente.
- Mensaje: "Se generó una nueva contraseña temporal para tu cuenta".
- La contraseña dentro de un bloque destacado con fuente monoespaciada y fondo gris claro para fácil lectura/copia.
- Recomendación: "Por seguridad, te sugerimos cambiarla la próxima vez que ingreses".
- Footer institucional UCP.
- Asunto: `"Nueva contraseña temporal — Agenda Docente UCP"`.

Mantener `sendPasswordResetEmail()` por ahora pero ya no se usará desde el flujo.

### 3. Frontend — `src/components/LoginDialog.tsx`

Ya envía `{ identifier: trimmed }` a `/auth/forgot-password` (línea 97) y muestra el mensaje de éxito. **No requiere cambios**.

---

## Variables de entorno SMTP (requeridas)

El backend ya usa `nodemailer` y lee estas variables (definidas en `backend/src/services/email.ts`):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<correo-institucional-emisor>
SMTP_PASS=<contraseña-de-aplicación>
SMTP_FROM="Agenda Docente UCP <no-reply@ucp.edu.co>"
```

Las añadiré al `.env.example` raíz y al `backend/.env.example` con comentarios explicando que para Gmail debe usarse una **App Password** (no la contraseña normal de la cuenta), o configurarse con el servidor SMTP institucional UCP.

> **Nota importante:** sin estas variables configuradas en el `.env` del servidor, el envío de correo fallará. El usuario debe configurarlas en su servidor antes de probar.

---

## Detalles técnicos

- **Hash de contraseña**: SHA-256 hex, idéntico al usado en `POST /api/auth/login` (línea 16 de `auth.ts`), garantizando que la contraseña temporal pueda usarse para iniciar sesión.
- **Generador seguro**: usa `crypto.randomInt()` para selección aleatoria de caracteres, garantizando al menos 1 mayúscula, 1 minúscula, 1 dígito y 1 especial (`!@#$%&*?`), luego mezcla con Fisher-Yates.
- **Tabla `password_reset_tokens`**: queda sin uso en este flujo. No se elimina (no afecta) por si en el futuro se quiere implementar el flujo basado en enlace.
- **Mensaje neutro**: cuando el usuario no existe, se devuelve el mismo mensaje que cuando sí existe, para no filtrar información sobre cuentas válidas.

---

## Archivos a modificar

- `backend/src/routes/auth.ts` — reescribir endpoint `forgot-password`, eliminar `reset-password`.
- `backend/src/services/email.ts` — añadir `sendTemporaryPasswordEmail()`.
- `.env.example` y `backend/.env.example` — documentar variables SMTP.

## Archivos sin cambios

- `src/components/LoginDialog.tsx` — el frontend ya está correctamente integrado.
- `src/lib/api.ts`, `src/context/AuthContext.tsx` — sin cambios.
