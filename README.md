# Sistema de Agenda Docente — UCP

Aplicación web para la gestión de agendas y distribución horaria de docentes
de planta de la Universidad Católica de Pereira.

## Arquitectura

El repositorio está dividido en dos aplicaciones independientes, cada una
con su propio ciclo de vida y desplegable por separado:

```
/                       ← Frontend (React + Vite + TypeScript)
├── src/                  Código React (componentes, páginas, hooks)
├── public/
├── index.html
├── package.json          Dependencias del frontend
├── vite.config.ts
├── tailwind.config.ts
├── Dockerfile.frontend   Build estático servido por nginx
│
├── backend/            ← API REST (Node.js + Express + pg)
│   ├── src/              Código del servidor
│   ├── migrations/       Esquema SQL inicial
│   ├── package.json      Dependencias del backend
│   ├── Dockerfile
│   └── README.md
│
├── docker-compose.yml  ← Orquesta postgres + backend + frontend
├── .env.example
└── README.md (este archivo)
```

- **Frontend**: SPA en React 18 + Vite, servida por Nginx en producción.
- **Backend**: API REST en Node.js 20 + Express, conectado directamente a
  PostgreSQL mediante el driver `pg`. Sin Supabase, sin Firebase, sin
  servicios externos.
- **Base de datos**: PostgreSQL 16 dockerizado. El esquema y los datos
  iniciales se cargan automáticamente desde `backend/migrations/` en el
  primer arranque.

## Despliegue completo con Docker (recomendado para producción UCP)

```bash
# 1. Clona el repositorio
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_PROYECTO>

# 2. Configura variables de entorno
cp .env.example .env
# Edita .env: cambia POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN

# 3. Levanta los tres servicios
docker compose up -d

# 4. Verifica
curl http://localhost:3001/api/health
# Frontend: http://localhost:8080
```

Para reinicializar la base de datos desde cero (destruye datos):

```bash
docker compose down -v
docker compose up -d
```

## Desarrollo local (sin Docker)

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd backend
cp .env.example .env
# Asegúrate de tener PostgreSQL accesible en la URL de .env
npm install
npm run dev          # http://localhost:3001/api
```

Puedes correr solo PostgreSQL con Docker mientras desarrollas el resto local:

```bash
docker compose up -d postgres
```

## Stack técnico

| Capa          | Tecnologías                                              |
| ------------- | -------------------------------------------------------- |
| Frontend      | React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui    |
| Backend       | Node.js 20, Express 4, TypeScript, pg, zod               |
| Base de datos | PostgreSQL 16                                            |
| Contenedores  | Docker + Docker Compose                                  |

## Estado actual y roadmap

Este proyecto está en proceso de migración progresiva desde una arquitectura
basada en Supabase hacia una arquitectura 100% autónoma con Docker.

**Fase 1 — completada:**
- Reorganización del repositorio (frontend en raíz, backend en `backend/`)
- Backend Express + pg con endpoint `/api/health`
- Dockerización completa (postgres + backend + frontend)
- Esquema de BD migrado a `backend/migrations/`

**Fases siguientes** (ver `backend/README.md`):
- **Fase 2**: Auth + Users
- **Fase 3**: Agendas, agenda-views, comentarios, asignaturas, jerarquía
- **Fase 4**: Catálogos y actividades
- **Fase 5**: Audit log + recommendations + lineamientos
- **Fase 6**: Storage de archivos (volumen Docker)
- **Fase 7**: Emails transaccionales (nodemailer + cola Postgres)
- **Fase 8**: Limpieza final — eliminar `@supabase/supabase-js` del frontend

Mientras se completan las fases, **el frontend sigue funcionando con su
integración actual**. Cada fase migra un dominio del frontend al backend
nuevo de forma incremental, sin romper la aplicación.

## Variables de entorno

Ver `.env.example` (raíz, para Docker Compose) y `backend/.env.example`
(para desarrollo local del backend).
