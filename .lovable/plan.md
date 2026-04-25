## Análisis

Dos cambios independientes pero complementarios sobre la gestión de contraseñas:

### 1. "Olvidé mi contraseña" — flujo nuevo
Hoy redirige a Gmail (línea 75-81 de `LoginDialog.tsx`). Se reemplaza por:
- Modal que pide la **cédula o correo institucional**.
- Backend (edge function) busca el usuario, genera una **contraseña temporal aleatoria** (12 caracteres, cumple política: mayúsc + minúsc + número + especial), la guarda hasheada (SHA-256, mismo algoritmo que `AuthContext.hashPassword`) en `users.password`, y envía un correo al `email` institucional con la contraseña en texto plano.
- Toast de éxito: "Hemos enviado una contraseña temporal a tu correo institucional".
- El usuario inicia sesión con esa contraseña temporal y luego puede cambiarla desde su perfil.

### 2. Cambiar contraseña desde "Ver perfil"
- Botón **"Cambiar contraseña"** debajo del avatar/foto en `Profile.tsx`.
- Abre un `Dialog` con flujo en 2 pasos:
  1. **Paso 1 — Validación**: input "Contraseña actual" + botón "Verificar". Hashea y compara contra `users.password WHERE cc = user.id`. Si no coincide → error visible. Si coincide → habilita paso 2.
  2. **Paso 2 — Nueva contraseña**: inputs "Nueva contraseña" y "Confirmar contraseña" con la misma política que login (`isValidPassword`: ≥8 chars, mayúsc, minúsc, número, especial). Botón "Confirmar" → actualiza `users.password` con el nuevo hash.
- Al confirmar: toast de éxito y cierra el modal. La sesión sigue activa (no se requiere re-login porque sólo cambia el hash).

## Infraestructura de email

El proyecto **no tiene infraestructura de email aún**. Como el usuario eligió "Configurar dominio propio (notify.ucp.edu.co)":

1. Mostrar el diálogo de configuración de dominio para que el usuario añada los registros NS en `ucp.edu.co` apuntando al subdominio `notify`.
2. Tras la configuración (incluso con DNS en propagación), se monta la infraestructura de email de Lovable (cola pgmq, tablas, cron) y se hace **scaffold de transactional email**.
3. Se crea una nueva plantilla `password-reset-temporary.tsx` en `_shared/transactional-email-templates/` con la marca UCP (logo, color institucional, tipografía sobria) que muestra: saludo personalizado, contraseña temporal en bloque destacado monoespaciado, instrucción "Inicia sesión y cámbiala desde tu perfil", aviso de seguridad.
4. Una nueva edge function `request-password-reset` recibe `{ identifier }` (cédula o email), valida con Zod, busca el usuario, genera la contraseña, actualiza el hash en `users` y dispara `send-transactional-email` con `templateName: "password-reset-temporary"` y `templateData: { name, tempPassword }`.
5. Una segunda edge function `change-password` recibe `{ userCc, currentPassword, newPassword }`, hashea ambos, valida que `currentPassword` coincida y actualiza con el nuevo hash. (Se hace server-side para evitar que el cliente pueda forzar updates sin validar la actual.)

> Nota sobre DNS: el envío real de correos sólo funcionará una vez que `notify.ucp.edu.co` esté verificado (puede tardar hasta 72h). Hasta entonces la infraestructura queda lista pero los correos quedan en cola; el flujo se podrá probar en cuanto DNS verifique.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/LoginDialog.tsx` | Reemplazar `handleForgotPassword`: abrir un sub-modal con input de cédula/correo + botón "Enviar contraseña temporal". Llama a `supabase.functions.invoke('request-password-reset', ...)`. Eliminar el redirect a Gmail y el contador. |
| `src/pages/Profile.tsx` | Añadir botón "Cambiar contraseña" debajo del avatar. Renderizar `<ChangePasswordDialog>`. |
| `src/components/ChangePasswordDialog.tsx` | **Nuevo**. Dialog con flujo de 2 pasos (validar actual → nueva + confirmar). Usa `supabase.functions.invoke('change-password', ...)`. Validación de política con `isValidPassword`. |
| `supabase/functions/request-password-reset/index.ts` | **Nuevo**. Genera contraseña temporal, actualiza hash en `users`, invoca `send-transactional-email`. CORS, validación con Zod. |
| `supabase/functions/change-password/index.ts` | **Nuevo**. Verifica contraseña actual y actualiza hash. CORS, validación con Zod. |
| `supabase/functions/_shared/transactional-email-templates/password-reset-temporary.tsx` | **Nuevo**. Plantilla React Email con marca UCP. |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Registrar la nueva plantilla. |
| `src/i18n/translations.ts` | Nuevas claves: `forgotPassword.title`, `forgotPassword.identifier`, `forgotPassword.send`, `forgotPassword.success`, `forgotPassword.notFound`, `profilePage.changePassword`, `changePassword.currentLabel`, `changePassword.verify`, `changePassword.newLabel`, `changePassword.confirmLabel`, `changePassword.confirm`, `changePassword.success`, `changePassword.wrongCurrent`, `changePassword.mismatch`, `changePassword.weak`. |

## Pasos de implementación (orden)

1. Mostrar diálogo de configuración del dominio `notify.ucp.edu.co`.
2. Tras setup del dominio: provisionar infraestructura de email + scaffold de transactional emails.
3. Crear plantilla `password-reset-temporary.tsx` con estilo UCP.
4. Crear edge functions `request-password-reset` y `change-password`.
5. Refactorizar `LoginDialog.tsx` (forgot password modal).
6. Crear `ChangePasswordDialog.tsx` y wiring en `Profile.tsx`.
7. Añadir traducciones ES/EN.