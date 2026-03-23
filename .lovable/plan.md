## Plan: Fondo blanco en zonas de contenido del panel lateral

### Cambio único en `src/components/SummaryPanel.tsx`

El contenedor principal (`div` línea 82) mantiene `bg-background` para que el espacio superior (pt-6) conserve el color `#f0e8e6`.

Agregar `bg-white dark:bg-gray-900` a las dos zonas de contenido debajo de la barra roja:

1. **ScrollArea** (línea 92): donde aparece "No hay registros aún" o los registros agrupados
2. **Div de métricas** (línea 140): Total semestral / Promedio por semana / Horas faltantes

```text
Estructura actual:
┌─────────────────────┐
│ pt-6 (bg-background) │  ← #f0e8e6 - NO tocar
├─────────────────────┤
│ Barra roja          │  ← NO tocar
├─────────────────────┤
│ ScrollArea          │  ← Pintar blanco
├─────────────────────┤
│ Métricas            │  ← Pintar blanco
├─────────────────────┤
│ Botón confirmar     │  ← NO tocar
└─────────────────────┘
```

### Cambios específicos


| Línea  | Antes                                                   | Después                                                                           |
| ------ | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 92     | `className="flex-1 px-4 py-3"`                          | `className="flex-1 px-4 py-3 bg-white dark:bg-gray-900"`                          |
| 140    | `className="border-t px-4 pt-3 pb-1 space-y-1 text-sm"` | `className="border-t px-4 pt-3 pb-1 space-y-1 text-sm bg-white dark:bg-gray-900"` |
| &nbsp; | &nbsp;                                                  | &nbsp;                                                                            |


### Archivos


| Archivo                           | Cambio                                        |
| --------------------------------- | --------------------------------------------- |
| `src/components/SummaryPanel.tsx` | Agregar `bg-white dark:bg-gray-900` a 2 zonas |
