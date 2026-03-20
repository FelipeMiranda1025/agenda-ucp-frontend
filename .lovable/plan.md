

## Plan: Cambiar enlace "Olvidé mi contraseña" para abrir Gmail directamente

### Cambio unico en `src/components/LoginDialog.tsx`

Reemplazar el `mailto:` link actual por un enlace que abra directamente la ventana de redaccion de Gmail en el navegador usando la URL:

```
https://mail.google.com/mail/?view=cm&fs=1&to=soporte@ucp.edu.co&su=...&body=...
```

Con `target="_blank"` para que abra en una nueva pestaña. El asunto y cuerpo del mensaje se mantienen exactamente igual que los actuales.

