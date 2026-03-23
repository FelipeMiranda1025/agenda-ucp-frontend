

## Plan: Hacer la página principal más armoniosa y menos saturada

### Problema actual
El área principal (`main`) ocupa todo el ancho disponible con solo `p-6`, haciendo que los formularios se estiren demasiado y la página se vea saturada.

### Solución
Agregar un contenedor con ancho máximo centrado y márgenes laterales generosos dentro del `main`, creando espacio visual a los lados de los formularios.

### Cambios en `src/pages/Index.tsx`

Modificar el bloque del `<main>` (línea 199):

```tsx
<main ref={mainRef} className="flex-1 overflow-auto">
  <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
    {subfunctions...}
  </div>
</main>
```

- `max-w-4xl` (~896px) limita el ancho de los formularios para que no se estiren.
- `mx-auto` centra el contenido.
- `px-8` da padding lateral (~2rem cada lado).
- `py-6` mantiene el padding vertical.
- `space-y-6` reduce ligeramente la separación entre formularios (de `space-y-8` a `space-y-6`).

### Archivo modificado
- `src/pages/Index.tsx` — solo 2 líneas cambian en el contenedor principal.

