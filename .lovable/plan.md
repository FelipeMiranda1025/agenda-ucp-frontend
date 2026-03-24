

## Plan: Reestructurar el panel lateral con columnas Snal/Stral

### Cambio visual

Cada registro mostrará el nombre a la izquierda y dos columnas alineadas a la derecha: horas semanales (`Snal`) y horas semestrales (`Stral`). Encabezados de columna visibles por grupo. El subtotal (Tt:) se alinea con las mismas columnas.

```text
                                          Snal    Stral
Trabajo final                              4h      64h
Electiva II (Robótica)                     2h      32h
─────────────────────────────────────────────────────
                                    Tt:    6h   :  96h
```

### Cambios

**`src/components/SummaryPanel.tsx`**

1. Ampliar el panel de `w-96` (384px) a `w-[420px]` (420px) para acomodar las dos columnas sin apretar el contenido.

2. Para cada grupo, agregar una fila de encabezado con `Snal` y `Stral` alineados a la derecha en dos columnas de ancho fijo (`w-14` cada una).

3. Cada registro: el nombre ocupa `flex-1`, seguido de dos spans de ancho fijo (`w-14 text-right`) para horas semanales (`horasSemana` o `totalHoras/18`) y horas semestrales (`totalHoras`). El botón de eliminar se mantiene al final.

4. El subtotal se reformatea con la misma alineación de columnas: `Tt:  Xh  :  Yh`.

**`src/i18n/translations.ts`**

- Agregar claves `summary.snal` → "Snal" y `summary.stral` → "Stral" (ambos idiomas).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Ancho `w-[420px]`, layout de dos columnas por registro, encabezados Snal/Stral, subtotal alineado |
| `src/i18n/translations.ts` | Agregar `summary.snal`, `summary.stral` |

