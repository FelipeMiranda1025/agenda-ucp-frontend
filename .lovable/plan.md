

## Plan: Rediseñar la barra de herramientas del header

### Objetivo
Reorganizar los iconos del header verde para que sigan el layout de la imagen de referencia: iconos alineados a la derecha del título, separados por divisores verticales, en este orden:

```text
[Logo + Título] ......... [🔔 Notificaciones] [💬 Mensajería] | [Avatar ▼] | [🌙 Modo oscuro] [🌐 Idioma]
```

### Cambios en `src/pages/Index.tsx`

1. **Campanita de notificaciones** (`Bell` de lucide-react): botón con badge rojo para indicar notificaciones pendientes (aprobación/rechazo de agenda). Al hacer clic abre un dropdown con lista de notificaciones (placeholder por ahora).

2. **Icono de mensajería** (`MessageSquare` de lucide-react): botón que abrirá un dropdown con observaciones/peticiones de otros roles (director, decanatura, vicerrectoría). Placeholder por ahora.

3. **Separador vertical** — línea `|` usando un `div` con `w-px h-6 bg-primary-foreground/30`.

4. **Dropdown de perfil** — Avatar con iniciales + chevron (ya existe), se mantiene igual.

5. **Segundo separador vertical**.

6. **Toggle modo oscuro** — se mueve aquí (ya existe, solo se reubica).

7. **Selector de idioma** (`Globe` de lucide-react): dropdown con opciones "Español" e "Inglés". Se almacena en estado local por ahora (la internacionalización real se implementará después).

### Estado nuevo
- `notificationCount: number` — contador de notificaciones no leídas (hardcoded a 0 por ahora).
- `language: 'es' | 'en'` — idioma seleccionado (solo visual por ahora).

### Archivos modificados
- `src/pages/Index.tsx` — reestructuración del header con los nuevos iconos y separadores.

