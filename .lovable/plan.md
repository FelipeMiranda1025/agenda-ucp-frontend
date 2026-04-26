## Objetivo

Implementar el backend Express completo con todas las rutas (auth, catálogos, agendas, comentarios, jerarquía, audit, subjects, users, docente-config, upload+parse documentos), correos SMTP con nodemailer y empaquetado Docker (backend + frontend Nginx + Postgres) según las sugerencias de Claude. El script SQL ya tiene todas las tablas necesarias (`password_reset_tokens`, `uploaded_documents`, `agenda_views`, etc.), así que no hay cambios de base de datos.

## Ajustes sobre la propuesta de Claude

Las sugerencias son viables, con estos ajustes para que **funcione realmente**:

1. **Contraseña de DB con `*`**: `1234Ucp*` debe ir URL-encoded en `DATABASE_URL` → `1234Ucp%2A`. Si no, `pg` interpreta mal la cadena.
2. **`docker-compose.yml`**: quitar `version: "3.8"` (obsoleto en Compose v2) y añadir `healthcheck` al backend para que el frontend espere a que esté arriba.
3. **Frontend en monorepo**: el código React vive en la raíz (Lovable lo necesita así para el preview). El `Dockerfile` y `nginx.conf` del frontend van en `/frontend/`, y el `build.context` apunta a la raíz (`..`) usando `dockerfile: frontend/Dockerfile`. Así no rompemos el preview de Lovable.
4. **`init.sql`**: usar el script ya existente `backend/migrations/001_initial_schema.sql` montándolo directamente en `/docker-entrypoint-initdb.d/` (no duplicar archivo).
5. **bcrypt vs SHA-256**: la BD actual usa SHA-256 (compatible con el seed). Mantengo SHA-256 en login para no romper los usuarios existentes; `bcryptjs` queda en dependencias para uso futuro.
6. **Auth opcional en upload**: `requireAuth` en `/api/upload` está bien, pero el endpoint actual de "parse-lineamientos" en el frontend no envía JWT todavía. Lo dejo con `requireAuth` y luego se conecta con el login.
7. **Email HTML**: la plantilla del ejemplo de Claude llegó con HTML mal pegado (líneas vacías). La reescribo limpia.
8. **Volumen de uploads**: persistido en `uploads-data` y servido estáticamente en `/uploads`.
9. **Reemplazo de `server.ts` por `index.ts`**: para alinear con el `package.json` propuesto. Se elimina el viejo.
10. **Puerto backend a 4000** (según propuesta de Claude). El frontend hace proxy vía Nginx a `backend:4000`.

## Estructura final

```text
ucp-agenda-manager/
├── docker-compose.yml          (REEMPLAZADO)
├── .env.example                (raíz, vars compartidas)
├── src/                        (React, sin cambios — preview Lovable)
├── frontend/
│   ├── Dockerfile              (NUEVO)
│   └── nginx.conf              (NUEVO)
├── backend/
│   ├── Dockerfile              (ACTUALIZADO: pdf-parse deps)
│   ├── package.json            (ACTUALIZADO: +bcryptjs, jwt, multer, nodemailer, pdf-parse, mammoth, uuid)
│   ├── migrations/
│   │   └── 001_initial_schema.sql  (sin cambios — ya tiene todas las tablas)
│   └── src/
│       ├── index.ts            (NUEVO — reemplaza server.ts)
│       ├── db.ts               (ACTUALIZADO: añade query/queryOne helpers)
│       ├── config.ts           (sin cambios)
│       ├── middleware/
│       │   ├── auth.ts         (NUEVO — JWT requireAuth)
│       │   ├── error-handler.ts
│       │   └── logger.ts
│       ├── services/
│       │   └── email.ts        (NUEVO — nodemailer)
│       └── routes/
│           ├── index.ts        (ACTUALIZADO — registra todos los routers)
│           ├── health.ts
│           ├── auth.ts         (NUEVO — login, me, forgot/reset password)
│           ├── catalogs.ts     (NUEVO — 13 endpoints GET de catálogos)
│           ├── subjects.ts     (NUEVO — CRUD)
│           ├── users.ts        (NUEVO — list, by-cc)
│           ├── agendas.ts      (NUEVO — CRUD)
│           ├── agendaViews.ts  (NUEVO — upsert + revisión)
│           ├── agendaComments.ts (NUEVO — CRUD)
│           ├── userHierarchy.ts  (NUEVO)
│           ├── auditLog.ts       (NUEVO — read-only)
│           ├── docenteConfig.ts  (NUEVO — upsert)
│           └── upload.ts         (NUEVO — multer + pdf-parse + mammoth)
└── (server.ts ELIMINADO)
```

