# Plan: Separar el proyecto en dos repositorios independientes

## Estado actual confirmado en la validación previa

✅ Frontend: typecheck OK, build OK, 29/29 tests OK
✅ Backend: typecheck OK, build OK
❌ Faltan 5 fixes que se aplicarán **antes** de la separación (ver Fase 1)

## Cómo se hará la separación (importante)

Lovable controla **un solo repo** (este). No puede crear ni hacer push a un segundo repo en GitHub. La separación se ejecuta así:

- **Lovable (Fases 1–2)**: arregla los errores pendientes, deja `backend/` totalmente autónomo y listo para copiar, valida todo en verde.
- **Tú (Fase 3, manual en tu máquina)**: clonas este repo, copias `backend/` a una carpeta nueva, creas el repo `agenda-ucp-backend` en GitHub y haces push.
- **Lovable (Fase 4)**: una vez confirmes que ya hiciste el push del backend, limpia este repo dejando solo el frontend.

Hacerlo en este orden garantiza que no pierdas código si algo sale mal en tu copia local — el backend permanece en este repo hasta que confirmes.

---

## Fase 1 — Arreglar errores pendientes en el backend

Aplicar los fixes detectados en la validación:

### A. Crear `backend/src/routes/recommendationRules.ts`
Rutas que el frontend ya invoca y hoy fallan con `Failed to fetch`:
- `GET    /` (acepta `?order=priority.desc`)
- `POST   /`
- `POST   /reset` → `UPDATE hours = default_hours, subjects = default_subjects, active = true`
- `PUT    /:id` (parcial: hours, subjects, active, label, priority)
- `DELETE /:id`

### B. Crear `backend/src/routes/systemSettings.ts`
- `GET  /` (lista)
- `GET  /:key` → devuelve `null` si no existe (sin 404)
- `PUT  /:key` → upsert `ON CONFLICT (key) DO UPDATE`

### C. Editar `backend/src/index.ts`
Registrar los dos nuevos routers:
```ts
app.use("/api/recommendation-rules", recommendationRulesRouter);
app.use("/api/system-settings", systemSettingsRouter);
```

### D. Crear `backend/.gitignore`
```
node_modules/
dist/
.env
.env.local
uploads/
*.log
.DS_Store
```

### E. Reescribir `backend/.env.example`
- `PORT=4000` (no 3001)
- Quitar variables LLM (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) que ya no se usan
- Documentar todas las variables que el código realmente lee

### F. Actualizar `backend/README.md`
Quick-start standalone: install, .env, `npm run dev`, `npm run build`, docker, lista de endpoints, decisiones de despliegue.

### G. Verificación
- `cd backend && npm run build` → exit 0
- `cd backend && npx tsc --noEmit` → exit 0
- `npm run build` (frontend) → sigue OK

---

## Fase 2 — Dejar `backend/` autocontenido

Añadir al directorio `backend/` lo necesario para que funcione como repo aislado:

### H. `backend/docker-compose.yml` (nuevo)
Compose mínimo solo con `db` + `backend` (sin frontend). Para que el equipo backend pueda levantarlo solo:
```yaml
services:
  db:    # Postgres + montaje de migrations/001_initial_schema.sql
  backend: # build desde ./Dockerfile, depende de db
volumes:
  db-data: ...
  uploads-data: ...
```

### I. `backend/.dockerignore`
`node_modules`, `dist`, `.env`, `*.log`.

### J. Confirmar que `backend/` no depende de archivos fuera de su carpeta
Revisar imports y `package.json`. Ya está OK (verificado), pero se valida de nuevo.

---

## Fase 3 — TÚ haces (instrucciones que te entrego al terminar Fase 2)

Pasos exactos a ejecutar en tu Visual Studio Code local:

