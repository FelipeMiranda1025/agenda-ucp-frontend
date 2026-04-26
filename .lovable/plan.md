## Problema

En la pantalla **Mi perfil**, el botón "Cambiar contraseña" debe aparecer debajo del avatar y la insignia de estado ("activo"), tal como muestra el rectángulo naranja en la captura. Actualmente no es visible para ningún rol en el preview que ve el usuario.

Tras revisar el código (`src/pages/Profile.tsx`), el botón ya está implementado **sin restricción de rol** (no hay condicional `if (rolId === ...)`). El problema es uno de los siguientes:

1. El contenedor del frontend en Docker no se reconstruyó tras los últimos cambios, por lo que el preview muestra una build antigua sin el botón.
2. El botón se renderiza pero su estilo (`variant="outline"` + `w-full` dentro de una columna estrecha) lo hace poco visible o se "pierde" visualmente.

## Solución

### 1. Rediseñar el botón para que sea inequívocamente visible

En `src/pages/Profile.tsx`, dentro de la columna izquierda del card "Información del usuario":

- Usar `variant="default"` (fondo primary verde UCP, texto blanco) en lugar de `outline`, para que destaque como acción principal.
- Forzar un ancho mínimo (`min-w-[180px]`) para que no se colapse.
- Mantener la ubicación: **debajo del avatar y por encima del nombre**, exactamente donde el usuario marcó el rectángulo naranja.
- Garantizar que NO exista ningún condicional de rol: el botón se renderiza para todo `user` autenticado (DocentePlanta, Decano, VicerrectorAcadémico, Soporte).

```tsx
<Button
  size="sm"
  onClick={() => setPwdOpen(true)}
  className="gap-1.5 min-w-[180px] bg-primary text-primary-foreground hover:bg-primary/90"
>
  <KeyRound className="h-4 w-4" /> {t("profilePage.changePassword")}
</Button>
```

### 2. Asegurar que el componente y traducciones estén intactos

- `ChangePasswordDialog` ya existe y funciona con flujo de 2 pasos (validar contraseña actual → ingresar nueva + confirmar).
- Las claves i18n (`profilePage.changePassword`, `currentPassword`, `newPassword`, `confirmPassword`, `passwordMismatch`, `passwordTooShort`, `passwordSame`, `currentPasswordInvalid`, `validate`, `step`) ya están definidas en `src/i18n/translations.ts`. No requieren cambios.

### 3. Reconstruir el contenedor del frontend

Para que el botón aparezca en el preview, **es indispensable** ejecutar después del cambio:

```bash
docker compose up -d --build frontend
```

El backend (endpoints `/api/auth/verify-password` y `/api/auth/change-password`) ya está desplegado y funciona; no requiere rebuild adicional.

## Detalles técnicos

**Archivos modificados:**
- `src/pages/Profile.tsx` — único cambio: ajustar el `Button` "Cambiar contraseña" a variante primaria con ancho mínimo, sin condicionales de rol.

**Archivos sin cambios (ya correctos):**
- `src/components/ChangePasswordDialog.tsx`
- `src/i18n/translations.ts`
- `backend/src/routes/auth.ts`

## Resultado esperado

Al abrir **Mi perfil** con cualquier rol (incluyendo Soporte, Vicerrector, Decano, DocentePlanta), debajo del avatar y la insignia "activo" aparecerá un botón verde primario "🔑 Cambiar contraseña". Al hacer clic abre el diálogo modal con el flujo de validación en dos pasos ya existente.
