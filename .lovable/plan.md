

## Plan: Reemplazar texto "UCP" por logo en la barra lateral

1. Copiar la imagen del logo (`user-uploads://image.png`) a `src/assets/ucp-logo.png`
2. Modificar `src/components/AppSidebar.tsx`:
   - Importar la imagen como módulo ES6
   - Reemplazar el `<h2>UCP</h2>` por un `<img>` con el logo
   - Mantener el subtítulo "Agenda Docente"
   - En modo colapsado, mostrar una versión pequeña del logo en lugar de nada

