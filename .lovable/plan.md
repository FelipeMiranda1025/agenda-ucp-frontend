

## Plan: Traducir opciones de dropdown y registros del resumen al inglés

### Enfoque

Crear un diccionario de traducciones para todos los valores de las opciones de los catálogos de la base de datos (asignaturas, actividades, facultades, etc.). Cuando el idioma sea inglés, mostrar la versión traducida en dropdowns y panel de resumen. Al guardar en la base de datos, siempre usar el valor original en español.

### Archivos a crear/modificar

**1. Crear `src/i18n/optionTranslations.ts`** — Diccionario español→inglés para todos los valores de catálogos:
- Asignaturas (29 materias)
- Actividades de docencia indirecta, investigación, proyección social, formación, complementarias, administrativas, prácticas académicas
- Trabajos de grado
- Facultades, programas, niveles de formación, jornadas, semestres

Incluir una función `translateOption(value: string, lang: Language): string` que retorne el valor traducido o el original si no existe traducción.

**2. Modificar `src/components/SubfunctionForm.tsx`** — En los dropdowns:
- Mostrar `translateOption(item.name, language)` en lugar de `item.name` como texto visible
- Mantener `item.name` (español) como el `value` del Select/Combobox para que el dato interno siga en español
- Aplicar tanto al combobox de asignaturas como a los Select de otras categorías

**3. Modificar `src/components/SummaryPanel.tsx`** — En el panel de resumen:
- Traducir el label del registro (primer valor string del `record.data`) usando `translateOption`
- Traducir los `shortTitle` de los grupos (ya usan `t()`, esto ya funciona)

**4. Modificar `src/components/SubfunctionForm.tsx`** — Campos read-only auto-rellenados:
- Traducir los valores mostrados en campos de solo lectura (facultad, programa, nivel) cuando el idioma es inglés

### Detalle técnico

```text
Flujo de datos:
DB (español) → translateOption() → UI (inglés/español según idioma)
UI (formulario) → value siempre en español → upsertRecord → DB (español)
```

El valor interno (`formData[field.name]`) siempre se almacena en español (el `name` original de la BD). Solo se traduce visualmente al renderizar.

### Archivos

| Archivo | Cambio |
|---|---|
| `src/i18n/optionTranslations.ts` | Nuevo: diccionario de traducciones de valores |
| `src/components/SubfunctionForm.tsx` | Usar `translateOption` en textos visibles de dropdowns y campos read-only |
| `src/components/SummaryPanel.tsx` | Usar `translateOption` en labels de registros |

