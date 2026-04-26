# Agenda UCP — Backend API

API REST para el Sistema de Agenda Docente de la Universidad Católica de Pereira.

## Stack

- **Node.js 20** + **TypeScript**
- **Express 4** como framework HTTP
- **pg** (node-postgres) — driver PostgreSQL puro, sin ORM
- **zod** — validación de entrada
- **cors** + **dotenv**

Sin Supabase, sin Lovable Cloud, sin Firebase. Solo Node + Postgres en Docker.

## Estructura

```
backend/
├── src/
│   ├── server.ts          Entry point Express
│   ├── config.ts          Lectura de variables de entorno
│   ├── db.ts              Pool de conexión PostgreSQL
│   ├── middleware/
│   │   ├── logger.ts
│   │   └── error-handler.ts
│   ├── routes/
│   │   ├── index.ts       Agregador de rutas /api
│   │   └── health.ts      GET /api/health
│   └── types/
│       └── api.ts         ApiError, HttpStatus
├── migrations/
│   └── 001_initial_schema.sql   Esquema y datos iniciales
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Desarrollo local (sin Docker)

```bash
cp .env.example .env
# Edita .env con tu DATABASE_URL
npm install
npm run dev
```

El API queda en `http://localhost:3001/api`.

## Endpoints actuales (Fase 1)

| Método | Ruta              | Descripción                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/api`            | Información del API                  |
| GET    | `/api/health`     | Estado del servicio y conexión a BD  |

## Roadmap (próximas fases)

- **Fase 2**: Auth (`/api/auth/login`, `/api/auth/forgot-password`) y Users CRUD
  - JWT firmado con `JWT_SECRET` (sin Supabase Auth)
  - Hashing de password con `bcrypt`
- **Fase 3**: Agendas, agenda-views, agenda-comments, subjects, user-hierarchy
- **Fase 4**: Catálogos y actividades (8 tablas CRUD)
- **Fase 5**: Audit log (triggers SQL puros), recommendations, lineamientos
- **Fase 6**: Subida de archivos + interpretación de texto
  - **Upload**: `multer` en Express → volumen Docker (`/var/app/uploads`)
  - **Extracción**: `pdf-parse` para PDF, `mammoth` para DOCX
  - **Interpretación**: endpoint `POST /api/parse-document` que extrae el texto y lo
    envía a una API LLM externa (OpenAI o Anthropic Claude) configurada por
    `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` en `.env`
  - Reemplaza la edge function `parse-lineamientos` y el storage de Supabase
- **Fase 7**: Emails transaccionales con `nodemailer`
  - SMTP configurable por `.env` (Gmail, SendGrid, servidor SMTP de la UCP, Mailgun, etc.)
  - Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Endpoints:
    - `POST /api/auth/forgot-password` → genera token y envía correo de recuperación
    - `POST /api/auth/reset-password` → valida token y actualiza contraseña
  - Cola simple en Postgres (`email_queue` table) + worker en proceso (sin pgmq)
  - Reemplaza las edge functions `send-transactional-email`, `process-email-queue`,
    `request-password-reset` y `auth-email-hook`

## Migraciones

Por ahora, los archivos `migrations/*.sql` se ejecutan automáticamente por
PostgreSQL en el primer arranque del contenedor (vía `/docker-entrypoint-initdb.d/`).
Para reinicializar:

```bash
docker compose down -v   # destruye el volumen
docker compose up -d     # recrea todo
```
