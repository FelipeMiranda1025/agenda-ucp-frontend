

## Plan: Cambiar favicon y limpiar archivos no usados

### Cambios

1. **Copiar imagen subida** — Copiar `user-uploads://escudoUCP.png` a `public/favicon.png` (reemplaza el actual).

2. **Eliminar `public/favicon.ico`** — No está referenciado en `index.html`, es un archivo sin uso.

3. **`index.html`** — Ya referencia `/favicon.png`, no requiere cambios.

### Resultado
El favicon será el escudo de la UCP y se eliminará el `.ico` que no se usa.

