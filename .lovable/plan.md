

# Plan: Permitir navegación libre entre agendas (Yo y subordinados)

## Problema actual

Cuando el usuario con rol `directorPrograma` cambia de docente en el dropdown, la agenda del subordinado solo se carga si no hay registros previos en memoria (`recordsByDocente[docenteId]`). Además, al volver a "Yo", los datos propios pueden no recargarse correctamente. El sidebar también se cierra al cambiar (`onClose()`), lo cual dificulta la navegación rápida.

## Cambios

### 1. `src/context/AgendaContext.tsx` — Siempre recargar al cambiar docente

- En el `useEffect` de auto-load (línea 271-278), **eliminar la condición** `if (!existing || existing.length === 0)` para que **siempre** llame `loadFromAgendaView()` al cambiar de docente, garantizando datos frescos.
- Esto permite ir y venir entre "Yo" y cualquier subordinado sin restricciones.

### 2. `src/components/AppSidebar.tsx` — No cerrar sidebar al cambiar docente

- Eliminar la llamada `onClose()` dentro del `onValueChange` del Select (línea 108), para que el usuario pueda seguir cambiando entre docentes sin que el sidebar se cierre.
- Mantener la llamada `loadFromAgendaView()` con toast para subordinados sin agenda.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/context/AgendaContext.tsx` | Eliminar condición en useEffect para siempre recargar agenda al cambiar docente |
| `src/components/AppSidebar.tsx` | Eliminar `onClose()` del onValueChange del dropdown docente |

