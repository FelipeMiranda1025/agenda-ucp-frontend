# Separación del proyecto en Frontend + Backend (Fase 1)

## Objetivo

Resolver la falencia de despliegue separando el código en una estructura de monorepo con dos carpetas independientes, eliminando toda dependencia de Supabase (cloud, self-hosted) y Lovable Cloud. La nueva arquitectura será:

- **Frontend**: React + Vite (lo que ya existe), consume un API REST por HTTPS.
- **Backend**: Node.js + Express + driver `pg` puro contra PostgreSQL, todo dockerizado.

Esta entrega es la **Fase 1 (esqueleto)**. El frontend seguirá funcionando con su cliente Supabase actual mientras avanzamos por fases posteriores. Esto evita romper la aplicación mientras se construye el reemplazo.

## Nueva estructura del repositorio

```text
/  (raíz del repo)
├── frontend/                  ← React + Vite (todo lo que hoy está en raíz)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig*.json
│   ├── components.json
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── vitest.config.ts
│   ├── .env.example
│   └── Dockerfile             ← nuevo: build estático servido por nginx
│
├── backend/                   ← API Node.js + Express
│   ├── src/
│   │   ├── server.ts          ← entry point Express
│   │   ├── db.ts              ← pool de conexión pg
│   │   ├── config.ts          ← lectura de variables de entorno
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   └── logger.ts
│   │   ├── routes/
│   │   │   ├── health.ts      ← GET /api/health (prueba)
│   │   │   └── index.ts       ← agregador de rutas
│   │   └── types/
│   │       └── api.ts
│   ├── migrations/
│   │   └── 001_initial_schema.sql   ← copia consolidada de init.sql
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile             ← nuevo
│   ├── .env.example
│   └── README.md
│
├── docker-compose.yml         ← orquesta postgres + backend + frontend
├── .gitignore
└── README.md                  ← documentación raíz del monorepo
```

## Qué se hace en esta fase

### 1. Reorganización física de carpetas

Mover **todo el código del frontend actual** a la subcarpeta `frontend/`:

