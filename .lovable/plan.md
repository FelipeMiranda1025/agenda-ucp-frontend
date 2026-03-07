

## Plan: Cambiar colores a rojo y hacer barra derecha permanente

### Cambios de color a rojo

1. **Barra horizontal del título de subfunción** (SubfunctionForm.tsx, línea 91): Cambiar `bg-primary` por un rojo UCP usando la variable CSS `--ucp-red` ya definida. Crear una clase utilitaria o usar directamente `bg-[hsl(var(--ucp-red))]`.

2. **Botón "Confirmar datos"** (SummaryPanel.tsx, línea 96): Cambiar el `Button` para usar estilo rojo (`bg-[hsl(var(--ucp-red))]` con hover).

3. **Header del panel resumen** (SummaryPanel.tsx, línea 43): Cambiar `bg-primary` por el rojo UCP.

### Barra lateral derecha permanente (no flotante)

4. **SummaryPanel.tsx**: Eliminar posicionamiento `fixed` y convertirlo en un elemento del flujo normal del layout, similar a la barra izquierda. Eliminar la lógica de minimizar/maximizar. Mostrar siempre el panel (incluso vacío con un mensaje placeholder).

5. **Index.tsx**: Integrar `SummaryPanel` dentro del flex layout como una tercera columna fija (`w-80 shrink-0 border-l`), al mismo nivel que el sidebar izquierdo y el contenido principal.

### Archivos a modificar
- `src/components/SubfunctionForm.tsx` — color de barra de título
- `src/components/SummaryPanel.tsx` — color de header y botón, layout permanente
- `src/pages/Index.tsx` — integrar panel como columna fija

