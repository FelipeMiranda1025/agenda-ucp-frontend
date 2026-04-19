
## Análisis

El effect actual (línea 215-278) solo limpia `programa` cuando hay múltiples variantes Y el `programa` actual NO pertenece a las variantes. En la captura se ve "Tecnología en desarrollo de software" auto-cargado para "Matemáticas I" porque ese programa SÍ pertenece a las variantes (Matemáticas I existe en Tecnología en desarrollo de software E Ingeniería Industrial), entonces `programaBelongsToVariants === true` y no se limpia.

El usuario quiere comportamiento más estricto:
- **Múltiples variantes** → SIEMPRE dejar `programa` vacío ("Seleccionar...") al cambiar la asignatura, sin importar si el valor previo era válido. El usuario debe elegir explícitamente.
- **Una sola variante** → Auto-llenar todos los campos (sin cambios).

El reto: no debe limpiarse cada vez que el effect corra (eso rompería la edición de un registro existente). Solo debe limpiarse cuando el usuario **acaba de cambiar** la asignatura. Para eso uso un `ref` que rastrea el último nombre de asignatura procesado: si cambió respecto a la última ejecución y hay múltiples variantes, limpiar y salir.

## Cambios

### `src/components/SubfunctionForm.tsx`

- Añadir `useRef<string | null>(null)` `lastProcessedSubjectRef` para rastrear el último nombre de asignatura sobre el que se decidió auto-llenar.
- En el effect de auto-llenado (líneas 215-278):
  - Si `selectedSubjectName !== lastProcessedSubjectRef.current` Y hay múltiples variantes → limpiar `programa`, `facultad`, `semestre`, `nivel`, `horasSemana`, `cantidadSemanas`, actualizar el ref, y salir.
  - Si hay una sola variante → auto-llenar normal y actualizar ref.
  - Si hay múltiples variantes pero la asignatura no cambió (ej. el usuario eligió un programa) → resolver subject y completar campos derivados (sin tocar `programa`), como hoy.

Esto garantiza:
- Al elegir Matemáticas I (2 variantes) → `programa` queda vacío con "Seleccionar...".
- Al elegir luego un programa → se rellena facultad/semestre/nivel/horas vía el effect de programa change (líneas 281+).
- Al elegir Redes de Computadores (1 variante) → todo se autocompleta como antes.
- Al cargar un registro existente (clic en resumen) la asignatura del registro se procesa una sola vez; si tiene múltiples variantes, `programa` se limpia al primer paso. *(Nota: esto significa que al hacer clic en un registro de Matemáticas I en el panel resumen, su programa se reseteará. Si esto no es deseado, queda como decisión del usuario; aplicar la regla estrictamente como pidió tiene esa consecuencia.)*

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Añadir `lastProcessedSubjectRef` y modificar el effect de auto-llenado para que SIEMPRE limpie `programa` y derivados cuando la asignatura cambia y tiene múltiples variantes |
