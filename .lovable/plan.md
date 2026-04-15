

# Plan: Notificaciones leídas desaparecen + botón historial

## Resumen

Las notificaciones leídas se ocultarán de la vista principal del dropdown de la campanita. Se agregará un botón "Ver historial" dentro del mismo dropdown que al activarse mostrará todas las notificaciones (leídas y no leídas).

## Cambios

### 1. `src/pages/Index.tsx`

- Agregar estado local `showHistory` (boolean, default false) para alternar entre vista activa e historial.
- **Vista principal (showHistory=false):** Solo mostrar notificaciones no leídas:
  - Comentarios donde `!(read_by).includes(user.id)`
  - Returned agenda (si no ha sido "dismissed" — usar `localStorage` key `dismissed_return_<agenda_id>`)
  - Pending subordinate agendas (ya desaparecen cuando se aprueban/retornan)
- **Vista historial (showHistory=true):** Mostrar TODAS las notificaciones (comentarios leídos + no leídos, returned, pending).
- Agregar botón al final del dropdown: icono `History`/`Clock` + texto "Ver historial" / "Ver nuevas" que alterna `showHistory`.
- Al abrir el dropdown y marcar como leídos (`handleOpenNotifications`), la notificación de retorno se marca como dismissed en `localStorage`.
- El `unreadCount` del badge solo cuenta las NO leídas (sin cambios en la lógica actual, solo agregar el dismiss de returned).

### 2. `src/i18n/translations.ts`

- Agregar claves:
  - `notifications.viewHistory` → "Ver historial" / "View history"
  - `notifications.viewNew` → "Ver nuevas" / "View new"
  - `notifications.read` → "Leída" / "Read" (badge opcional en historial)

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Index.tsx` | Estado `showHistory`, filtrar notificaciones leídas, botón toggle historial, dismiss returned en localStorage |
| `src/i18n/translations.ts` | Nuevas claves de traducción para historial |