## Pasos de implementación

### 1. Backend — dependencias y entrada
- Reescribir `backend/package.json` con todas las dependencias sugeridas (express, pg, jsonwebtoken, bcryptjs, multer, nodemailer, pdf-parse, mammoth, uuid, dotenv, cors) y devDeps de tipos.
- Eliminar `backend/src/server.ts` y crear `backend/src/index.ts` que monta CORS, JSON parser, estáticos `/uploads`, todos los routers bajo `/api/...` y `health`.
- Actualizar `backend/src/db.ts` añadiendo helpers `query()` y `queryOne()` reutilizables (manteniendo el pool actual).

### 2. Middleware
- `backend/src/middleware/auth.ts`: `requireAuth` que verifica `Authorization: Bearer <jwt>` y popula `req.user = { id, cc, rolId }`.

### 3. Servicio de email
- `backend/src/services/email.ts`: transporter SMTP nodemailer + función `sendPasswordResetEmail(to, firstName, resetUrl)` con plantilla HTML institucional UCP limpia.

### 4. Routers (todos en `backend/src/routes/`)
- `auth.ts`: `POST /login` (SHA-256, JWT 8h), `GET /me` (protegido), `POST /forgot-password` (genera token UUID, expira en 30min, manda correo), `POST /reset-password` (valida token, actualiza hash).
- `catalogs.ts`: 13 endpoints GET de solo lectura.
- `subjects.ts`, `users.ts`, `agendas.ts`, `agendaViews.ts`, `agendaComments.ts`, `userHierarchy.ts`, `auditLog.ts`, `docenteConfig.ts`: CRUD/read protegidos con `requireAuth`.
- `upload.ts`: `POST /parse-document` con multer (20MB, .pdf/.docx/.doc/.txt), extracción con `pdf-parse` o `mammoth`, persistencia en `uploaded_documents`.
- `routes/index.ts` (existente): registrar todos los routers anteriores.

### 5. Backend Dockerfile
- Actualizar `backend/Dockerfile` para incluir `python3 make g++` (deps nativas de pdf-parse), crear `/var/app/uploads`, exponer `4000`.

### 6. Frontend Docker
- Crear `frontend/Dockerfile` (build con Vite usando `VITE_API_URL` como ARG, runtime Nginx alpine).
- Crear `frontend/nginx.conf` con SPA fallback y proxy `/api/` → `http://backend:4000/api/`, `client_max_body_size 25M`.

### 7. Compose y env raíz
- Reescribir `docker-compose.yml` raíz: 3 servicios (db, backend, frontend), volúmenes nombrados (`db-data`, `uploads-data`), montaje de `./backend/migrations/001_initial_schema.sql` como `/docker-entrypoint-initdb.d/01_init.sql`, `DATABASE_URL` con `*` URL-encoded, healthchecks.
- Crear `.env.example` en raíz con `POSTGRES_PASSWORD`, `JWT_SECRET`, `SMTP_*`, `FRONTEND_URL`, `VITE_API_URL`.

### 8. Documentación
- Actualizar `README.md` y `backend/README.md` con instrucciones de arranque (`docker compose up --build -d`), ruta DBeaver (localhost:5432), URLs (frontend 5173, backend 4000), notas de SMTP de Gmail (App Password).

## Lo que NO se toca

- `src/` (frontend React) — sin cambios; el preview de Lovable sigue funcionando.
- `backend/migrations/001_initial_schema.sql` — ya está completo.
- `supabase/` — sigue presente para el preview pero el deploy real no lo usa.

## Pruebas tras la implementación

1. `docker compose up --build -d` arranca los 3 contenedores.
2. DBeaver conecta a `localhost:5432` con `admin` / `1234Ucp*` / `agendadocentedb` y ve todas las tablas seedeadas.
3. `curl http://localhost:4000/api/health` → `{status:"ok"}`.
4. `curl http://localhost:5173` → frontend React.
5. Login con CC `12345678` / `1234Ucp*` devuelve JWT.
6. Upload de un PDF a `/api/upload/parse-document` con el JWT devuelve el texto extraído.

## Notas de seguridad

- `JWT_SECRET` y `SMTP_PASS` en `.env` (no commitear). El `.env.example` solo trae placeholders.
- SMTP de Gmail requiere "App Password" (no la contraseña normal). La UCP puede usar su propio servidor SMTP cambiando `SMTP_HOST`.
- Los hashes SHA-256 actuales se mantienen para compatibilidad con el seed; migrar a bcrypt sería un paso posterior con script de re-hash.
