

## Problema

El dropdown del docente en el sidebar lateral izquierdo no se ve cuando se despliega. La causa es un conflicto de z-index:

- El menú lateral (overlay) en `Index.tsx` línea 389 usa `z-[60]`.
- El `SelectContent` de Radix se renderiza en un Portal a nivel `body` con `z-50` (definido en `src/components/ui/select.tsx`).
- Como `z-50 < z-60`, la lista del dropdown queda **detrás** del overlay del menú y no se ve.

## Solución

En `src/components/AppSidebar.tsx`, agregar la clase `z-[70]` al `SelectContent` del dropdown de docentes para que se renderice por encima del overlay del menú lateral (`z-[60]`).

```tsx
<SelectContent className="z-[70]">
  {docentesList.map((d) => ( ... ))}
</SelectContent>
```

No se modifica el componente base `select.tsx` para no afectar otros usos de Select en la app.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AppSidebar.tsx` | Agregar `className="z-[70]"` al `SelectContent` del dropdown de docentes |

