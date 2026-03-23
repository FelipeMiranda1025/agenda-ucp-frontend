

## Plan: Fondo mas opaco + separacion del panel lateral

### Cambios

#### 1. `src/index.css` — Fondo ligeramente mas oscuro
Cambiar `--background` de `0 0% 98%` a `0 0% 94%` (light mode) para que el fondo gris se diferencie del blanco puro de las cards/formularios. En dark mode ajustar proporcionalmente.

#### 2. `src/components/SummaryPanel.tsx` — Agregar padding superior
En el contenedor principal (linea 82), agregar `mt-6` para que el panel lateral tenga la misma separacion del header que tienen los formularios con su `py-6`.

Cambiar:
```tsx
<div className="w-96 shrink-0 flex flex-col bg-card border-l">
```
Por:
```tsx
<div className="w-96 shrink-0 flex flex-col bg-card border-l pt-6">
```

### Archivos
| Archivo | Cambio |
|---|---|
| `src/index.css` | `--background: 0 0% 94%` |
| `src/components/SummaryPanel.tsx` | Agregar `pt-6` al contenedor |

