

## Plan: Header blanco + sistema de internacionalización con banderas

### 1. Cambiar header de verde a blanco

**Archivos:** `src/pages/Index.tsx`, `src/pages/Profile.tsx`

- Header: cambiar `bg-primary` a `bg-white dark:bg-gray-900 border-b border-gray-200`
- Textos: cambiar `text-primary-foreground` a `text-gray-800 dark:text-gray-100`
- Botones hover: ajustar a `hover:bg-gray-100`
- Separadores: cambiar a `bg-gray-300`
- Agregar `gap-6` entre logo y título (más separación)
- Logo: usar `ucp-logo.png` (versión a color) en lugar de `ucp-logo-white.png`

### 2. Crear sistema de internacionalización (i18n)

**Archivo nuevo:** `src/i18n/translations.ts`

Diccionario con todas las cadenas de texto de la app en español e inglés:
- Header: "Sistema de Gestión de Agenda Docente" / "Teaching Agenda Management System"
- Secciones: "Producción" / "Production", "Actividades diferentes a la docencia" / "Non-teaching Activities"
- Notificaciones, mensajes, perfil, cerrar sesión
- SummaryPanel: "Resumen de Datos", "Total semestral", "Confirmar datos", etc.
- AppSidebar: "Buscar...", "Docente de planta", secciones
- SubfunctionForm: "Registro", "Editando registro", "Limpiar", "Agregar", "Seleccionar...", etc.
- Profile: "Mi Perfil", labels de campos
- Toasts y mensajes de error/éxito

**Archivo nuevo:** `src/i18n/LanguageContext.tsx`

Context con:
- `language: "es" | "en"` (default: "es")
- `setLanguage(lang)` 
- `t(key: string): string` — función de traducción

### 3. Reemplazar Globe por banderas de país

**En `src/pages/Index.tsx`:**

- Eliminar import de `Globe`
- El botón del selector de idioma muestra un emoji de bandera: 🇨🇴 cuando `language === "es"`, 🇺🇸 cuando `language === "en"`
- Dropdown: "🇨🇴 Español (Colombia)" y "🇺🇸 English"
- Mover el estado `language` al `LanguageContext`

### 4. Integrar traducciones en componentes

**Archivos a modificar:**
- `src/pages/Index.tsx` — header labels, dropdowns
- `src/components/SummaryPanel.tsx` — títulos, métricas, botón confirmar, toasts
- `src/components/AppSidebar.tsx` — secciones, placeholder búsqueda
- `src/components/SubfunctionForm.tsx` — títulos de cards, placeholders, botones, toasts
- `src/pages/Profile.tsx` — header, labels de campos
- `src/App.tsx` — envolver con `LanguageProvider`

Cada componente importará `useLanguage()` y usará `t("key")` para todas las cadenas visibles.

### Resumen de archivos

| Archivo | Acción |
|---|---|
| `src/i18n/translations.ts` | Crear — diccionario ES/EN |
| `src/i18n/LanguageContext.tsx` | Crear — context + hook `useLanguage` |
| `src/App.tsx` | Envolver con `LanguageProvider` |
| `src/pages/Index.tsx` | Header blanco, banderas, usar `t()` |
| `src/pages/Profile.tsx` | Header blanco, usar `t()` |
| `src/components/SummaryPanel.tsx` | Usar `t()` |
| `src/components/AppSidebar.tsx` | Usar `t()` |
| `src/components/SubfunctionForm.tsx` | Usar `t()` |

