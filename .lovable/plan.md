

## Plan: Agregar horas semanales por subfunción en el panel lateral

### Cambio

En `src/components/SummaryPanel.tsx`, línea 136-138, junto al subtotal semestral de cada grupo, agregar el total de horas semanales (suma de `horasSemana` de los registros del grupo). El formato será:

```
Subtotal: 4.5h/sem · 81h
```

Donde `4.5h/sem` son las horas semanales y `81h` las semestrales actuales.

### Cálculo

Para cada grupo, sumar `record.data["horasSemana"]` de todos sus registros. Si el campo no existe, usar `record.totalHoras / 18` como fallback.

### Traducciones

Agregar clave `summary.weekly` → "sem" (ES) / "wk" (EN) en `src/i18n/translations.ts`.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Calcular y mostrar horas semanales por grupo junto al subtotal |
| `src/i18n/translations.ts` | Agregar etiqueta `summary.weekly` |

