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
- **Fase 3**: Agendas, agenda-views, agenda-comments, subjects, user-hierarchy
- **Fase 4**: Catálogos y actividades (8 tablas CRUD)
- **Fase 5**: Audit log (triggers SQL puros), recommendations, lineamientos
- **Fase 6**: Storage de archivos (volumen Docker para reemplazar Supabase Storage)
- **Fase 7**: Emails transaccionales (nodemailer + cola en Postgres)

## Migraciones

Por ahora, los archivos `migrations/*.sql` se ejecutan automáticamente por
PostgreSQL en el primer arranque del contenedor (vía `/docker-entrypoint-initdb.d/`).
Para reinicializar:

```bash
docker compose down -v   # destruye el volumen
docker compose up -d     # recrea todo
```
