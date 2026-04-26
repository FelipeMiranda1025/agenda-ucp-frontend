# Sistema de Agenda Docente — UCP

Aplicación web para la gestión de agendas y distribución horaria de docentes
de planta de la Universidad Católica de Pereira.

## Arquitectura

Monorepo con tres servicios desplegados por Docker Compose:

```
ucp-agenda-manager/
├── src/                    Frontend React + Vite + TS (preview Lovable)
├── public/
├── index.html
├── package.json            Deps del frontend
├── vite.config.ts
├── tailwind.config.ts
│
├── frontend/
│   ├── Dockerfile          Build Vite + Nginx (sirve /dist)
│   └── nginx.conf          SPA fallback + proxy /api → backend:4000
│
├── backend/
│   ├── src/                Express + pg + JWT + multer + nodemailer
│   │   ├── index.ts        Punto de entrada
│   │   ├── db.ts           Pool pg + helpers query/queryOne
│   │   ├── middleware/auth.ts
│   │   ├── services/email.ts
│   │   └── routes/         auth, catalogs, subjects, users, agendas,
│   │                       agendaViews, agendaComments, userHierarchy,
│   │                       auditLog, docenteConfig, upload, health
│   ├── migrations/001_initial_schema.sql
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      Postgres + backend + frontend
├── .env.example            Variables compartidas
└── README.md
```

## Arranque rápido (Docker)

```bash
# 1. Copia las variables de entorno y ajústalas (mínimo: SMTP_USER/SMTP_PASS y JWT_SECRET)
cp .env.example .env

# 2. Si tenías un contenedor antiguo "agendadocente-postgres" levántalo abajo
docker stop agendadocente-postgres 2>/dev/null
docker rm   agendadocente-postgres 2>/dev/null

# 3. Build + arranque
docker compose up --build -d

# 4. Verifica
curl http://localhost:4000/api/health
open http://localhost:5173
```

### Servicios

| Servicio  | Puerto host           | Notas                                    |
|-----------|-----------------------|------------------------------------------|
| Postgres  | `localhost:5432`      | Conectar con DBeaver (admin / 1234Ucp\*) |
| Backend   | `http://localhost:4000/api` | Express + JWT                      |
| Frontend  | `http://localhost:5173`     | React + Nginx (proxy `/api`)       |

### Reinicializar la base de datos

```bash
docker compose down -v && docker compose up --build -d
```

El script `backend/migrations/001_initial_schema.sql` se ejecuta automáticamente
en el primer arranque (cuando el volumen está vacío).

## Endpoints principales del backend

- `POST /api/auth/login` — login con `cc` o `email` + password
- `GET  /api/auth/me`    — usuario autenticado (JWT)
- `POST /api/auth/forgot-password` — envía correo de recuperación
- `POST /api/auth/reset-password`  — restablece contraseña con token
- `GET  /api/{roles,states,faculties,...}` — catálogos
- `GET/POST/PUT/DELETE /api/subjects` — CRUD asignaturas
- `GET/POST/PUT/DELETE /api/agendas`
- `GET/POST/PUT /api/agenda-views` — confirmación + flujo de revisión
- `POST /api/upload/parse-document` — sube PDF/DOCX/TXT y devuelve texto

Todos los endpoints (excepto login y forgot/reset password) requieren
header `Authorization: Bearer <jwt>`.

## SMTP

El correo de recuperación usa `nodemailer`. Por defecto está configurado
para Gmail (puerto 587, STARTTLS):

- En Gmail necesitas un **App Password** (no la contraseña normal).
- Para el SMTP institucional UCP, ajustar en `.env`:
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

## Subida e interpretación de documentos

`POST /api/upload/parse-document` recibe un archivo (`multipart/form-data`,
campo `file`) de hasta 20 MB. Soporta `.pdf`, `.docx`, `.doc`, `.txt`.
Extrae el texto con `pdf-parse` o `mammoth` y lo guarda en
`uploaded_documents` junto con el archivo original (volumen `uploads-data`).

## Desarrollo local sin Docker

```bash
# Backend
cd backend
cp .env.example .env       # ajustar DATABASE_URL a tu Postgres local
npm install
npm run dev                # http://localhost:4000

# Frontend
cd ..
npm install
VITE_API_URL=http://localhost:4000/api npm run dev   # http://localhost:8080
```
