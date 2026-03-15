

## Plan: Edición de registros, botón limpiar y total de horas semanales

### 1. Edición de registros sin crear duplicados (`SubfunctionForm.tsx` + `AgendaContext.tsx`)

**Problema actual**: Cuando se carga un registro para edición y se modifica un campo dropdown, la clave compuesta cambia y `upsertRecord` crea un nuevo registro.

**Solución**: Mantener el ID del registro en edición en un estado local (`editingRecordId`). Cuando el auto-save se dispara:
- Si `editingRecordId` existe → llamar `updateRecord(editingRecordId, data, total)` en lugar de `upsertRecord`
- Si no → comportamiento actual con `upsertRecord`
- Al guardar exitosamente en modo edición, limpiar `editingRecordId` y el formulario

Cambios en `SubfunctionForm.tsx`:
- Agregar estado `editingRecordId` 
- En el `useEffect` que escucha `editingRecord`, guardar `editingRecord.id` en `editingRecordId`
- En el `useEffect` de auto-save, usar `updateRecord` si hay `editingRecordId`, o `upsertRecord` si no

### 2. Botón "Limpiar campos" en docencia-directa (`SubfunctionForm.tsx`)

- Agregar un botón con icono `Eraser` o `X` en la esquina superior derecha del header rojo, solo visible cuando `resolvedId === "docencia-directa"`
- Al hacer clic: `setFormData({})`, `formDataStore[resolvedId] = {}`, limpiar `editingRecordId`

### 3. Total de horas semanales por formulario (`SubfunctionForm.tsx`)

Debajo de cada `Card` del formulario, mostrar un texto:

```
Total de horas semanales por todas las actividades: Xh
```

**Lógica**:
- Obtener todos los registros del subfunction actual via `getRecordsBySubfunction(resolvedId)`
- Sumar `horasSemana` de cada registro (o el campo equivalente según el formulario)
- Para docencia-directa: objetivo = 16h. Rojo si < 16, verde si = 16, amarillo si > 16
- Para otros formularios sin requisito fijo: mostrar sin color especial (o definir reglas similares)

**Colores**:
- Rojo: no cumple (menor al requisito)
- Verde: cumple exactamente
- Amarillo: se excede

Se usará `getRecordsBySubfunction` del contexto (ya existe). El campo de horas semanales varía por formulario (`horasSemana` en la mayoría, pero en trabajos-grado y prácticas no hay "horasSemana" directamente). Para formularios sin requisito de horas semanales, se mostrará el total en color neutro.

### Archivos a modificar
- `src/components/SubfunctionForm.tsx` — los 3 cambios

