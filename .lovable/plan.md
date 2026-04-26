## Objetivo

Agregar la funcionalidad de cambio de contraseña dentro de la pantalla **Mi perfil**, con un diálogo modal de dos pasos:

1. **Paso 1 — Validar contraseña actual**: el usuario ingresa su contraseña actual; si coincide con la guardada en BD, se habilita el paso 2.
2. **Paso 2 — Nueva contraseña**: el usuario ingresa "Nueva contraseña" y "Confirmar contraseña". Al guardar, se actualiza el hash en la base de datos.

El botón se ubicará **debajo del avatar y por encima del nombre del usuario** (en el bloque vertical izquierdo de la tarjeta "Información del usuario"), tal como se aprecia en el rectángulo naranja de la imagen de referencia.

---

## Cambios en el Backend (Express)

### `backend/src/routes/auth.ts` — agregar dos endpoints protegidos con JWT:

**`POST /api/auth/verify-password`**
- Body: `{ currentPassword: string }`
- Toma `req.user.id` del JWT, hashea la contraseña con SHA-256 y compara contra `users.password` para ese usuario.
- Devuelve `{ valid: true }` o `401 { message: "Contraseña incorrecta" }`.

**`POST /api/auth/change-password`**
- Body: `{ currentPassword: string, newPassword: string }`
- Re-valida la contraseña actual contra BD (no se confía en el flag del cliente).
- Valida que `newPassword` tenga mínimo 8 caracteres y no sea igual a la actual.
- Actualiza `users.password` con el SHA-256 del nuevo valor.
- Devuelve `{ message: "Contraseña actualizada correctamente" }`.

Ambos endpoints usan el middleware `requireAuth` ya existente.

---

## Cambios en el Frontend

### Nuevo archivo: `src/components/ChangePasswordDialog.tsx`

Componente diálogo (basado en `Dialog` de shadcn) con estado interno de pasos:

- **Estado**: `step: 1 | 2`, `currentPassword`, `newPassword`, `confirmPassword`, `loading`, `errors`.
- **Paso 1**:
  - Input tipo password "Contraseña actual" + botón ojo (mostrar/ocultar).
  - Botón "Validar" → llama `api.post('/auth/verify-password', { currentPassword })`.
  - Si OK → avanza a paso 2. Si falla → muestra error inline.
- **Paso 2**:
  - Inputs "Nueva contraseña" y "Confirmar contraseña" (con botón ojo).
  - Validaciones cliente: mínimo 8 caracteres, ambas iguales, distinta a la actual.
  - Botón "Guardar" → `api.post('/auth/change-password', { currentPassword, newPassword })`.
  - Al éxito: toast verde, cierra el diálogo y resetea estado.
- **Botón "Atrás"** en paso 2 para volver al paso 1 (limpiando newPassword/confirmPassword).
- Indicadores visuales de progreso (paso 1 de 2, paso 2 de 2).
- Manejo de cierre: al cerrar el diálogo se resetea todo el estado.

### Modificar: `src/pages/Profile.tsx`

- Importar `ChangePasswordDialog` y `KeyRound` de lucide-react.
- Agregar estado `const [pwdOpen, setPwdOpen] = useState(false)`.
- En la columna izquierda del card (donde está el `Avatar`), **debajo del avatar y antes del bloque del nombre/rol/estado**, insertar:
  ```
  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPwdOpen(true)}>
    <KeyRound className="h-4 w-4" /> {t("profilePage.changePassword")}
  </Button>
  ```
- Renderizar `<ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />`.

### Modificar: `src/i18n/translations.ts`

Agregar claves en español/inglés:
- `profilePage.changePassword` → "Cambiar contraseña" / "Change password"
- `profilePage.currentPassword` → "Contraseña actual" / "Current password"
- `profilePage.newPassword` → "Nueva contraseña" / "New password"
- `profilePage.confirmPassword` → "Confirmar contraseña" / "Confirm password"
- `profilePage.passwordChanged` → "Contraseña actualizada correctamente" / "Password updated successfully"
- `profilePage.passwordMismatch` → "Las contraseñas no coinciden" / "Passwords do not match"
- `profilePage.passwordTooShort` → "Mínimo 8 caracteres" / "At least 8 characters"
- `profilePage.passwordSame` → "La nueva contraseña debe ser distinta a la actual" / "New password must be different from current"
- `profilePage.currentPasswordInvalid` → "Contraseña actual incorrecta" / "Current password is incorrect"
- `profilePage.validate` → "Validar" / "Validate"
- `profilePage.step` → "Paso {n} de 2" / "Step {n} of 2"

---

## Validaciones de seguridad

- El backend SIEMPRE re-valida la contraseña actual en `/change-password` (no confía en validación previa del cliente).
- El nuevo password debe ser distinto al actual (tanto en cliente como en servidor).
- La contraseña nunca se loggea.
- El JWT identifica al usuario; nunca se acepta `userId` desde el body.

---

## Archivos afectados

**Backend:**
- `backend/src/routes/auth.ts` — agregar 2 endpoints

**Frontend:**
- `src/components/ChangePasswordDialog.tsx` — nuevo
- `src/pages/Profile.tsx` — agregar botón + diálogo
- `src/i18n/translations.ts` — agregar claves i18n

No se modifica ningún otro archivo de UI, estilos ni configuración.
