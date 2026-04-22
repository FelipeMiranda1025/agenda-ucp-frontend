

## Análisis

El usuario quiere agregar "Descargar agenda" en el menú del avatar (entre "Ver perfil" y "Registro de auditoría"), visible para todos los roles **excepto Soporte (rolId=5)**. La opción debe estar **siempre visible** pero **deshabilitada hasta que exista un horario de permanencia** (`hasSchedule === true` en `AgendaContext`). Al hacer clic, descarga un `.xlsx` que reproduce **exactamente** la plantilla `AGENDAS_DOCENTES_TDS_2026-1.xlsx` (cabecera + bloques 1.1-1.4 + 2.1-2.5 + totales/promedio + horario semanal), rellenando solo los datos del docente actualmente seleccionado en el sidebar.

Estructura de la plantilla detectada (1 hoja "Agenda"):
- Encabezado: "AGENDA SEMESTRAL DE TRABAJO", Nombre, Programa, Semestre, Periodo.
- **1. PRODUCCIÓN** (rowspan 27): 1.1 Docencia directa, 1.2 Indirecta, 1.3 Trabajos de grado, 1.4 Prácticas, total "Horas Actividades de Docencia".
- **2. ACTIVIDADES DIFERENTES A LA DOCENCIA** (rowspan 42): 2.1 Investigación, 2.2 Proyección social, 2.3 Complementarias, 2.4 Formación, 2.5 Académico-administrativas, total + subtotal investigación+social+formación.
- Totales finales: Total horas semestre, Promedio semanal, Horas semestre (920), Horas faltantes.
- Hojas adicionales (Page 2-5 vacías en la plantilla): se reservarán para "Horario de Permanencia" (cuadrícula días×horas).

## Solución

### 1. Librería
Usar `exceljs` (soporta merges, estilos, bordes, anchos de columna, mejor que SheetJS para fidelidad visual). Añadir a `package.json`.

### 2. Nuevo módulo `src/lib/exportAgenda.ts`
Función `exportAgendaToExcel({ user, selectedDocente, records, schedule, subfunctions, dropdownOptions, semesterLabel })`:
- Crea workbook con hoja **"Agenda"** y hoja **"Horario Permanencia"**.
- **Hoja Agenda** — replica plantilla fielmente:
  - Filas 1-6: cabecera con merges (`AGENDA SEMESTRAL DE TRABAJO`, nombre completo, programa, semestre, periodo).
  - Bloque PRODUCCIÓN con merge vertical "1. PRODUCCIÓN" en columna A; subbloques 1.1-1.4 cada uno con su tabla (encabezados, filas dinámicas según registros, fila "Total ..." con `SUM(...)`).
  - Fila "Horas Actividades de Docencia" con `=SUM(totales 1.1..1.4)`.
  - Bloque ACTIVIDADES DIFERENTES con merge vertical "2. ACTIVIDADES DIFERENTES A LA DOCENCIA"; subbloques 2.1-2.5 análogos. Fila "Total investigación + Proyección social + Formación".
  - Fila "Horas Diferentes a la Docencia" con `=SUM(...)`.
  - Bloque final: `Total horas semestre`, `Promedio semanal semestre` (=total/23), `Horas semestre` (920), `Horas faltantes` (=920-total).
  - Estilos: bordes, fondo gris para encabezados de subbloque, negrita en totales, anchos A=4, B=42, C-F=14.
- **Hoja Horario Permanencia**: cuadrícula con columnas Lunes-Sábado (6 días) × filas 8:00-21:00, celdas pintadas con `block.color` y `block.label` desde `getSchedule().blocks`.
- Mapeo de registros → filas plantilla:
  - 1.1: `records.filter(r => r.subfunctionId === "docencia-directa")` → columnas Asignatura, Programa, Horas/sem, #Sem, Total.
  - 1.2-1.4 y 2.x análogo, leyendo `r.data[fieldName]` según `subfunctions[i].fields`.
- Nombre de archivo: `Agenda_<FirstName>_<LastName>_<semesterLabel>.xlsx` con `FileSaver` o `Blob` + `URL.createObjectURL`.

### 3. UI — `src/pages/Index.tsx` menú avatar
Insertar nuevo `<DropdownMenuItem>` entre "Ver perfil" (línea 396-398) y la opción de auditoría (línea 399-403):
- Visible si `user && user.rolId !== 5` (todos menos Soporte).
- `disabled={!hasSchedule}` — cuando deshabilitado, mostrar `cursor-not-allowed opacity-50` y tooltip `t("export.disabledReason")` ("Crea primero el horario de permanencia").
- `onClick`: lee del contexto `records`, `getSchedule()`, `selectedDocente`, `subfunctions`, llama `exportAgendaToExcel(...)`, muestra `toast.success(t("export.success"))`.
- Icono: `Download` de `lucide-react`.
- Importar `useAgenda` (`Index.tsx` ya está dentro de `AgendaProvider`).

### 4. i18n — claves nuevas en `src/i18n/translations.ts`
| key | ES | EN |
|---|---|---|
| `export.downloadAgenda` | "Descargar agenda" | "Download agenda" |
| `export.disabledReason` | "Disponible al crear el horario de permanencia" | "Available once the permanence schedule is created" |
| `export.success` | "Agenda descargada correctamente" | "Agenda downloaded successfully" |
| `export.error` | "No se pudo generar la agenda" | "Could not generate the agenda" |

### 5. Validación de `hasSchedule`
`hasSchedule` ya existe en `AgendaContext` (memoria local: `scheduleByDocente[docenteId].blocks.length > 0`). El export usará el mismo gate. Cuando el usuario aún no creó horario, el item del menú aparece **gris/deshabilitado** sin navegar ni descargar.

### 6. Datos rellenados desde el contexto actual
- **Nombre docente**: `selectedDocente.firstName + lastName` (o `user` si "Yo").
- **Programa académico**: del usuario seleccionado (necesita lookup a `users`/`professional_careers`); para v1 se toma del registro 1.1 más reciente o cae a `—`.
- **Semestre lectivo**: leer de `system_settings` key `semester_label` o fallback `"2026-1"`.
- **Registros**: `records` ya filtrados por docente seleccionado (el contexto los expone así).
- **Horario**: `getSchedule().blocks`.

## Archivos

| Archivo | Cambio |
|---|---|
| `package.json` | Añadir dependencia `exceljs` |
| `src/lib/exportAgenda.ts` | **Nuevo** — genera `.xlsx` replicando la plantilla con datos del docente + hoja horario |
| `src/pages/Index.tsx` | Insertar `DropdownMenuItem` "Descargar agenda" entre "Ver perfil" y auditoría; lógica disabled según `hasSchedule`; `onClick` llama al exporter |
| `src/i18n/translations.ts` | Añadir `export.downloadAgenda`, `export.disabledReason`, `export.success`, `export.error` (ES/EN) |

