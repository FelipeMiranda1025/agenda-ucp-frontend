## Objetivo

Agregar un botón de **descarga de agendas** dentro de la franja roja "Resumen de Datos" (header del panel lateral derecho). Al pulsarlo abre un diálogo que muestra qué agendas puede descargar el usuario según su rol.

## Reglas por rol

| Rol | Qué puede descargar | UI del diálogo |
|---|---|---|
| **DocentePlanta** | Solo su propia agenda | Botón único "Descargar mi agenda" |
| **DirectorPrograma** | Su agenda + todas las de sus DocentesPlanta subordinados | Lista con checkboxes (incluye "Yo") |
| **DecanoFacultad** | Todas las agendas (DocentePlanta + DirectorPrograma) de su facultad | Lista filtrada por su `id_faculty`, con buscador |
| **VicerrectorAcadémico** | Todas, agrupadas por **facultad** | Selector de Facultad → lista de docentes de esa facultad con checkboxes ("Seleccionar todos" disponible) |
| **Soporte** | No aplica (no ve `SummaryPanel`) | — |

Si se selecciona una sola agenda → se descarga directamente como `.xlsx`.
Si son varias → se empaqueta en un `.zip` con un archivo por docente, nombrado `Agenda_<NombreCompleto>_<CC>.xlsx`.

## Cambios

### Backend (necesarios para filtrar)

1. **`backend/src/routes/users.ts`** — extender `GET /users` para aceptar query params: `ids`, `rols`, `id_state`, `id_faculty`, `id_professional_career`. (Hoy ignora todos.)
2. **`backend/src/routes/agendaViews.ts`** — extender `GET /agenda-views` para aceptar `user_ccs` (lista separada por comas) además del `user_cc` actual.

Ambos endpoints permanecen retro-compatibles.

### Frontend

3. **`src/hooks/useDatabase.ts`** — añadir:
   - `useDocentesByFaculty(facultyId?: number)` → consulta `/users?id_faculty=X&rols=1,2,3&id_state=1`.
   - `useAgendaViewsByCcs(ccs: string[])` → consulta `/agenda-views?user_ccs=cc1,cc2&status=approved` (la opción "solo aprobadas" se aplica como filtro client-side; el endpoint admite ambos casos).

4. **`src/lib/exportAgenda.ts`** — añadir `exportAgendasBatch(items, opts)`:
   - Reutiliza la lógica actual de `exportAgendaToExcel` pero retorna el `Workbook` en lugar de descargarlo.
   - Si recibe 1 item → genera y descarga `.xlsx`.
   - Si recibe ≥2 items → comprime en `.zip` usando **JSZip** (ya añadido a deps) y descarga.

5. **`src/components/DownloadAgendasDialog.tsx`** (nuevo) — diálogo con la UI por rol descrita arriba. Estados: cargando agendas seleccionadas, contador de seleccionadas, mensaje "este docente aún no ha diligenciado agenda" cuando no hay registros. Indica si la agenda está `pending` / `approved` / `returned` con un badge.

6. **`src/components/SummaryPanel.tsx`** — añadir botón ícono `Download` en el `<div className="bg-ucp-red">` del header (alineado a la derecha) que abre `DownloadAgendasDialog`. Visible para todos los roles que ven el panel (oculto si rol = DocentePlanta sin agenda propia, pero igual descarga la propia).

7. **`src/i18n/translations.ts`** — claves nuevas: `download.title`, `download.selectAgendas`, `download.selectFaculty`, `download.byFaculty`, `download.noData`, `download.button`, `download.allDocentes`, `download.zipName`.

### Sin cambios en

- `agenda_views` (esquema) — la información ya está allí.
- Flujo de aprobación.
- Lógica del export individual existente en `Index.tsx` (sigue funcionando para Vicerrector desde el dropdown de perfil).

## Resultado esperado

- Cualquier rol con `SummaryPanel` ve un botón de descarga al lado del título "Resumen de Datos".
- DirectorPrograma puede descargar en bloque las agendas de sus docentes.
- Decano descarga todas las de su facultad.
- Vicerrector descarga por facultad seleccionada.
- Cuando son varias se obtiene un `.zip` con un Excel por docente respetando exactamente el formato actual.
