

## Plan: Mejorar legibilidad de registros en el panel de resumen

### Problema
Los nombres largos de registros (ej. "Participación en comités institucionales permanentes") se truncan con `truncate` (línea 115) y el panel tiene ancho fijo de `w-80` (320px, línea 81), lo que impide leer los textos completos.

### Cambios en `src/components/SummaryPanel.tsx`

1. **Ampliar el ancho del panel**: Cambiar `w-80` a `w-96` (384px) para dar más espacio horizontal.
2. **Permitir texto multilínea en registros**: Reemplazar `truncate` por `break-words` / `line-clamp-2` en el `<span>` del label (línea 115), para que los nombres largos se muestren en hasta 2 líneas en vez de cortarse con puntos suspensivos.
3. **Agregar tooltip**: Envolver el texto del registro en un `title` attribute con el texto completo como fallback para nombres que aún excedan 2 líneas.

### Resultado esperado
Los registros con nombres largos se mostrarán completos (o en 2 líneas) sin truncarse, manteniendo la estructura visual del panel.

