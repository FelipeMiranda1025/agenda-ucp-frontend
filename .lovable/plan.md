

## Análisis

Tres cambios solicitados:

1. **Export Excel sólo para Vicerrector** (no para todos los roles). El semestre genera una nueva agenda cada periodo, por lo que el Vicerrector necesita conservar copia formal.
2. **Interruptor de sistema = corte de semestre.** Cuando el Vicerrector apague el interruptor, al volverlo a encender el sistema NO debe cargar agendas previas. Apagar = fin de semestre. Encender = nuevo semestre vacío.
3. **Nuevo ítem "Historial"** en el menú del avatar (debajo de "Ajustes"), visible para todos los roles excepto Soporte. Permite consultar agendas anteriores aprobadas y **copiarlas a la agenda actual**.

## Solución

### 1. Restringir exportación a Excel únicamente al Vicerrector

`src/pages/Index.tsx` (líneas 400-426): cambiar la condición del `DropdownMenuItem` "Descargar agenda":

```text
ANTES: {user && user.rolId !== 5 && ( ... )}
DESPUÉS: {user?.rolId === 4 && ( ... )}
```

Mantener disabled-by-`hasSchedule` y la lógica de export existente intactas. Reordenar el ítem para que aparezca debajo de "Dashboard" y arriba del interruptor (más coherente con su rol exclusivo).

### 2. Reset semestral al activar el interruptor

#### 2.1 Esquema (migración)

Añadir nueva tabla `semester_archives` para guardar snapshots históricos al apagar el sistema:

```sql
CREATE TABLE public.semester_archives (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_label text NOT NULL,
  archived_at  timestamptz NOT NULL DEFAULT now(),
  archived_by  text,
  agenda_views jsonb NOT NULL DEFAULT '[]'::jsonb,
  agenda_comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  agendas      jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedules    jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE public.semester_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read" ON public.semester_archives FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone insert" ON public.semester_archives FOR INSERT TO anon, authenticated WITH CHECK (true);
```

Añadir clave `system_settings.key='semester_label'` con valor `{label: "2026-1"}` para nombrar el semestre activo.

#### 2.2 Hook nuevo `useSemesterReset` (`src/hooks/useSemesterArchive.ts`)

Función `archiveAndResetSemester()`:
1. Lee `agenda_views`, `agenda_comments`, `agendas` (todas las filas).
2. Inserta una fila en `semester_archives` con esos snapshots + `semester_label` actual + `archived_by = user.id`.
3. Borra todas las filas de `agenda_views`, `agenda_comments`, `agendas`.
4. Incrementa el `semester_label` en `system_settings` (ej. `2026-1` → `2026-2`, `2026-2` → `2027-1`).

#### 2.3 Modificar el toggle del interruptor

`src/pages/Index.tsx` `AlertDialog` de `systemSwitchOpen`:
- **Al apagar** (`enabled: true → false`): mostrar mensaje claro "Apagar el sistema cierra el semestre actual. Las agendas serán archivadas y el sistema iniciará un nuevo semestre cuando se vuelva a encender." Al confirmar: ejecutar `archiveAndResetSemester()` y luego `toggleSystem.mutate(false)`.
- **Al encender** (`false → true`): mostrar mensaje "Iniciar un nuevo semestre. Las agendas estarán vacías para todos los docentes." Al confirmar: solo `toggleSystem.mutate(true)`. (El reset ya ocurrió al apagar.)

#### 2.4 Limpiar memoria local en `AgendaContext`

`src/context/AgendaContext.tsx`: suscribirse al evento de reseteo (vía `useSystemEnabled` cambio de `enabled` o invalidando `agenda_views` query) — cuando se detecte que el sistema pasó de `false → true`, limpiar `recordsByDocente` y `scheduleByDocente` (estado local) y forzar `loadFromAgendaView` (que ya no encontrará registros, dejando agenda vacía).

### 3. Nuevo ítem "Historial" (debajo de Ajustes)

#### 3.1 Nueva página `src/pages/HistoryPanel.tsx`

Ruta `/history` (añadir en `src/App.tsx` **fuera** del `AgendaProvider`, igual que `/dashboard`).

Layout:
- Header con botón "Volver".
- Listado tipo tabla de `semester_archives` ordenadas por `archived_at desc`: columnas `Semestre`, `Fecha de archivo`, `# Docentes`, `Acciones`.
- Al hacer clic en una fila → vista detalle: lista de docentes con agenda en ese archivo. Cada docente:
  - Visualización en sólo lectura de los `records` archivados (reutilizar `SummaryPanel` adaptado o tabla simple agrupada por subfunción).
  - Botón **"Copiar a mi agenda actual"**.

