

## Plan: Colores personalizados UCP + fondo #f0e8e6

### 1. `src/index.css` — Actualizar variables CSS

**Light mode:**
- `--background`: cambiar a `10 29% 92%` (equivalente a #f0e8e6)
- `--primary`: cambiar a `156 90% 19%` (#065c3c)
- `--ring`: cambiar a `156 90% 19%`
- `--destructive`: cambiar a `359 71% 31%` (#86191c)
- `--ucp-red`: cambiar a `359 71% 31%`
- `--ucp-green`: cambiar a `156 90% 19%`
- `--ucp-green-dark`: cambiar a `156 90% 15%`
- `--sidebar-primary`: cambiar a `156 90% 19%`
- `--sidebar-ring`: cambiar a `156 90% 19%`

**Dark mode:** ajustar proporcionalmente los mismos tokens con versiones ligeramente mas claras del verde y rojo.

### 2. `src/pages/Index.tsx` — Boton hamburguesa

Cambiar `bg-green-600 hover:bg-green-700` por `bg-primary hover:bg-primary/90`.

### 3. `src/components/SummaryPanel.tsx` — Fondo superior + colores

- Linea 82: agregar `bg-[#f0e8e6]` al espacio superior (o usar bg-background ya que --background sera #f0e8e6)
- Linea 151: cambiar `text-green-600` por `text-primary`
- Linea 168: cambiar `bg-green-600 hover:bg-green-700` por `bg-primary hover:bg-primary/90`

### 4. `src/components/SubfunctionForm.tsx`

- Linea 172: cambiar `text-green-600` por `text-primary`

### 5. `src/pages/ScheduleBuilder.tsx`

- Linea 136: cambiar `bg-green-600 hover:bg-green-700` por `bg-primary hover:bg-primary/90`

### 6. `src/pages/Profile.tsx`

- Linea 80: cambiar `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200` por `bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary`
- Mismo linea: cambiar `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200` por `bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive`

### Archivos
| Archivo | Cambio |
|---|---|
| `src/index.css` | Variables CSS: fondo, primary, destructive, ucp-red, ucp-green |
| `src/pages/Index.tsx` | Boton hamburguesa usa `bg-primary` |
| `src/components/SummaryPanel.tsx` | Colores semantic tokens |
| `src/components/SubfunctionForm.tsx` | `text-green-600` → `text-primary` |
| `src/pages/ScheduleBuilder.tsx` | Boton guardar usa `bg-primary` |
| `src/pages/Profile.tsx` | Badges usan tokens semanticos |

