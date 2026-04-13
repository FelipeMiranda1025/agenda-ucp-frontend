
# Plan: Notificaciones de agendas pendientes para supervisores

## Resumen

Cuando el docente (cc=12345678) confirma su agenda, el director (cc=123456789) debe ver una notificación en la campanita con el nombre del docente y "Agenda pendiente por revisar". Se necesita:

1. Un nuevo hook que obtenga las `agenda_views` pendientes de los subordinados del usuario logueado
2. Modificar la lógica de notificaciones en `Index.tsx` para mostrar estas agendas pendientes con nombre completo del docente

## Cambios

### 1. Nuevo hook `usePendingAgendaViewsForSupervisor` en `useDatabase.ts`

- Recibe el `user.id` (cc) del supervisor logueado
- Busca en `user_hierarchy` los `user_id` donde `supervisor_id` coincide con el ID numérico del supervisor
- Luego busca en `users` las cédulas de esos subordinados
- Consulta `agenda_views` con `status = 'pending'` y `user_cc` IN (cédulas subordinados)
- Retorna un array con los datos de la agenda view + datos del usuario (nombre completo)

### 2. Modificar notificaciones en `Index.tsx`

- Importar el nuevo hook
- Incluir las agendas pendientes de subordinados en el `unreadCount`
- En el dropdown de notificaciones, renderizar cada agenda pendiente con:
  - **Nombre**: `{first_name} {second_name} {first_last_name}` del docente
  - **Descripción**: "Agenda pendiente por revisar"
  - Fecha de creación

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Nuevo hook `usePendingAgendaViewsForSupervisor` |
| `src/pages/Index.tsx` | Integrar notificaciones de agendas pendientes de subordinados |
