

# Plan: Filtrar dropdown "Docente" por subordinados directos via user_hierarchy

## Resumen

Actualmente `useSubordinatesWithNames` obtiene **todos** los usuarios con `id_rol = 1` (docentePlanta). Se debe cambiar para que solo muestre los subordinados directos del usuario logueado según la tabla `user_hierarchy`, de modo que el director con cc=123456789 solo vea al docente con cc=12345678 (y cualquier futuro subordinado que se agregue a la jerarquía).

## Cambios

### `src/hooks/useDatabase.ts` — función `useSubordinatesWithNames`

Reemplazar la consulta actual que hace `select * from users where id_rol=1` por:

1. Obtener el `id` numérico del supervisor desde `users` usando su `cc`
2. Consultar `user_hierarchy` para obtener los `user_id` donde `supervisor_id` = id del supervisor
3. Consultar `users` con `.in("id", subordinateIds)` para obtener nombres
4. Mapear al formato `SubordinateDocente`

Esto replica la lógica que ya existe en `usePendingAgendaViewsForSupervisor` (pasos 1-3).

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Reescribir `useSubordinatesWithNames` para filtrar por `user_hierarchy` |

