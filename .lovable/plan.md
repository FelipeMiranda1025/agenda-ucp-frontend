

## Plan: Wrap Text en todos los campos de formularios

### Problema
Los textos largos (ej: "Electiva II (Introducción a la analítica de datos)") se truncan o desbordan en los campos de formulario.

### Cambios

#### 1. Combobox de asignatura (SubfunctionForm.tsx, línea 468-472)
El botón del Popover tiene `className="flex-1 justify-between font-normal"` con altura fija implícita. Cambiar a:
- Remover `h-10` implícito, usar `h-auto min-h-10`
- Agregar `whitespace-normal text-left` para que el texto se ajuste en múltiples líneas

#### 2. Read-only fields (SubfunctionForm.tsx, línea 459)
El div read-only tiene `h-10`. Cambiar a `min-h-10 h-auto` para permitir que textos largos expandan el campo.

#### 3. SelectTrigger (src/components/ui/select.tsx, línea 20)
Actualmente tiene `h-10` y `[&>span]:line-clamp-1` (trunca a 1 línea). Cambiar a:
- `min-h-10 h-auto` en vez de `h-10`
- Remover `[&>span]:line-clamp-1`
- Agregar `[&>span]:whitespace-normal [&>span]:text-left`

#### 4. Input (src/components/ui/input.tsx, línea 11)
Cambiar `h-10` a `min-h-10 h-auto` para inputs de texto que puedan tener contenido largo.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/ui/select.tsx` | SelectTrigger: `min-h-10 h-auto`, remover `line-clamp-1`, agregar `whitespace-normal` |
| `src/components/SubfunctionForm.tsx` | Combobox button y read-only div: `min-h-10 h-auto whitespace-normal text-left` |
| `src/components/ui/input.tsx` | `min-h-10 h-auto` en vez de `h-10` |

