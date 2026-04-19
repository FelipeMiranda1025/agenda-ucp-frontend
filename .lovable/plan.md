

## Análisis

- Hoy `AppSidebar.tsx` muestra un `Select` plano con todos los subordinados + "Yo".
- `users` ya tiene `id_faculty` y `id_professional_career` (migración previa).
- `useSubordinatesWithNames` no devuelve esos campos — hay que extenderlo.
- `faculties` y `professional_careers` ya tienen hooks (`useFaculties`, `useProfessionalCareers`).
- La sección lateral debe convertirse en un **mini-navegador de 3 niveles** con botón "← Atrás" en cada paso.

## Diseño UX

Tres vistas dentro del mismo bloque "Docente" del sidebar (sin abrir un Sheet/Dialog adicional, todo inline):

```text
Nivel 0 (raíz)              Nivel 1 (carreras)           Nivel 2 (docentes)
┌──────────────────┐        ┌──────────────────┐         ┌──────────────────┐
│ Docente          │        │ ← Arq. y Diseño  │         │ ← Diseño Indus.  │
│ ▸ Yo             │        │ ▸ Diseño Indus.  │         │ ▸ Yo             │
│ ▸ Arq. y Diseño  │   →    │ ▸ Arquitectura   │    →    │ ▸ Juan Pérez     │
│ ▸ Cs. Humanas    │        │ ▸ Maestría...    │         │ ▸ Ana Gómez      │
│ ▸ Cs. Básicas    │        │ ...              │         │ ...              │
│ ▸ Cs. Económicas │        └──────────────────┘         └──────────────────┘
└──────────────────┘
```

- Solo se listan facultades/carreras que tengan al menos 1 subordinado (para evitar "callejones vacíos").
- "Yo" siempre disponible: como atajo en la raíz **y** dentro de cada lista de docentes (nivel 2) para volver rápido a la propia agenda.
- Al click en un docente → `setSelectedDocente(d)` + `loadFromAgendaView()` + toast si no hay agenda (mantiene comportamiento actual).
- Animación: transición horizontal suave (slide) entre niveles usando estado local `view: 'root' | 'careers' | 'docentes'` con `selectedFacultyId` y `selectedCareerId`.

## Cambios técnicos

### 1. `src/hooks/useDatabase.ts` — extender `SubordinateDocente`
Agregar `idFaculty: number | null` e `idProfessionalCareer: number | null` al tipo y al `select()` del hook.

### 2. `src/components/AppSidebar.tsx` — reemplazar el `Select`
- Nuevos hooks: `useFaculties()`, `useProfessionalCareers()`.
- Estado local: `navView`, `selectedFacultyId`, `selectedCareerId`.
- Función `groupedByFaculty(subordinates)` y `groupedByCareer(subordinates, facultyId)`.
- Render condicional de los 3 niveles con un botón "← Volver" en niveles 1 y 2.
- Cada item es un `<button>` estilo idéntico al de los items de subfunción (consistencia visual UCP).
- Mantener el comportamiento de `setSelectedDocente` + `loadFromAgendaView` + `toast.info(...)` actual.

### 3. Sin cambios de BD
Las columnas ya existen. Si algunos subordinados aún no tienen `id_faculty`/`id_professional_career` asignados, aparecerán en una sección **"Sin asignar"** en la raíz para no perderlos.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useDatabase.ts` | Extender `SubordinateDocente` con `idFaculty`/`idProfessionalCareer` y traer las columnas en el query |
| `src/components/AppSidebar.tsx` | Reemplazar `Select` por navegación de 3 niveles (Facultad → Carrera → Docente) con "Yo" y botón Volver |

