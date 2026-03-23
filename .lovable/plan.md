

## Plan: Traduccion completa + banderas con imagenes reales

### Resumen
Completar la traduccion de TODOS los textos visibles (titulos de formularios, labels de campos, nombres en sidebar, dias del horario, nombres de asignaturas del dropdown) y reemplazar los emojis de banderas por las imagenes PNG proporcionadas, mostradas de forma circular con un dropdown tipo chevron.

### Cambios

#### 1. Copiar imagenes de banderas a `src/assets/`
- `user-uploads://BanderaCol.png` → `src/assets/flag-col.png`
- `user-uploads://BanderaUSA.png` → `src/assets/flag-usa.png`

#### 2. `src/i18n/translations.ts` — Agregar traducciones faltantes

Agregar traducciones para:
- **Titulos de subfunciones**: `"sub.docencia-directa.title"`, `"sub.docencia-directa.short"`, etc. para las 10 subfunciones
- **Labels de campos**: `"field.asignatura"`, `"field.semestre"`, `"field.facultad"`, `"field.programa"`, `"field.jornada"`, `"field.nivel"`, `"field.horasSemana"`, `"field.cantidadSemanas"`, `"field.totalHoras"`, `"field.actividad"`, `"field.tipoTrabajo"`, `"field.cantidadProyectos"`, `"field.cantidadHoras"`, `"field.cantidadEstudiantes"`
- **Dias del horario**: `"day.monday"` ... `"day.saturday"`

#### 3. `src/data/subfunctions.ts` — Agregar translation keys

Agregar `titleKey` y `shortTitleKey` a cada subfunction config para que los componentes puedan traducir los nombres. Los campos tambien tendran un `labelKey`.

#### 4. `src/types/agenda.ts` — Agregar `labelKey` al tipo `FieldConfig`

Agregar campo opcional `labelKey: string` a la interfaz de campos.

#### 5. `src/components/SubfunctionForm.tsx` — Usar `t()` para titulos y labels

- Linea 324: Cambiar `{config.title}` por `{t(config.titleKey || config.title)}`
- Linea 371: Cambiar `{field.label}` por `{t(field.labelKey || field.label)}`

#### 6. `src/components/AppSidebar.tsx` — Usar `t()` para shortTitle

- Cambiar `{item.shortTitle}` por `{t(item.shortTitleKey || item.shortTitle)}`

#### 7. `src/data/scheduleConstants.ts` — Exportar claves de dias traducibles

Cambiar `DAYS` a claves de traduccion y agregar una funcion `getTranslatedDays(t)`.

#### 8. `src/pages/Index.tsx` — Reemplazar emojis por imagenes PNG

Cambiar el selector de idioma:
```tsx
import flagCol from "@/assets/flag-col.png";
import flagUsa from "@/assets/flag-usa.png";

// En el trigger del dropdown:
<img src={language === "es" ? flagCol : flagUsa} className="h-6 w-6 rounded-full object-cover" />
<ChevronDown className="h-3 w-3" />

// En las opciones del dropdown:
<img src={flagCol} className="h-5 w-5 rounded-full object-cover" /> Español (Colombia)
<img src={flagUsa} className="h-5 w-5 rounded-full object-cover" /> English
```

#### 9. `src/components/SummaryPanel.tsx` — Traducir titulos de subfunciones en el resumen

Donde se muestra `sf.title` o `sf.shortTitle`, usar `t(sf.titleKey)` o `t(sf.shortTitleKey)`.

### Archivos modificados
| Archivo | Accion |
|---|---|
| `src/assets/flag-col.png` | Copiar imagen |
| `src/assets/flag-usa.png` | Copiar imagen |
| `src/i18n/translations.ts` | Agregar ~40 traducciones |
| `src/types/agenda.ts` | Agregar `labelKey`, `titleKey`, `shortTitleKey` |
| `src/data/subfunctions.ts` | Agregar translation keys |
| `src/data/scheduleConstants.ts` | Dias traducibles |
| `src/pages/Index.tsx` | Banderas PNG + chevron |
| `src/components/SubfunctionForm.tsx` | Usar `t()` para titulo y labels |
| `src/components/AppSidebar.tsx` | Usar `t()` para shortTitle |
| `src/components/SummaryPanel.tsx` | Usar `t()` para titulos |

