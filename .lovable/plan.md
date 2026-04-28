## Objetivo

Cuando el Decano de Facultad aprueba una agenda (sea del DocentePlanta o del DirectorPrograma), el dueño de esa agenda debe ver, al iniciar sesión o al recargar, la **Distribución Horaria** (`/schedule`) como primera interfaz, en lugar del formulario de Agenda (`/`).

## Estado actual

- La aprobación del Decano ya marca `agenda_views.status = "approved"` (vía `useUpdateAgendaViewStatus`).
- `ScheduleBuilder` (`/schedule`) ya valida que `agendaView.status === "approved"` y bloquea el acceso si no lo está.
- Hoy, al entrar, el usuario siempre cae en `/` (Index) aunque su agenda esté aprobada. Debe entrar manualmente al horario.

## Cambios

### 1. Auto-redirección en `src/pages/Index.tsx`

Agregar un `useEffect` que, cuando `agendaView?.status === "approved"`, navegue automáticamente a `/schedule` con `replace: true`. Solo aplica para roles que diligencian agenda propia (`DocentePlanta`, `DirectorPrograma`); supervisores (`DecanoFacultad`, `VicerrectorAcadémico`) no se redirigen para no interferir con su panel de revisión.

Para permitir que el usuario aprobado vuelva a consultar su agenda en modo lectura si lo desea, se respetará un flag opcional en la URL (`/?view=agenda`) que omite la redirección. No se añade UI nueva en este paso; basta con que el horario sea la vista por defecto post-aprobación.

### 2. Sin cambios de backend ni esquema

- No se requieren migraciones.
- No se modifica `ScheduleBuilder` (su guardia ya es correcta).
- No se modifica el flujo de aprobación del Decano.

## Detalle técnico

```tsx
// src/pages/Index.tsx (cerca de los otros useEffect)
const isOwnerRole = roleName === "DocentePlanta" || roleName === "DirectorPrograma";

useEffect(() => {
  if (!isOwnerRole) return;
  if (agendaView?.status !== "approved") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "agenda") return; // escape hatch
  navigate("/schedule", { replace: true });
}, [isOwnerRole, agendaView?.status, navigate]);
```

## Resultado esperado

- DocentePlanta / DirectorPrograma con agenda aprobada → al iniciar sesión ven directamente la Distribución Horaria.
- Si la agenda está `pending` o `returned` → siguen viendo el formulario de Agenda como hoy.
- Decano y Vicerrector → flujo intacto.