```bash
# 1. Clona este repo (si no lo tienes ya)
git clone <url-de-este-repo> agenda-ucp-frontend
cd agenda-ucp-frontend
git pull --all   # asegurar última versión sincronizada con Lovable

# 2. Copia backend/ a un directorio nuevo, fuera del repo frontend
cp -r backend ../agenda-ucp-backend
cd ../agenda-ucp-backend

# 3. Inicializa git e instala
git init
git add .
git commit -m "Initial commit: backend separado del monorepo"

# 4. Crea repo en GitHub (manual desde la web) y conéctalo
git remote add origin git@github.com:<tu-usuario>/agenda-ucp-backend.git
git branch -M main
git push -u origin main

# 5. Verifica que arranca standalone
cp .env.example .env   # y editar valores
docker compose up --build -d
curl http://localhost:4000/api/health
```

**Una vez confirmes que el push funcionó y el repo nuevo está vivo**, me avisas para ejecutar la Fase 4.

---

## Fase 4 — Limpiar este repo (queda solo FRONTEND)

Solo cuando me confirmes que ya tienes el backend en su propio repo:

### K. Mover Dockerfile del frontend a la raíz
- `frontend/Dockerfile` → `Dockerfile`
- `frontend/nginx.conf` → `nginx.conf`
- Ajustar `COPY frontend/nginx.conf` → `COPY nginx.conf` dentro del Dockerfile
- Borrar carpeta `frontend/`

### L. Borrar del repo frontend
- Carpeta `backend/` completa
- `docker-compose.yml` actual (orquestaba ambos servicios)
- Carpeta `supabase/` (decisión: ver "Decisiones pendientes")

### M. Ajustar `nginx.conf` del frontend
Quitar `proxy_pass http://backend:4000` (ese hostname ya no existe en este compose). El frontend llamará directo al backend público vía `VITE_API_URL` configurado en build time.

### N. Reescribir `.env.example` raíz
Solo `VITE_API_URL=https://api.tu-dominio.com/api` (con explicación). Quitar bloque "Backend Express — referencia rápida" porque vive en otro repo.

### O. Actualizar `.dockerignore`
Quitar la línea `backend` (ya no existe).

### P. Reescribir `README.md` raíz
Solo frontend. Quick-start: `npm install`, `npm run dev`, `npm run build`, docker. Mencionar que el backend vive en `agenda-ucp-backend` con enlace al repo nuevo.

### Q. Actualizar memoria (`mem://infrastructure/self-hosted-docker`)
Reflejar que ahora hay dos repos.

### R. Re-validar
- `npm run build` → OK
- `npx vitest run` → 29/29 OK
- `docker build .` (Dockerfile frontend nuevo) → OK

---

## Decisiones pendientes (necesito tu respuesta antes de aprobar)

1. **Carpeta `supabase/`** (edge functions y plantillas de email heredadas):
   - (a) Eliminarla — ya no se usa porque migraron al backend Express propio.
   - (b) Moverla al repo backend nuevo.
   - (c) Dejarla en frontend (no recomendado).

2. **`docker-compose.yml` raíz del frontend** una vez separados:
   - (a) Eliminarlo (recomendado: cada repo con su propio compose).
   - (b) Conservar uno simplificado que solo levante el frontend.

3. **Confirmación crítica antes de Fase 4**: ¿harás tú la copia y push del backend manualmente, y me avisarás cuando esté hecho? Sin esa confirmación NO ejecutaré la Fase 4 (borrar `backend/` aquí), porque después solo se podría recuperar desde el historial de versiones de Lovable.

---

## Resultado final

**Repo 1 — `agenda-ucp-frontend`** (este repo Lovable después de Fase 4):
```text
src/, public/, index.html, package.json, vite.config.ts,
tailwind.config.ts, tsconfig*.json, Dockerfile, nginx.conf,
.env.example, README.md, .gitignore, .dockerignore
```

**Repo 2 — `agenda-ucp-backend`** (nuevo repo gestionado por ti):
```text
src/, migrations/, package.json, tsconfig.json, Dockerfile,
docker-compose.yml, .env.example, .gitignore, .dockerignore,
README.md
```

Cada uno se despliega de forma independiente sin afectar al otro, sin errores pendientes, y con todos los endpoints frontend↔backend correctamente mapeados.
