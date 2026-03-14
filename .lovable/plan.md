

## Plan: Validación inteligente al confirmar datos

### Lógica de validación en `src/components/SummaryPanel.tsx`

Modificar `handleConfirm` para ejecutar 3 validaciones en orden:

**1. Calcular horas semanales de docencia directa:**
```ts
const docDirectaRecords = records.filter(r => r.subfunctionId === "docencia-directa");
const horasSemanalesDocDirecta = docDirectaRecords.reduce(
  (sum, r) => sum + (Number(r.data["horasSemana"]) || 0), 0
);
```

**2. Verificar si tiene actividades de investigacion:**
```ts
const tieneInvestigacion = records.some(r => r.subfunctionId === "investigacion");
```

**3. Reglas de validacion:**

- Si NO tiene investigacion Y las horas semanales de docencia directa no son exactamente 16 → toast de error bloqueante: _"El docente debe cumplir exactamente 16 horas semanales de Docencia Directa. Actualmente tiene X horas."_
- Si tiene investigacion, se omite la validacion de 16 horas.
- En ambos casos, el total semestral (`metricas.totalHorasSemestrales`) debe ser exactamente `horasSemestreDefecto` (920). Si se excede → toast de advertencia con sugerencias de donde redistribuir (listar las subfunciones con mas horas). Si es menor → toast indicando cuantas horas faltan. Ambos bloquean la navegacion.

**Import necesario:**
```ts
import { toast } from "sonner";
```

### Mensaje cuando se exceden las 920 horas

Analizar los registros agrupados y sugerir donde reducir:
```ts
// Encontrar las 2 subfunciones con más horas para sugerir redistribucion
const sugerencias = grouped
  .sort((a, b) => b.records.reduce(...) - a.records.reduce(...))
  .slice(0, 2)
  .map(g => g.shortTitle);

toast.error(`Excede las ${horasSemestreDefecto}h por ${exceso}h. Considere reducir horas en: ${sugerencias.join(", ")}.`, { duration: 7000 });
```

### Sin cambios en otros archivos
Solo se modifica `SummaryPanel.tsx`.

