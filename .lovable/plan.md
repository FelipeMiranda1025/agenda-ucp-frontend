

## Plan: Ajustes al enlace "Olvidé mi contraseña"

### Cambios en `src/components/LoginDialog.tsx`

1. **Centrar el enlace** — Cambiar `flex justify-end` a `flex justify-center` en el contenedor del botón "Olvidé mi contraseña" (línea 102).

2. **Abrir Gmail con `window.location.href`** — En lugar de `window.open('...', '_blank')`, usar un enlace `<a>` con `href="https://www.gmail.com"` y `target="_blank" rel="noopener noreferrer"`. Esto permite que el navegador predeterminado (o la app del navegador en móvil) maneje la apertura en nueva pestaña, igual que cuando se abre un PDF. Se usará `window.open` como fallback.

3. **Mensaje visible por 2 minutos** — Después de abrir Gmail (cuando countdown llega a 0), en lugar de ocultar el mensaje inmediatamente (`setShowMessage(false)`), iniciar un temporizador de 2 minutos (120 segundos) que luego oculte el mensaje. Se cambiará la lógica del `useEffect` para:
   - Countdown de 5 a 0 → abrir Gmail
   - Mantener el texto "Debes escribir a soporte@ucp.edu.co" visible (sin el texto de cuenta regresiva)
   - Después de 120 segundos → ocultar el mensaje

