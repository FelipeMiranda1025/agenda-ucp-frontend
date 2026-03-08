

## Plan: Ajustar barra derecha, mover indicadores y eliminar footer

### Cambios

1. **Index.tsx** — Reestructurar layout: mover `SummaryPanel` dentro de la columna derecha pero debajo del header. Eliminar `MetricsFooter`.

```text
┌──────────┬──────────────────────────┬──────────────┐
│ Sidebar  │ Header (verde, full)                    │
│          ├──────────────────────────┬──────────────┤
│          │ Formularios (main)       │ SummaryPanel │
│          │                          │  - Registros │
│          │                          │  - Métricas  │
│          │                          │  - Botón     │
│          │                          │              │
└──────────┴──────────────────────────┴──────────────┘
```

El header se extiende sobre toda la zona derecha. El `SummaryPanel` queda debajo del header, como columna permanente al lado del contenido.

2. **SummaryPanel.tsx** — Agregar indicador "Horas semestre/defecto" (con input editable) debajo de los otros tres indicadores existentes. Eliminar `min-h-screen` ya que ahora estará contenido dentro del layout bajo el header.

3. **Eliminar MetricsFooter.tsx** — Ya no se necesita, los indicadores se mueven a la barra derecha.

### Archivos
- `src/pages/Index.tsx` — reestructurar layout, quitar MetricsFooter
- `src/components/SummaryPanel.tsx` — agregar "Horas semestre/defecto", quitar min-h-screen
- `src/components/MetricsFooter.tsx` — se puede eliminar o dejar sin uso

