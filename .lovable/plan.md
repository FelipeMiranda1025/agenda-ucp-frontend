

# Plan: Diálogo de confirmación sin redirección hasta aprobación

## Resumen

El sistema ya tiene implementado el diálogo de confirmación con las dos variantes (success/pending) y la persistencia en `agenda_views`. El cambio principal es: **no redirigir a `/schedule` al cerrar el diálogo**. El usuario permanece en la página principal hasta que su supervisor apruebe o retorne la agenda.

## Cambios

### 1. Modificar `handleDialogClose` en `SummaryPanel.tsx`

**Archivo:** `src/components/SummaryPanel.tsx`

- Eliminar la navegación a `/schedule` cuando `dialogVariant === "success"`
- En ambas variantes (success y pending), simplemente cerrar el diálogo y el usuario permanece en la misma página
- El usuario solo podrá acceder a `/schedule` (Distribución Horaria) cuando el status de su `agenda_views` sea `approved`

### 2. Proteger la ruta `/schedule`

**Archivo:** `src/App.tsx` o `src/pages/ScheduleBuilder.tsx`

- Verificar el status del `agenda_views` del usuario actual
- Si `status !== 'approved'`, redirigir de vuelta a `/` o mostrar un mensaje indicando que la agenda está pendiente de aprobación
- Solo permitir acceso a la página de Distribución Horaria si el director ha aprobado la agenda

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Eliminar `navigate("/schedule")` del `handleDialogClose` |
| `src/pages/ScheduleBuilder.tsx` | Agregar verificación de status `approved` antes de renderizar |

