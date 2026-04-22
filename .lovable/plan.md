

## Análisis

Actualmente `HistoryPanel.tsx` muestra agendas archivadas según jerarquía (Vicerrector ve todo, Decano/Director ven subordinados, Docente solo ve la propia). El usuario pide cambiar esta regla: **cada rol (excepto Soporte) solo puede ver y copiar SU PROPIA agenda archivada**, sin importar la jerarquía.

## Solución

### Cambios en `src/pages/HistoryPanel.tsx`

1. **Eliminar lógica jerárquica**: ya no se consultan `useSubordinatesWithNames` ni `useAllDocentes` para determinar qué agendas mostrar.
2. **`allowedCcs`**: pasa a ser siempre `new Set([user.id])` para todos los roles (Docente, Director, Decano, Vicerrector). El Vicerrector ya no ve todo.
3. **`filterEntries`**: filtra `agenda_views` archivadas dejando solo las del `user.id` actual.
4. **`docenteNameByCc`**: ya no necesita poblar nombres de subordinados; solo muestra `t("history.you")` para el usuario actual.
5. **Acción "Copiar a mi agenda actual"**: el destino siempre es `user.id` (no `entry.user_cc`), eliminando la rama condicional por rol. El diálogo de confirmación deja de mostrar el nombre del docente destino (siempre es uno mismo).
6. **Soporte**: sigue sin acceso al ítem en el menú (ya implementado en `Index.tsx`, sin cambio).

### Comportamiento resultante por rol

| Rol | Ve en Historial | Puede copiar |
|---|---|---|
| DocentePlanta | Solo la suya | A su agenda actual |
| DirectorPrograma | Solo la suya | A su agenda actual |
| DecanoFacultad | Solo la suya | A su agenda actual |
| VicerrectorAcadémico | Solo la suya | A su agenda actual |
| Soporte | Sin acceso | Sin acceso |

### Sin cambios en backend
- No se requieren migraciones ni cambios de RLS: el filtrado se hace en cliente sobre el JSONB `agenda_views` de cada `semester_archives`.
- La lógica de archivado al apagar el sistema permanece igual (sigue guardando todo).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/pages/HistoryPanel.tsx` | Quitar `useSubordinatesWithNames` y `useAllDocentes`; `allowedCcs` siempre = `{user.id}`; destino de copia = siempre `user.id`; simplificar diálogo de confirmación |

