

## Plan: Agregar usuario Director y funcionalidad de comentarios en agendas

### 1. Insertar usuario Director

Insertar en la tabla `users` con los datos proporcionados. La contraseña "1234Ucp*" se hasheará con SHA-256 (resultado: `a]` se calculará en el INSERT).

```sql
INSERT INTO users (id, first_name, second_name, first_last_name, second_last_name, cc, email, password, id_rol, id_state)
VALUES (2, 'Director', '', 'NULL', 'Pruebas', '123456789', 'director.pruebas@ucp.edu.co', '<sha256 de 1234Ucp*>', 1, 1);
```

Nota: `first_last_name` se insertará como el texto literal `'NULL'` según lo indicado (no como valor nulo).

### 2. Tabla de comentarios/observaciones en agendas

Crear tabla `agenda_comments`:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid (PK) | Auto-generado |
| agenda_id | uuid (FK → agendas) | Agenda comentada |
| reviewer_cc | text | CC del revisor |
| comment | text | Texto del comentario |
| created_at | timestamptz | Fecha de creación |

RLS: lectura y escritura abierta para `anon` y `authenticated` (consistente con el esquema actual).

### 3. Frontend: sección de comentarios

En la vista de agenda confirmada (o en el panel de resumen), agregar:
- Un área de texto para escribir observaciones
- Botón "Agregar comentario"
- Lista de comentarios existentes con fecha y nombre del revisor
- Visible para todos los usuarios logueados (dado que ambos roles ven lo mismo)

### 4. Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `agenda_comments` |
| Insert SQL | Insertar usuario Director (id=2) |
| `src/types/database.ts` | Agregar tipo `DbAgendaComment` |
| `src/hooks/useDatabase.ts` | Hooks para CRUD de comentarios |
| `src/components/AgendaComments.tsx` | Nuevo componente de comentarios |
| `src/components/SummaryPanel.tsx` o donde se muestren agendas | Integrar componente de comentarios |

