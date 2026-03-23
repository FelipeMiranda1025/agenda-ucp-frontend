

## Plan: Fondo blanco en zonas de contenido del panel lateral

### Cambio único en `src/components/SummaryPanel.tsx`

El contenedor principal (línea 82) mantiene `bg-background` con `pt-6` para conservar el color `#f0e8e6` en el espacio superior.

Agregar `bg-white dark:bg-gray-900` a dos zonas debajo de la barra roja:

```text
┌─────────────────────┐
│ pt-6 (bg-background) │  ← #f0e8e6 - NO tocar
├─────────────────────┤
│ Barra roja          │  ← NO tocar
├─────────────────────┤
│ ScrollArea (L92)    │  ← bg-white
├─────────────────────┤
│ Métricas (L140)     │  ← bg-white
├─────────────────────┤
│ Botón confirmar     │  ← NO tocar
└─────────────────────┘
```

| Línea | Antes | Después |
|---|---|---|
| 92 | `className="flex-1 px-4 py-3"` | `className="flex-1 px-4 py-3 bg-white dark:bg-gray-900"` |
| 140 | `className="border-t px-4 pt-3 pb-1 space-y-1 text-sm"` | `className="border-t px-4 pt-3 pb-1 space-y-1 text-sm bg-white dark:bg-gray-900"` |

### Archivos
| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Agregar `bg-white dark:bg-gray-900` a 2 zonas |

