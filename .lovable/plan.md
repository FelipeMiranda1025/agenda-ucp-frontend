

## Plan: Campos de solo lectura en Docencia Directa

### Cambio en `src/components/SubfunctionForm.tsx`

En el renderizado de campos del formulario, cuando `resolvedId === "docencia-directa"`, los campos `semestre`, `nivel`, `horasSemana` y `cantidadSemanas` se mostrarán como campos de solo lectura (igual que el campo calculado `totalHoras`), es decir:

```tsx
<div className="h-10 px-3 py-2 rounded-md bg-muted text-sm font-semibold flex items-center">
  {formData[field.name] || "—"}
</div>
```

En la lógica de renderizado (líneas ~236-296), agregar una lista de campos read-only para docencia-directa:
```ts
const readOnlyFields = resolvedId === "docencia-directa" 
  ? ["semestre", "nivel", "horasSemana", "cantidadSemanas"] 
  : [];
```

Antes de renderizar dropdown o input, verificar si `readOnlyFields.includes(field.name)` y en ese caso mostrar el div estático en lugar del control interactivo.

### Sin otros cambios
La lógica de auto-fill ya existente sigue funcionando igual — simplemente el usuario ya no podrá modificar esos 4 campos manualmente.

