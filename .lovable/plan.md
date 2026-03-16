

## Plan: Eliminar marcas de Lovable del proyecto

### Archivos a eliminar
- **`.lovable/plan.md`** y la carpeta **`.lovable/`** — solo contiene el plan de diseño, no afecta funcionalidad.

### Archivos a modificar

1. **`index.html`** — Reemplazar las meta tags de OpenGraph y Twitter que referencian Lovable:
   - Cambiar `og:title` a "Agenda Docente - UCP"
   - Cambiar `og:description` a "Sistema de Gestión de Agenda Docente - Universidad Católica de Pereira"
   - Cambiar `og:image` a usar el favicon propio (`/favicon.png`)
   - Cambiar `twitter:site` de `@Lovable` a vacío o eliminarlo
   - Cambiar `twitter:image` al favicon propio
   - Eliminar el comentario `<!-- TODO: Update og:title -->`

2. **`vite.config.ts`** — Eliminar el import de `lovable-tagger` y su uso en plugins (líneas 4 y 15). El tagger solo agrega atributos de debug para Lovable.

3. **`package.json`** — Eliminar `"lovable-tagger"` de devDependencies.

### Sin cambios necesarios
- `package-lock.json` / `bun.lock` se regenerarán automáticamente al eliminar la dependencia.