#### 3.2 Filtrado por rol

- **Docente (rol 1)**: sólo ve sus propios snapshots (filtra por `user_cc === user.id` dentro del JSONB `agenda_views`).
- **DirectorPrograma (2) / DecanoFacultad (3)**: ve los suyos + sus subordinados (usa la misma jerarquía que ya consume `useSubordinatesWithNames`).
- **Vicerrector (4)**: ve todos.
- **Soporte (5)**: el ítem del menú no aparece.

#### 3.3 Acción "Copiar a mi agenda actual"

- Toma los `records` archivados del docente seleccionado.
- Llama a `useUpsertAgendaView({ userCc: <docenteDestino>, records, status: "pending" })`.
  - Para **rol 1**: destino siempre es el propio usuario.
  - Para **roles 2/3/4**: destino es el `selectedDocente` actual (con confirmación previa "Esto reemplazará la agenda actual de X. ¿Continuar?").
- Muestra `toast.success("Agenda copiada")`.
- Invalida `agenda_views` para que la UI refleje los nuevos registros al volver a `/`.

#### 3.4 Entrada en el menú del avatar (`src/pages/Index.tsx`)

Insertar nuevo `DropdownMenuItem` justo **después** del bloque de "Ajustes" (línea 432-436) y **antes** del bloque de Dashboard:

```tsx
{user && user.rolId !== 5 && (
  <DropdownMenuItem onClick={() => navigate("/history")} className="gap-2 cursor-pointer">
    <History className="h-4 w-4" /> {t("profile.history")}
  </DropdownMenuItem>
)}
```

`History` ya está importado de lucide-react.

### 4. i18n nuevas claves (`src/i18n/translations.ts`)

| key | ES | EN |
|---|---|---|
| `profile.history` | "Historial" | "History" |
| `history.title` | "Historial de agendas" | "Agenda history" |
| `history.semester` | "Semestre" | "Semester" |
| `history.archivedAt` | "Fecha de archivo" | "Archived at" |
| `history.docentesCount` | "# Docentes" | "# Teachers" |
| `history.viewDetail` | "Ver detalle" | "View detail" |
| `history.copyToCurrent` | "Copiar a mi agenda actual" | "Copy to my current agenda" |
| `history.copyConfirm` | "Esto reemplazará la agenda actual. ¿Continuar?" | "This will replace the current agenda. Continue?" |
| `history.copySuccess` | "Agenda copiada correctamente" | "Agenda copied successfully" |
| `history.empty` | "No hay agendas archivadas" | "No archived agendas" |
| `system.shutdownSemester` | "Apagar el sistema cerrará el semestre actual y archivará todas las agendas. Al volver a encender se iniciará un nuevo semestre vacío." | "Turning off the system will close the current semester and archive all agendas. Turning it back on starts a new empty semester." |
| `system.startNewSemester` | "Se iniciará un nuevo semestre con agendas vacías para todos los docentes." | "A new semester will start with empty agendas for all teachers." |

## Archivos

| Archivo | Cambio |
|---|---|
| `supabase/migrations/<timestamp>_semester_archives.sql` | Crear tabla `semester_archives` + RLS + insertar `system_settings.semester_label` por defecto |
| `src/hooks/useSemesterArchive.ts` | **Nuevo** — hooks `useSemesterArchives()` (listar), `useArchiveAndResetSemester()` (snapshot + truncar tablas + bump label), `useSemesterLabel()` |
| `src/pages/HistoryPanel.tsx` | **Nuevo** — listar archivos, ver detalle por docente, botón "Copiar a mi agenda actual" filtrado por rol |
| `src/App.tsx` | Añadir `<Route path="/history" element={<HistoryPanel />} />` fuera de AgendaProvider |
| `src/pages/Index.tsx` | (a) Cambiar export Excel a `rolId === 4` y reubicar entre Dashboard e interruptor. (b) Añadir item "Historial" tras "Ajustes" para todos menos Soporte. (c) Modificar `AlertDialog` del interruptor: nuevos textos + ejecutar `archiveAndResetSemester` al apagar |
| `src/context/AgendaContext.tsx` | Detectar transición `systemEnabled false→true` (vía `useSystemEnabled`) y limpiar `recordsByDocente` y `scheduleByDocente` locales |
| `src/i18n/translations.ts` | Añadir todas las claves de la tabla anterior (ES/EN) |