- `src/`, `public/`, `index.html` → `frontend/`
- `package.json`, `bun.lock`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `vitest.config.ts`, `components.json` → `frontend/`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` → `frontend/`
- `.env.example` (la versión de Vite) → `frontend/.env.example`

El frontend NO se refactoriza en esta fase: sigue importando desde `@/integrations/supabase/client` y consumiendo Supabase tal cual. Esto se reemplazará en fases siguientes.

### 2. Crear backend nuevo desde cero

Stack: **Node.js 20 + TypeScript + Express + pg + zod + cors + dotenv**.

Archivos creados:

- `backend/package.json` con scripts `dev`, `build`, `start`, `migrate`.
- `backend/tsconfig.json` (target ES2022, module NodeNext).
- `backend/src/config.ts`: lee `DATABASE_URL`, `PORT`, `JWT_SECRET`, `CORS_ORIGIN` desde el entorno.
- `backend/src/db.ts`: pool global de `pg` con manejo de errores y graceful shutdown.
- `backend/src/server.ts`: Express con middlewares (cors, json body parser, logger, error handler). Monta `/api`.
- `backend/src/middleware/error-handler.ts`: convierte excepciones a respuestas JSON consistentes `{ error, code }`.
- `backend/src/middleware/logger.ts`: log request/response básico.
- `backend/src/routes/index.ts`: router agregador.
- `backend/src/routes/health.ts`: endpoint `**GET /api/health**` que devuelve `{ status: 'ok', db: 'ok'|'error', version, uptime }`. Hace `SELECT 1` contra Postgres para validar conexión.
- `backend/migrations/001_initial_schema.sql`: copia del `init.sql` actual (tablas, índices, datos iniciales). En fases posteriores se irá ajustando (quitar políticas RLS de Supabase, adaptar a auth propia, etc.).

### 3. Dockerización completa

#### `backend/Dockerfile`

Multi-stage build: `node:20-alpine` para build TypeScript → imagen final ligera ejecutando `node dist/server.js`. Expone puerto `3001`.

#### `frontend/Dockerfile`

Multi-stage: `node:20-alpine` para `npm run build` → `nginx:alpine` sirviendo `dist/` con configuración SPA (fallback a `index.html`). Expone puerto `80`.

#### `docker-compose.yml` (raíz, reemplaza el actual)

Tres servicios:

- **postgres**: `postgres:16-alpine`, volumen persistente `pgdata`, ejecuta `backend/migrations/*.sql` al primer arranque vía `/docker-entrypoint-initdb.d/`.
- **backend**: build desde `./backend`, depende de postgres healthy, expone `3001`, lee env vars del archivo `.env` raíz.
- **frontend**: build desde `./frontend`, expone `8080`, configurado para apuntar al backend en build time vía `VITE_API_URL`.

El `docker-compose.yml` actual (con servicios de Supabase: gotrue, postgrest, realtime, kong, studio, meta) se elimina por completo. La carpeta `docker/` y `init.sql` raíz también se eliminan (su contenido se traslada a `backend/migrations/`).

### 4. Variables de entorno

Tres archivos `.env.example`:

- **Raíz** (`./.env.example`): valores compartidos por docker-compose
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - `JWT_SECRET`
  - `BACKEND_PORT=3001`, `FRONTEND_PORT=8080`
- `**backend/.env.example**`: para correr backend fuera de Docker
  - `DATABASE_URL=postgres://...`
  - `PORT=3001`
  - `JWT_SECRET=...`
  - `CORS_ORIGIN=http://localhost:5173`
- `**frontend/.env.example**`: para correr frontend fuera de Docker
  - `VITE_API_URL=http://localhost:3001/api` (será usado en futuras fases)
  - Variables Vite/Supabase actuales se conservan temporalmente

### 5. Documentación

`README.md` raíz reescrito explicando:

- Arquitectura del monorepo
- Cómo levantar todo con `docker compose up -d` (un solo comando, listo para producción institucional UCP)
- Cómo desarrollar frontend y backend por separado
- Roadmap de las próximas fases

`backend/README.md`: cómo añadir endpoints, estructura del proyecto, convenciones.

## Lo que NO se hace en esta fase (queda para fases siguientes)

- **Fase 2 (Auth + Users)**: endpoints `POST /api/auth/login`, `POST /api/auth/forgot-password`, CRUD `/api/users`. JWT propio. Refactor de `AuthContext`, `LoginDialog`, `useAuth` para llamar al backend.
- **Fase 3 (Dominios principales)**: endpoints CRUD para `agendas`, `agenda_views`, `agenda_comments`, `subjects`, `user_hierarchy`, `docente_semester_config`. Refactor de hooks `useAgenda`, `useDatabase`, `useDocenteConfig`.
- **Fase 4 (Catálogos y actividades)**: endpoints para `roles`, `states`, `semester`, `faculties`, `professional_careers`, `education_levels` y las 8 tablas de actividades. Refactor de los formularios CRUD.
- **Fase 5 (Audit log + recommendations + lineamientos)**: triggers SQL puros (sin Supabase), endpoints, refactor de `useRecommendationRules`, `useLineamientosImport`.
- **Fase 6 (Subida + interpretación de documentos)**: endpoint `POST /api/upload`
  con `multer` (volumen Docker `/var/app/uploads`, límite `MAX_UPLOAD_MB`) y endpoint
  `POST /api/parse-document` que extrae texto con `pdf-parse` (PDF) o `mammoth` (DOCX)
  y lo envía a una API LLM externa (OpenAI o Anthropic Claude vía `LLM_PROVIDER`).
  Reemplaza Supabase Storage (`lineamientos`) y la edge function `parse-lineamientos`.
- **Fase 7 (Emails transaccionales con nodemailer)**: servicio SMTP configurable
  (Gmail, SendGrid, Mailgun o servidor SMTP institucional UCP) vía variables
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Endpoints:
  `POST /api/auth/forgot-password` (genera token, envía email de recuperación)
  y `POST /api/auth/reset-password` (valida token, actualiza contraseña). Cola
  simple en Postgres (`email_queue`) con worker en proceso. Reemplaza las edge
  functions `send-transactional-email`, `process-email-queue`, `request-password-reset`
  y `auth-email-hook`.
- **Fase 8 (Limpieza final)**: eliminar `frontend/src/integrations/supabase/`, eliminar dependencia `@supabase/supabase-js`, eliminar `supabase/` del repo.

## Resultado esperado al terminar la Fase 1

- El repositorio queda organizado en `frontend/` y `backend/`.
- `docker compose up -d` levanta tres contenedores: PostgreSQL con esquema cargado, backend Express respondiendo en `http://localhost:3001/api/health`, frontend en `http://localhost:8080`.
- El frontend sigue funcionando exactamente como hoy (consume Supabase Cloud actual hasta que se migren los endpoints en fases siguientes).
- La UCP ya tiene una base desplegable autónoma sin Supabase ni Lovable, y el camino de migración progresiva está documentado.

## Detalles técnicos clave

- **Driver**: `pg` (node-postgres) con `Pool`, `parseInt8: true`, `application_name: 'agenda-ucp-api'`.
- **Validación**: `zod` para schemas de request body / query params en cada endpoint futuro.
- **Errores**: clase `ApiError` con `status` y `code`; middleware central serializa a JSON.
- **CORS**: configurable vía `CORS_ORIGIN` (lista separada por comas).
- **Logs**: middleware simple que imprime `method url status duration`. En fase posterior se puede cambiar por `pino`.
- **Migraciones**: por ahora archivos `.sql` numerados ejecutados por Postgres en el primer arranque. En Fase 2 se puede añadir `node-pg-migrate` o similar para migraciones incrementales.
- **Healthcheck Docker**: el servicio backend incluye healthcheck que llama a `/api/health` para que `frontend` espere a que esté listo.