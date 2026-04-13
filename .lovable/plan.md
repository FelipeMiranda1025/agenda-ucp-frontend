

# Plan: Diálogo de confirmación, persistencia de agenda y flujo de aprobación

## Resumen
Tras confirmar la agenda (910-930h), mostrar un diálogo de éxito antes del horario. Persistir la agenda en una nueva tabla `agenda_views`. Al re-loguearse, cargar la vista guardada. Si re-confirma sin respuesta, mostrar mensaje "Ups". Integrar notificaciones con el flujo de aprobación del supervisor.

---

## 1. Nueva tabla `agenda_views` (migración)

```sql
CREATE TABLE public.agenda_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cc TEXT NOT NULL,
  records JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'returned'
  reviewer_cc TEXT,
  reviewer_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_views ENABLE ROW LEVEL SECURITY;

-- RLS policies (lectura/escritura para todos los autenticados y anon, igual que agendas)
CREATE POLICY "Anyone can read agenda_views" ON public.agenda_views FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert agenda_views" ON public.agenda_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update agenda_views" ON public.agenda_views FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete agenda_views" ON public.agenda_views FOR DELETE TO anon, authenticated USING (true);

-- Trigger updated_at
CREATE TRIGGER update_agenda_views_updated_at
  BEFORE UPDATE ON public.agenda_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 2. Diálogo de confirmación exitosa
**Archivo:** `src/components/ConfirmSuccessDialog.tsx` (nuevo)

- Dialog/modal centrado con:
  - Icono CheckCircle grande verde
  - Texto grande "Se cargó con éxito"
  - Subtexto "Espera que la agenda sea aprobada"
  - Botón "Salir" que cierra el diálogo y navega a `/schedule`
- Props: `open`, `onClose`, `variant: 'success' | 'pending'`
- Variante "pending": emoji ❔, texto "Ups. Aún no dan respuesta"

## 3. Lógica en SummaryPanel
**Archivo:** `src/components/SummaryPanel.tsx`

- Al confirmar (910-930h válido):
  1. Guardar/actualizar registro en `agenda_views` con `user_cc`, `records` (JSON de todos los records actuales), `status: 'pending'`
  2. Mostrar `ConfirmSuccessDialog` variante `success`
  3. Al cerrar el diálogo, navegar a `/schedule`
- Si ya existe un `agenda_views` con `status: 'pending'` para ese usuario:
  - Mostrar variante `pending` ("Ups. Aún no dan respuesta")

## 4. Carga de agenda al re-loguearse
**Archivo:** `src/context/AgendaContext.tsx`

- Nuevo efecto: al montar con un `docenteId`, consultar `agenda_views` donde `user_cc = docenteId` y `status = 'pending'`
- Si existe, cargar los `records` del JSONB en el estado local `recordsByDocente`
- Exponer `loadFromAgendaView()` y `hasPendingAgendaView` en el contexto

## 5. Hooks de base de datos
**Archivo:** `src/hooks/useDatabase.ts`

- `useAgendaView(userCc)` — query para obtener la vista guardada
- `useUpsertAgendaView()` — mutation para insertar/actualizar
- `useUpdateAgendaViewStatus()` — mutation para que el supervisor cambie el status

## 6. Notificaciones de respuesta del supervisor
**Archivo:** `src/pages/Index.tsx`

- Modificar el cálculo de `unreadCount` para incluir cambios en `agenda_views` donde `status !== 'pending'` y el usuario no haya leído la notificación
- Solo se genera una notificación cuando el supervisor (según `user_hierarchy`) cambia el `status` a `approved` o `returned`
- Si el supervisor no ha revisado (`status` sigue en `pending`), no llega notificación al docente

## 7. Tipos
**Archivo:** `src/types/database.ts`

```typescript
export interface DbAgendaView {
  id: string;
  user_cc: string;
  records: Record<string, any>[];
  status: 'pending' | 'approved' | 'returned';
  reviewer_cc: string | null;
  reviewer_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `agenda_views` con RLS |
| `src/types/database.ts` | Tipo `DbAgendaView` |
| `src/components/ConfirmSuccessDialog.tsx` | Nuevo componente con variantes success/pending |
| `src/components/SummaryPanel.tsx` | Lógica de guardado en `agenda_views` + mostrar diálogo |
| `src/hooks/useDatabase.ts` | Hooks para `agenda_views` |
| `src/context/AgendaContext.tsx` | Cargar records desde `agenda_views` al montar |
| `src/pages/Index.tsx` | Notificaciones basadas en status de `agenda_views` |

