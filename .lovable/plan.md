

## Análisis

En `src/components/SubfunctionForm.tsx` (líneas 365-412) el effect de auto-upsert hoy aplica:
- Para `docencia-directa` → guardado instantáneo.
- Para el resto → debounce de 800ms (esperando que el usuario termine de teclear varios dígitos).

El usuario quiere que el debounce se omita también cuando, en cualquier formulario, alguno de los campos numéricos clave (`horasSemana`, `cantidadEstudiantes`, `cantidadProyectos`) tenga **2 o más dígitos**. Si solo tienen 1 dígito (o están vacíos), se mantiene el debounce de 800ms.

Lógica a aplicar antes del `setTimeout`:
- Recorrer `inputFields`, identificar los que cumplan `f.type === "number"` y `["horasSemana","cantidadEstudiantes","cantidadProyectos"].includes(f.name)`.
- Para cada uno, leer `String(formData[f.name] ?? "")` y comprobar `length >= 2`.
- Si **alguno** cumple → ejecutar `doSave()` instantáneo (sin debounce).
- Si ninguno → mantener debounce 800ms actual.

Esto no toca `docencia-directa` (sigue instantáneo) ni la lógica de validación `allFilled`.

## Cambios

### `src/components/SubfunctionForm.tsx`
Modificar el bloque (líneas 403-411) para añadir un chequeo previo al `setTimeout`:

```ts
const TRIGGER_FIELDS = ["horasSemana", "cantidadEstudiantes", "cantidadProyectos"];
const hasMultiDigit = inputFields.some(
  (f) => f.type === "number"
    && TRIGGER_FIELDS.includes(f.name)
    && String(formData[f.name] ?? "").length >= 2
);

if (resolvedId === "docencia-directa" || hasMultiDigit) {
  doSave();
  return;
}
const timer = setTimeout(doSave, 800);
return () => clearTimeout(timer);
```

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Saltar el debounce de 800ms cuando `horasSemana`, `cantidadEstudiantes` o `cantidadProyectos` tengan ≥2 dígitos; mantener debounce solo si todos tienen 1 dígito |

