# Sistema de Agenda Docente — UCP

Aplicación web para la gestión de agendas y distribución horaria de docentes
de planta de la Universidad Católica de Pereira.

## Arquitectura

Monorepo dividido en dos aplicaciones independientes y desplegables por separado:

```
/
├── frontend/       React + Vite + TypeScript (UI)
├── backend/        Node.js + Express + pg (API REST)
├── docker-compose.yml
└── .env.example
```

- **Frontend**: aplicación SPA construida con React, servida por Nginx en producción.
- **Backend**: API REST en Node.js que se conecta directamente a PostgreSQL
  mediante el driver `pg`, sin Supabase, sin Firebase y sin servicios externos.
- **Base de datos**: PostgreSQL 16 dockerizado, con esquema y datos iniciales
  cargados automáticamente desde `backend/migrations/` en el primer arranque.

## Despliegue rápido (todo con Docker)

Es la forma recomendada para producción institucional UCP.

```bash
# 1. Clona el repositorio
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_PROYECTO>

# 2. Configura variables de entorno
cp .env.example .env
# Edita .env y cambia POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN, etc.

# 3. Levanta todo (postgres + backend + frontend)
docker compose up -d

# 4. Verifica
curl http://localhost:3001/api/health
# El frontend queda en http://localhost:8080
```

Para reinicializar la base de datos desde cero:

```bash
docker compose down -v   # destruye el volumen
docker compose up -d     # recrea todo
```

## Desarrollo local (sin Docker)

Backend y frontend pueden desarrollarse de forma independiente.

### Backend

```bash
cd backend
cp .env.example .env
# Asegúrate de tener un PostgreSQL corriendo (puede ser el contenedor docker)
npm install
npm run dev    # http://localhost:3001/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## Stack técnico

| Capa       | Tecnologías                                              |
| ---------- | -------------------------------------------------------- |
| Frontend   | React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui    |
| Backend    | Node.js 20, Express 4, TypeScript, pg, zod               |
| Base de datos | PostgreSQL 16                                         |
| Contenedores | Docker + Docker Compose                                |

## Estado actual y roadmap

Este proyecto está en proceso de migración progresiva desde una arquitectura
basada en Supabase hacia una arquitectura 100% autónoma con Docker.

**Fase 1 (actual — completada)**:
- ✅ Reorganización del repositorio en `frontend/` + `backend/`
- ✅ Backend Express + pg con endpoint `/api/health`
- ✅ Dockerización completa (postgres + backend + frontend)
- ✅ Esquema de BD migrado a `backend/migrations/`

**Fases siguientes** (ver `backend/README.md` para detalle):
- Fase 2: Auth + Users
- Fase 3: Agendas y dominios principales
- Fase 4: Catálogos y actividades
- Fase 5: Audit log + recommendations + lineamientos
- Fase 6: Storage de archivos
- Fase 7: Emails transaccionales
- Fase 8: Limpieza final (eliminar dependencia de Supabase del frontend)

Mientras se completan las fases, el frontend sigue funcionando con su
integración actual a Supabase. Cada fase migra un dominio del frontend al
nuevo backend de forma incremental.

## Documentación adicional

- `backend/README.md` — detalles de la API, estructura y endpoints
- `frontend/` — código fuente del cliente React
- `.env.example` — variables de entorno requeridas
