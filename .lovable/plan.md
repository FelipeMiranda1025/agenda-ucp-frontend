

# Plan: Botones Retornar/Aprobar para supervisor y Confirmar Datos para agenda propia

## Resumen

Cuando el director está revisando la agenda de un subordinado, reemplazar el botón "Confirmar Datos" por dos botones: "Retornar" (amarillo, requiere observación obligatoria) y "Aprobar" (verde, envía al decano cc=1234567890). Al volver a su propia agenda, se muestra el botón original "Confirmar Datos".

## Cambios

### `src/components/SummaryPanel.tsx`

- Detectar si `selectedDocente` es un subordinado (`selectedDocente.firstName !== "Yo"`)
- **Si es subordinado**: mostrar dos botones lado a lado:
  - **Retornar** (izquierda, color `#a8822c`): antes de ejecutar, validar que el campo de observaciones/comentarios no esté vacío. Si está vacío, mostrar toast de error. Si tiene observación, llamar `useUpdateAgendaViewStatus` con `status: "returned"`, `reviewerCc: user.id`, `reviewerComment: observación`
  - **Aprobar** (derecha, color verde): llamar `useUpdateAgendaViewStatus` con `status: "approved"`, `reviewerCc: user.id`. Esto marca la agenda como aprobada por el director para que el decano (cc=1234567890) la revise después
- **Si es "Yo"**: mantener el botón "Confirmar Datos" actual sin cambios

- Agregar un campo `Textarea` para la observación obligatoria al retornar, visible solo cuando se está revisando agenda de subordinado
- Importar `useUpdateAgendaViewStatus` y `useAgendaView` con el cc del subordinado para obtener el `id` de la agenda_view a actualizar

### `src/i18n/translations.ts`

- Agregar claves: `summary.return` ("Retornar"), `summary.approve` ("Aprobar"), `summary.observationRequired` ("La observación es obligatoria para retornar la agenda"), `summary.returnSuccess`, `summary.approveSuccess`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Condicional para mostrar Retornar+Aprobar vs Confirmar Datos; textarea de observación; lógica de retorno/aprobación |
| `src/i18n/translations.ts` | Nuevas claves de traducción |

