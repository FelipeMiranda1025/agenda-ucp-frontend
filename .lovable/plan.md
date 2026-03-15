

## Plan: Convertir el dropdown de "Asignatura" en un combobox con búsqueda

### Cambio

Reemplazar el `Select` del campo "asignatura" en "docencia-directa" por un **Combobox** basado en los componentes `Command` (cmdk) + `Popover` ya existentes en el proyecto. Esto permitirá al usuario escribir texto y filtrar las asignaturas en tiempo real.

### Archivos a modificar

**`src/components/SubfunctionForm.tsx`**:
1. Importar `Popover`, `PopoverTrigger`, `PopoverContent` y `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` desde los componentes UI existentes.
2. En la sección donde se renderiza el dropdown para el campo con `category === "asignatura"`, renderizar un Combobox en lugar del `Select` estándar:
   - Un `Popover` con un botón trigger que muestra el valor seleccionado.
   - Dentro, un `Command` con `CommandInput` para escribir/filtrar, `CommandList` con las opciones de `dbSubjects`, y `CommandEmpty` para "Sin resultados".
   - Al seleccionar un item, se actualiza `formData` igual que antes y se cierra el popover.
3. El resto de dropdowns (actividades, tipo de trabajo, etc.) siguen usando el `Select` normal.

### Comportamiento esperado
- El usuario hace clic en el campo "Asignatura" → se abre un popover con un input de búsqueda.
- Al escribir, las opciones se filtran automáticamente por coincidencia (cmdk lo hace nativamente).
- Al seleccionar, se cierra el popover y se auto-llenan los campos dependientes como antes.

