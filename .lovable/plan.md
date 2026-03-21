

## Plan: "Olvidé mi contraseña" con mensaje y cuenta regresiva

### Cambio único en `src/components/LoginDialog.tsx`

1. **Reemplazar** el `<a>` actual (que abre Gmail compose) por un simple enlace de texto "Olvidé mi contraseña" sin href, alineado a la derecha como está ahora.

2. **Al hacer click**:
   - Mostrar centrado el texto: **"Debes escribir a soporte@ucp.edu.co"**
   - Debajo, mostrar cuenta regresiva de **5 a 1** segundos (ej: "Redirigiendo en 5...")
   - Al llegar a 0, abrir `https://www.gmail.com` en nueva pestaña con `window.open()`
   - Ocultar el mensaje después de la redirección

3. **Implementación**: Agregar estados `showMessage` (boolean) y `countdown` (number). Usar `useEffect` con `setInterval` que decrementa cada segundo cuando `showMessage` es true. El texto y cuenta regresiva se renderizan centrados entre el enlace y el botón de login.

