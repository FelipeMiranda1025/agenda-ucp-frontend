

## Plan: Campos de solo lectura en múltiples formularios

### Cambio en `src/components/SubfunctionForm.tsx` (líneas 237-239)

Expandir el mapeo de `readOnlyFields` para incluir todos los formularios solicitados:

```ts
const readOnlyFields = (() => {
  switch (resolvedId) {
    case "docencia-directa":
      return ["semestre", "nivel", "horasSemana", "cantidadSemanas"];
    case "docencia-indirecta":
      return ["horasSemana", "cantidadSemanas"];
    case "trabajos-grado":
      return ["cantidadHoras"];
    case "practicas-academicas":
      return ["cantidadHoras"];
    case "investigacion":
      return ["cantidadSemanas"];
    case "complementarias":
      return ["cantidadSemanas"];
    case "formacion-docentes":
      return ["cantidadSemanas"];
    case "administrativas":
      return ["cantidadSemanas"];
    default:
      return [];
  }
})();
```

Estos campos se mostrarán como `div` estáticos con estilo `bg-muted` (igual que "Total de horas"), sin permitir edición manual. Los valores se podrán llenar mediante auto-fill desde la base de datos.

