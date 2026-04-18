

## Análisis

El icono de la campanita en `Index.tsx` muestra notificaciones de:
1. **Agendas pendientes de subordinados** (`pendingSubordinateAgendas`): docentes que enviaron su agenda para revisión.
2. **Comentarios sin leer** (filtrados por `read_by`).
3. **Agenda devuelta** al docente (notificación inversa).

Hoy, al hacer click en una notificación de agenda subordinada se cambia `setSelectedDocente`, pero:
- **NO se desaparece** de la lista al ser "leída".
- **NO aparece en historial**: porque no hay tracking individual de "leídas" para estos items (a diferencia de comentarios que usan `read_by` en BD).
- El cierre del dropdown al hacer click sí dispara `handleOpenNotifications`, pero ese handler solo marca comentarios y la agenda devuelta, no las pendientes de subordinados.

## Solución

Implementar tracking de notificaciones leídas en **`localStorage`** (igual al patrón ya usado para `dismissed_return_<id>`), con clave `read_pending_<agendaViewId>`. Al click en un item pendiente:

1. Cambia el docente seleccionado (ya funciona, pero se reforzará invocando `loadFromAgendaView()` después).
2. Marca la notificación como leída en localStorage.
3. Cierra el dropdown.
4. Re-render: el item desaparece de "Nuevas" y aparece en "Historial" (con badge "Leída" y `opacity-60`).

El selector de Docente del sidebar ya refleja `selectedDocente` automáticamente vía contexto, así que el cambio se verá ahí sin tocar `AppSidebar.tsx`.

## Cambios técnicos

**Archivo único:** `src/pages/Index.tsx`

1. **Estado de lecturas locales** — usar un `useState` con un contador trigger (`readTick`) para forzar re-render cuando se actualiza localStorage:
   ```tsx
   const [readTick, setReadTick] = useState(0);
   const isPendingRead = (id: string) => 
     localStorage.getItem(`read_pending_${id}`) === "1";
   ```

2. **Filtrar pendientes por estado leído**:
   ```tsx
   const visiblePending = showNotifHistory
     ? pendingSubordinateAgendas
     : pendingSubordinateAgendas.filter(pa => !isPendingRead(pa.agendaView.id));
   ```

3. **Actualizar `unreadCount`** para descontar las leídas:
   ```tsx
   count += pendingSubordinateAgendas.filter(pa => !isPendingRead(pa.agendaView.id)).length;
   ```
   (incluir `readTick` en deps).

4. **Handler `onClick` del botón de notificación pendiente**:
   - Marca `localStorage.setItem('read_pending_${pa.agendaView.id}', '1')`.
   - Llama `setSelectedDocente(docente)`.
   - Llama `loadFromAgendaView()` después del cambio (para refrescar la agenda en pantalla).
   - Incrementa `readTick` para forzar re-render.
   - Cierra el dropdown (controlando `open` con `useState`).

5. **Render visual en historial**: items leídos con `opacity-60` y badge "Leída" (igual que los comentarios).

6. **Control del dropdown abierto**: cambiar `<DropdownMenu onOpenChange>` a estado controlado (`notifOpen`, `setNotifOpen`) para poder cerrarlo programáticamente al hacer click.

## Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/pages/Index.tsx` | Estado `readTick` + `notifOpen`, helper `isPendingRead`, filtrado de pendientes en "Nuevas" vs "Historial", handler de click que marca leída + cambia docente + carga agenda + cierra dropdown, badge "Leída" en historial |

No se requiere migración de BD: el tracking es por usuario/navegador en localStorage, consistente con el patrón existente de `dismissed_return_<id>`.

