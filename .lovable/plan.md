

## Plan: Color #1f1f1f en modo oscuro para header y zonas del panel lateral

Cambiar `dark:bg-gray-900` por `dark:bg-[#1f1f1f]` en tres lugares:

### Cambios

| Archivo | Línea | Cambio |
|---|---|---|
| `src/pages/Index.tsx` | 76 | Header: `dark:bg-gray-900` → `dark:bg-[#1f1f1f]` |
| `src/components/SummaryPanel.tsx` | 93 | ScrollArea: `dark:bg-gray-900` → `dark:bg-[#1f1f1f]` |
| `src/components/SummaryPanel.tsx` | 142 | Métricas: `dark:bg-gray-900` → `dark:bg-[#1f1f1f]` |

El botón de confirmar datos (línea 167) no se toca.

