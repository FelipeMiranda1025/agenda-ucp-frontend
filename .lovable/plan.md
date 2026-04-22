

## Análisis

Actualmente el `AgendaContext` bloquea cualquier modificación cuando `selectedDocente.id !== user.id` mediante el flag `isAgendaReadOnly` y los `console.warn` en `addRecord`, `updateRecord`, `deleteRecord`, `upsertRecord` y `saveSchedule`. Esto impide que el `DecanoFacultad` (rolId=3) reestructure las agendas de sus subordinados (`DirectorPrograma` y `DocentePlanta`), comportamiento que se requiere restaurar según el Daily.

El `VicerrectorAcadémico` también está bloqueado por la misma lógica, pero la decisión actual es tratarlo solo como revisor; mantendremos su comportamiento actual (solo lectura sobre agendas ajenas) salvo que se indique lo contrario. Si se quiere extender, se hará en el mismo bloque.

## Solución

Permitir edición de agendas ajenas únicamente cuando el rol del usuario actual es `DecanoFacultad`, manteniendo la restricción para los demás roles que no son dueños de la agenda.

### Regla nueva
```
canEditOthers = roleName === "DecanoFacultad"
isAgendaReadOnly = selectedDocente && user && selectedDocente.id !== user.id && !canEditOthers
```

### Cambios puntuales en `src/context/AgendaContext.tsx`

1. Añadir derivado `canEditOthers` desde `roleName` (ya disponible vía `useAuth()`).
2. Reemplazar el `useMemo` de `isAgendaReadOnly` para excluir al Decano.
3. En cada mutador (`addRecord`, `updateRecord`, `deleteRecord`, `upsertRecord`, `saveSchedule`), cambiar el guard:
   - **Antes:** `if (user && docenteId !== user.id) { return; }`
   - **Después:** `if (user && docenteId !== user.id && !canEditOthers) { return; }`
4. Incluir `canEditOthers` en las dependencias de los `useCallback` afectados.

### Persistencia en Supabase
El guardado de la agenda en `agenda_views` se realiza a través de los mismos mutadores y el flujo de confirmación existente; las RLS actuales son permisivas (`true`) para `anon`/`authenticated`, por lo que no se requieren cambios de migración ni de políticas. El Decano podrá guardar/confirmar la agenda del subordinado seleccionado en el sidebar usando el mismo botón "Confirmar agenda" que ya existe.

### UI
- El `SummaryPanel` y los formularios ya consultan `isAgendaReadOnly` desde el contexto. Al volverse `false` para el Decano, los botones de edición/eliminación y los inputs se habilitan automáticamente. No hay cambios de UI adicionales.
- El indicador "Revisando agenda de …" en el header sigue mostrándose; sigue siendo útil para que el Decano sepa sobre quién está editando.

### Roles afectados
| Rol | Edita su propia agenda | Edita agenda de subordinados |
|---|---|---|
| DocentePlanta | Sí | N/A (no tiene subordinados) |
| DirectorPrograma | Sí | No (solo revisa) |
| **DecanoFacultad** | **Sí** | **Sí (NUEVO)** |
| VicerrectorAcadémico | Sí | No (solo revisa) |

## Archivos

| Archivo | Cambio |
|---|---|
| `src/context/AgendaContext.tsx` | Añadir `canEditOthers` basado en `roleName === "DecanoFacultad"`; actualizar `isAgendaReadOnly` y los 5 guards de mutación (`addRecord`, `updateRecord`, `deleteRecord`, `upsertRecord`, `saveSchedule`) para permitir al Decano modificar agendas ajenas |

