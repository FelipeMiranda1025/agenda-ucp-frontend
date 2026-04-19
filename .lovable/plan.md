

## Análisis

En la imagen, el recuadro naranja rodea la sección **"OBSERVACIONES / Sin observaciones aún / Escribe una observación o comentario..."** con icono de avión de papel. Esto corresponde al componente `<AgendaComments />` renderizado en `src/components/SummaryPanel.tsx` línea 288.

Debajo de ese recuadro se conserva el `Textarea` con "Escribe la observación para el docente..." y los botones **Retornar / Aprobar**, que pertenecen al flujo de revisión del supervisor (no está dentro del recuadro naranja).

## Cambio

### `src/components/SummaryPanel.tsx`
- Eliminar la línea 288: `<AgendaComments agendaIds={savedAgendas.map(a => a.id)} />`
- Eliminar el import no usado de `AgendaComments` (línea 12)
- Eliminar el hook `useAgendas` ya no necesario y la variable `savedAgendas` si solo se usaba ahí. Verificar: `savedAgendas` solo aparece en línea 288 → se puede quitar también el `const { data: savedAgendas = [] } = useAgendas(user?.id);` (línea 25) y `useAgendas` del import de `@/hooks/useDatabase` (línea 13).

No se modifica el componente `AgendaComments.tsx` (puede seguir existiendo por si se usa en otra vista, pero ya no se monta aquí).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SummaryPanel.tsx` | Quitar render de `<AgendaComments />`, su import, el hook `useAgendas` y la variable `savedAgendas` |

