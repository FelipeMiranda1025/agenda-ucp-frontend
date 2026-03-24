

## Plan: Actualizar datos de `investigations` y `teacher_training` y verificar auto-llenado

### Resumen

Actualizar los registros en las tablas `investigations` y `teacher_training` con las horas semanales correctas según la normativa. El auto-llenado de formularios ya está implementado en el código (AUTOFILL_MAP en SubfunctionForm.tsx líneas 307-316) para ambas subfunciones, por lo que solo se necesitan los cambios de datos.

### 1. Tabla `investigations` - Actualizar datos

Dado que se necesitan cambiar IDs (de 3 a 1 y 2), la estrategia es eliminar los registros existentes e insertar los nuevos:

```sql
-- Eliminar registros existentes
DELETE FROM investigations;

-- Insertar con IDs correctos
INSERT INTO investigations (id, name, weekly_hours, number_weeks) VALUES
  (1, 'Investigador principal', 11, 23),
  (2, 'Co-investigador', 6, 23);

-- Resetear la secuencia
ALTER SEQUENCE investigations_id_seq RESTART WITH 3;
```

### 2. Tabla `teacher_training` - Actualizar datos

Mismo enfoque: eliminar existentes, insertar correctos, eliminar el id=6.

```sql
DELETE FROM teacher_training;

INSERT INTO teacher_training (id, name, weekly_hours, number_weeks) VALUES
  (1, 'Estudios maestría', 7, 23),
  (2, 'Estudios doctorado', 15, 23);

ALTER SEQUENCE teacher_training_id_seq RESTART WITH 3;
```

### 3. Verificación del auto-llenado

No se requieren cambios en el código. El mecanismo existente en `SubfunctionForm.tsx` (AUTOFILL_MAP) ya cubre ambas subfunciones:

- `"investigacion"` → lee de `dbInvestigations` → llena `horasSemana` y `cantidadSemanas`
- `"formacion-docentes"` → lee de `dbTeacherTraining` → llena `horasSemana` y `cantidadSemanas`

Al seleccionar "Investigador principal" en el dropdown de Investigación, se auto-llenarán 11 horas/semana y 23 semanas. Lo mismo para las demás opciones.

### Archivos a modificar

| Elemento | Acción |
|---|---|
| DB: `investigations` | Recrear registros con IDs y horas correctos |
| DB: `teacher_training` | Recrear registros con IDs y horas correctos, eliminar "Otros procesos de formación" |
| Código | Sin cambios necesarios - auto-llenado ya funciona |

