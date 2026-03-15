

## Plan: Preparar el proyecto para clonación desde GitHub

### Situación actual
El proyecto ya tiene `package.json` con todas las dependencias, archivos de lock (`package-lock.json`, `bun.lock`), y el `.env` con las variables de entorno. Sin embargo, falta documentación clara de setup y un archivo `.env.example` como referencia.

### Cambios a realizar

1. **Crear `.env.example`** — archivo de referencia con las variables necesarias (sin valores sensibles), para que quien clone sepa qué configurar.

2. **Actualizar `README.md`** — reescribir con instrucciones claras y específicas del proyecto:
   - Requisitos previos (Node.js v18+, npm)
   - Pasos de instalación (`npm install`, copiar `.env.example` a `.env`, `npm run dev`)
   - Scripts disponibles (`dev`, `build`, `test`)
   - Stack tecnológico

3. **Verificar `.gitignore`** — actualmente el `.env` NO está ignorado, lo cual está bien porque contiene solo claves públicas (anon key). Pero se agregará un comentario en `.env.example` explicando esto.

### Resultado
Cualquier persona que clone el repositorio podrá ejecutar el proyecto siguiendo las instrucciones del README, sin necesidad de conocimiento previo de la configuración.

