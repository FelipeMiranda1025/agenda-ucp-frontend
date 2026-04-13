# Plan: Eliminación del formulario filtro, lógica dinámica de recomendaciones y reglas de bloqueo

## Resumen

Eliminar el formulario filtro (PreAgendaQuestionnaire), ir directo a la página principal tras login, extender inactividad a 30 min, y reemplazar la lógica de horas obligatorias por un sistema de recomendaciones dinámicas basado en los registros activos en investigación, administrativas y formación docentes.

---

## Bloque 1: Inactividad 30 minutos

**Archivo:** `src/components/InactivityWarning.tsx`

- Cambiar `INACTIVITY_TIMEOUT` de 5min a 30min (30 * 60 * 1000)
- `WARNING_AT` se ajusta automáticamente (29 min)

## Bloque 2: Eliminar formulario filtro, login directo a página principal

**Archivos:** `src/App.tsx`

- Eliminar el estado `showQuestionnaire` y toda la lógica del `PreAgendaQuestionnaire`
- Tras autenticación, ir directo al `AgendaProvider` + `BrowserRouter` con las rutas
- Ya no se importa `PreAgendaQuestionnaire`

## Bloque 3: Eliminar obligatoriedad de horas docencia directa

**Archivos:** `src/components/SummaryPanel.tsx`, `src/components/SubfunctionForm.tsx`

### SummaryPanel.tsx

- Eliminar la validación de `handleConfirm` que exige horas exactas de docencia directa (líneas 35-52)
- Eliminar imports de `useDocenteConfig`, `calculateHours`, `DocenteResponses` si ya no se usan

### SubfunctionForm.tsx

- Eliminar el bloque "Total de horas semanales" actual (líneas 677-696)
- Eliminar las variables `dynamicRequirement`, `requirement`, `weeklyHoursColor`, `totalWeeklyHours` relacionadas con la validación obligatoria
- Eliminar import de `useDocenteConfig`, `calculateHours`, `DocenteResponses`

## Bloque 4: Mensajes recomendativos dinámicos en docencia directa

**Archivo:** `src/components/SubfunctionForm.tsx`

Reemplazar el bloque eliminado con dos mensajes en gris debajo del formulario de docencia directa:

```
Se recomienda Xh de docencia directa
Se recomienda Y asignaturas
```

**Valores por defecto:** X=16, Y=5. Estos valores cambian dinámicamente según registros en el panel resumen.

### Motor de recomendaciones (nuevo cálculo en SubfunctionForm o hook dedicado)

Se lee `records` del `AgendaContext` y `user.rolId` del `AuthContext` para calcular:

**Reglas de Investigación (cualquier rol):**


| Registros en investigación        | Horas | Asignaturas |
| --------------------------------- | ----- | ----------- |
| 1x Investigador principal         | 10h   | 3           |
| 2x Investigador principal         | 4h    | 1           |
| 1x Co-investigador                | 13h   | 4           |
| 2x Co-investigador                | 9h    | 3           |
| 3x Co-investigador                | 6h    | 2           |
| 1x Inv. Principal + 2x Co-invest. | 3h    | 1           |


**Reglas Administrativas (aplican según rol y tienen PRIORIDAD sobre investigación):**


| Actividad (rol)         | Horas | Asignaturas |
| ----------------------- | ----- | ----------- |
| Director depto/pregrado | 6h    | 2           |
| Director posgrado x1    | 11h   | 4           |
| Director posgrado x2    | 6h    | 3           |
| Coordinador área        | 13h   | 4           |
| Director doctorado      | 2h    | 1           |
| Decano facultad         | 2h    | 1           |
| Vicerrector académico   | 2h    | 1           |


Cuando se selecciona una actividad administrativa, su valor de recomendación **prevalece** sobre investigación (no se acumulan). Si hay admin + investigación, se usa el valor de la administrativa.

**Reglas Formación Docentes (cualquier rol, prevalece sobre investigación):**


| Actividad            | Horas | Asignaturas |
| -------------------- | ----- | ----------- |
| Estudios maestría    | 12h   | 4           |
| Estudios pedagógicos | 13h   | 4           |
| Estudios doctorado   | 8h    | 2           |


Formación docentes también prevalece sobre investigación.

## Bloque 5: Reglas de bloqueo en formularios

### Investigación (`investigacion`)

- Máx 2 registros de "Investigador principal"
- Máx 3 registros de "Co-investigador"  
- Si hay 2x Inv. Principal → bloquear Co-investigador
- Si hay 3x Co-investigador → bloquear Inv. Principal
- Si hay 1x Inv. Principal + 2x Co-investigador → bloquear ambos
- Implementar filtrando las opciones del dropdown según registros existentes

### Administrativas (`administrativas`)

- Máx 1 registro por actividad (excepto "Director de programa posgrado" que permite 2)
- Si hay cualquier actividad que NO sea dir. posgrado → bloquear las demás (excepto dir. posgrado)
- Si hay 2x dir. posgrado → bloquear todas las demás
- Implementar filtrando opciones del dropdown

### Formación docentes (`formacion-docentes`)

- Máx 1 registro por actividad
- Si hay 1 actividad → bloquear todas las demás
- Si "Estudios doctorado" seleccionado → bloquear formularios: investigación, proyección social, administrativas (deshabilitar completamente esos formularios)

## Bloque 6: Bloqueo de formularios por estudios doctorado

**Archivo:** `src/context/AgendaContext.tsx` o `src/components/SubfunctionForm.tsx`

- Exponer función `isFormBlocked(subfunctionId)` que retorna `true` si hay un registro de "Estudios doctorado" en formación-docentes
- En SubfunctionForm, si el formulario está bloqueado, mostrar mensaje y deshabilitar inputs

## Bloque 7: Color gris para mensajes recomendativos

- Todos los mensajes "Se recomienda..." usan `text-muted-foreground` (gris) en lugar de azul
- Aplica a: docencia directa, trabajos de grado, prácticas académicas

---

## Archivos a modificar


| Archivo                                | Cambio                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/components/InactivityWarning.tsx` | Timeout 30 min                                                                                                 |
| `src/App.tsx`                          | Eliminar PreAgendaQuestionnaire, login directo                                                                 |
| `src/components/SubfunctionForm.tsx`   | Eliminar validación obligatoria, agregar recomendaciones dinámicas, reglas de bloqueo en dropdowns, color gris |
| `src/components/SummaryPanel.tsx`      | Eliminar validación obligatoria de horas DD                                                                    |
| `src/context/AgendaContext.tsx`        | Función para verificar bloqueo por estudios doctorado                                                          |
