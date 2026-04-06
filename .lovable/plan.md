

# Plan: Formulario filtro siempre visible, botón Omitir, limpieza de agendas y total semanal global

## Cambios a implementar

### 1. Formulario filtro siempre visible al login
**Archivo:** `src/App.tsx`

Cambiar la lógica de `AppContent` para que siempre muestre el `PreAgendaQuestionnaire` al iniciar sesión, independientemente de si `config.confirmed` es `true`. El formulario se mostrará como paso obligatorio post-login cada vez.

- Eliminar la condición `!config || !config.confirmed` como gatekeeper
- Mostrar siempre el cuestionario tras login y antes de cargar la agenda
- Usar un estado local `showQuestionnaire` que inicie en `true` y se ponga en `false` al confirmar u omitir

### 2. Botón "Omitir" en el formulario filtro
**Archivo:** `src/components/PreAgendaQuestionnaire.tsx`

- Agregar prop `onSkip` además de `onConfirmed`
- En el footer, junto al botón "Confirmar y continuar", agregar un botón secundario "Omitir"
- Al presionar "Omitir", se invoca `onSkip()`

### 3. Lógica de "Omitir": verificar agendas existentes
**Archivo:** `src/App.tsx`

Al ejecutar `onSkip`:
1. Consultar la tabla `agendas` filtrando por `docente_cc = user.id`
2. Si existen agendas → cerrar el formulario y cargar la agenda con los registros guardados
3. Si no existen agendas → mostrar un `toast.error("No existen agendas diligenciadas. Obligatorio llenar este formulario filtro.")` y mantener el formulario visible

### 4. Borrar todas las agendas de la base de datos
**Migración SQL:**

```sql
DELETE FROM public.agendas;
DELETE FROM public.agenda_comments;
```

Ejecutar con la herramienta de inserción (no migración, es operación de datos).

### 5. Total semanal global encima de los totalizadores en el panel de resumen
**Archivo:** `src/components/SummaryPanel.tsx`

- Calcular la sumatoria semanal de TODOS los registros: `records.reduce((sum, r) => sum + (Number(r.data["horasSemana"]) || r.totalHoras / 18), 0)`
- Mostrar encima de la sección de métricas existente (Total semestral, Promedio/semana, etc.):
  ```
  Total semanal global: XXh
  ```
- Usar estilo destacado (font-bold, text-primary) para diferenciarlo

## Detalle técnico

### `src/App.tsx`
- Agregar `useState<boolean>(true)` para `showQuestionnaire`
- Mover la verificación de agendas existentes al handler `handleSkip`
- Usar `supabase.from("agendas").select("id").eq("docente_cc", user.id).limit(1)` para la consulta

### `src/components/PreAgendaQuestionnaire.tsx`
- Agregar prop `onSkip?: () => void`
- Botón "Omitir" con variant="outline" en el footer

### `src/components/SummaryPanel.tsx`
- Nueva fila en la sección de métricas, antes de "Total semestral"

## Orden de ejecución
1. Migración: borrar agendas y comentarios
2. Modificar `PreAgendaQuestionnaire` (agregar botón Omitir)
3. Modificar `App.tsx` (formulario siempre visible + lógica de omitir)
4. Modificar `SummaryPanel` (total semanal global)

