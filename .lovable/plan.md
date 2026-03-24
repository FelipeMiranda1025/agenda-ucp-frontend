

## Plan: Hacer dinámico el requisito de horas de docencia directa según la configuración del cuestionario

### Problema actual
En `SubfunctionForm.tsx`, línea 30, el requisito de horas para docencia directa está hardcodeado en 16:
```typescript
const WEEKLY_HOUR_REQUIREMENTS = { "docencia-directa": 16 };
```
El texto "16h requeridas" se muestra debajo del formulario de docencia directa sin considerar el resultado del cuestionario pre-agenda.

### Solución

**1. Leer la configuración confirmada del docente en `SubfunctionForm.tsx`**

- Importar `useDocenteConfig` y `calculateHours` desde `src/hooks/useDocenteConfig.ts`
- Obtener la config del usuario logueado (ya disponible via `useAuth`)
- Calcular `finalDirectHours` a partir de las respuestas guardadas

**2. Reemplazar el valor hardcodeado**

Cambiar la constante estática `WEEKLY_HOUR_REQUIREMENTS` por un valor dinámico:
- Si existe configuración confirmada → usar `finalDirectHours` del cálculo
- Si no existe → fallback a 16h (default Art. 6d)

**3. Actualizar la validación de color**

La lógica de color (rojo si falta, verde si cumple, amarillo si excede) ya funciona con la variable `requirement` — solo necesita recibir el valor correcto.

**4. Actualizar el mensaje de validación en `SummaryPanel.tsx`**

Línea 41 tiene hardcodeado `!== 16`. Cambiar para usar también el valor dinámico de la configuración.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Importar hook, calcular requirement dinámico, reemplazar constante |
| `src/components/SummaryPanel.tsx` | Usar horas dinámicas en validación |

