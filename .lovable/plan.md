## Análisis

El flujo actual de "Olvidé mi contraseña" en `LoginDialog.tsx` muestra un mensaje fijo ("Debes escribir a soporte@ucp.edu.co") con cuenta regresiva de 5s y redirección a Gmail. Se reemplaza completamente por un flujo funcional:

1. El usuario hace clic en "Olvidé mi contraseña" → se abre un sub-modal pidiendo **cédula o correo institucional**.
2. El usuario ingresa el dato y hace clic en "Enviar".
3. El backend (edge function `request-password-reset`) busca el usuario en la tabla `users` (por `cc` o por `email`), obtiene su `email` institucional registrado, genera una contraseña temporal aleatoria (12 chars, mayúsc + minúsc + número + especial), la guarda hasheada (SHA-256, mismo algoritmo que `AuthContext.hashPassword`) en `users.password`, y envía un correo a ese `email` con la contraseña en texto plano.
4. Tras el envío exitoso, se muestra el mensaje **"Se envió la nueva contraseña al correo"** (sin cuenta regresiva, sin redirección a Gmail).
5. El usuario inicia sesión con la contraseña temporal y puede luego cambiarla desde su perfil (esa parte ya estaba planeada por separado).

## Infraestructura de email

Aún no hay dominio de email configurado en el proyecto. El usuario ya había aprobado configurar `notify.ucp.edu.co`. Pasos:

1. Mostrar el diálogo de configuración de dominio para `notify.ucp.edu.co` (delegación NS al servicio de Lovable).
2. Provisionar la infraestructura de email (cola pgmq, tablas, cron, etc.).
3. Hacer scaffold de transactional email (crea `send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`).
4. Crear plantilla `password-reset-temporary.tsx` con marca UCP (logo blanco, color institucional, tipografía sobria) que muestre saludo personalizado, contraseña temporal en bloque destacado monoespaciado, instrucción "Inicia sesión y cámbiala desde tu perfil", aviso de seguridad.
5. Crear edge function `request-password-reset` que:
   - Recibe `{ identifier }` (cédula o correo).
   - Valida con Zod (no vacío, longitud razonable).
   - Detecta si es cédula (sólo dígitos) o correo (`@ucp.edu.co`); busca por `cc` o por `email` en `users`.
   - Si no existe → devuelve un mensaje neutro de éxito (para evitar enumeración de cuentas) pero no envía nada.
   - Si existe: genera contraseña temporal, hashea con SHA-256, hace `UPDATE users SET password=... WHERE id=...`.
   - Invoca `send-transactional-email` con `templateName: 'password-reset-temporary'`, `recipientEmail: user.email`, `templateData: { name: user.first_name, tempPassword }`.

> Nota: el envío real funcionará una vez DNS verifique `notify.ucp.edu.co` (puede tardar hasta 72h). Hasta entonces los correos quedan en cola.

## Cambios en el frontend (`LoginDialog.tsx`)

- **Eliminar**: estado `countdown`, `redirected`, el `useEffect` de redirección a Gmail (líneas 71–93), la creación del `<a href="https://www.gmail.com">`, y el texto "Debes escribir a soporte@ucp.edu.co".
- **Reemplazar `handleForgotPassword`**: en vez de activar `showMessage` con cuenta regresiva, abre un sub-modal (estado `forgotOpen`).
- **Nuevo sub-modal** (overlay sobre el modal de login, o sección colapsable en el mismo card):
  - Título: "Recuperar contraseña".
  - Input "Cédula o correo institucional" con la misma validación de `getUsernameError`.
  - Botón "Enviar contraseña temporal" (estado `sending` con spinner).
  - Botón "Cancelar" para cerrar.
  - Al enviar: `supabase.functions.invoke('request-password-reset', { body: { identifier } })`.
  - Tras éxito: cerrar el sub-modal y mostrar el mensaje **"Se envió la nueva contraseña al correo"** en el modal principal de login (toast o texto debajo del enlace, sin cuenta regresiva).
  - Errores de red: mensaje genérico "Intenta nuevamente".

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/LoginDialog.tsx` | Eliminar lógica de redirect/countdown. Añadir estado `forgotOpen`, `forgotIdentifier`, `forgotSending`, `forgotSuccess`. Renderizar sub-modal de recuperación. Mostrar el nuevo mensaje "Se envió la nueva contraseña al correo" tras éxito. |
| `supabase/functions/request-password-reset/index.ts` | **Nuevo**. CORS, Zod, busca usuario por `cc` o `email`, genera contraseña temporal, actualiza hash, invoca `send-transactional-email`. |
| `supabase/functions/_shared/transactional-email-templates/password-reset-temporary.tsx` | **Nuevo**. Plantilla React Email con marca UCP. Muestra contraseña temporal destacada. |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Registrar la nueva plantilla. |
| `src/i18n/translations.ts` | Claves: `forgotPassword.title`, `forgotPassword.identifierLabel`, `forgotPassword.identifierPlaceholder`, `forgotPassword.send`, `forgotPassword.cancel`, `forgotPassword.sending`, `forgotPassword.success` (= "Se envió la nueva contraseña al correo"), `forgotPassword.networkError`. |

## Pasos de implementación (orden)

1. Configurar el dominio de email `notify.ucp.edu.co` (diálogo de setup).
2. Provisionar infraestructura de email + scaffold de transactional emails.
3. Crear la plantilla `password-reset-temporary.tsx` y registrarla.
4. Crear la edge function `request-password-reset`.
5. Refactorizar `LoginDialog.tsx`: eliminar el flujo viejo y añadir el sub-modal con el nuevo mensaje.
6. Añadir traducciones ES/EN.
7. Desplegar las edge functions.
