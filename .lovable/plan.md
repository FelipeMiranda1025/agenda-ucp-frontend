

## Plan: Eliminar botones "+" de facultad/programa e insertar datos en faculties y professional_careers

### 1. Eliminar botones "+" de facultad y programa

En `src/components/SubfunctionForm.tsx`, agregar una condición para que las categorías `"facultad"`, `"programa"`, `"semestre"`, `"jornada"` y `"nivel"` no muestren ningún botón (ni "+" ni lápiz). Solo se mantienen los botones de gestión para las categorías que ya tienen lápiz (actividades) y asignatura.

Modificar la lógica en la línea ~521: si la categoría es `"facultad"`, `"programa"`, `"semestre"`, `"jornada"` o `"nivel"`, no renderizar nada (return `null`). Esto elimina el botón "+" del fallback.

### 2. Insertar datos en la base de datos

Usar el insert tool para agregar registros:

**Tabla `faculties`:**
- id=2: "Facultad de arquitectura y diseño"
- id=3: "Facultad de ciencias humanas, sociales y de la educación"
- id=4: "Facultad de ciencias económicas y administrativas"

**Tabla `professional_careers`:**
- id=2 a id=15: Los 14 programas especificados por el usuario

### Archivos

| Archivo | Cambio |
|---|---|
| `src/components/SubfunctionForm.tsx` | Ocultar botón "+" para categorías facultad, programa, semestre, jornada, nivel |
| Base de datos (insert) | Insertar 3 facultades y 14 carreras |

