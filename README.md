# Sistema de Agenda Docente — UCP (Frontend)

Aplicación web React + Vite + TypeScript para la gestión de agendas y
distribución horaria de docentes de planta de la Universidad Católica de
Pereira.

> ⚠️ Este repositorio contiene **únicamente el frontend**.
> El backend Express + PostgreSQL vive en un repositorio independiente:
> **`agenda-ucp-backend`**.

## Stack

- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS v3 + shadcn/ui
- React Router + React Query
- Cliente HTTP propio (`src/lib/api.ts`) que apunta a `VITE_API_URL`

## Requisitos

- Node.js 20+
- npm 10+
- Backend `agenda-ucp-backend` corriendo (por defecto en `http://localhost:4000`)

## Puesta en marcha (desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Edita .env y ajusta VITE_API_URL si tu backend no está en localhost:4000

# 3. Levantar Vite
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente para probar
```

El bundle resultante (`dist/`) se sirve con cualquier servidor estático
(Nginx, Caddy, S3, etc.). Si usas Nginx, recuerda:

1. Habilitar SPA fallback (`try_files $uri /index.html;`).
2. Configurar proxy de `/api/` hacia el backend Express.

Ver `frontend/Dockerfile` y `frontend/nginx.conf` como referencia.

## Despliegue con Docker

```bash
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL=http://<IP-BACKEND>:4000/api \
  -t agenda-ucp-frontend .

docker run -d -p 80:80 --name agenda-frontend agenda-ucp-frontend
```

## Pruebas

```bash
npm run test       # vitest
```

## Estructura

```
src/
├── components/      Componentes UI (incluye shadcn en components/ui)
├── context/         AuthContext, AgendaContext
├── hooks/           Hooks de dominio (agenda, recomendaciones, etc.)
├── i18n/            Sistema ES/EN
├── lib/api.ts       Cliente HTTP central → VITE_API_URL
├── pages/           Rutas
└── types/           Tipados de dominio
```

## Backend asociado

Repositorio: `agenda-ucp-backend`
Endpoints expuestos bajo `/api`: `auth`, `catalogs`, `subjects`, `users`,
`agendas`, `agendaViews`, `agendaComments`, `userHierarchy`, `auditLog`,
`docenteConfig`, `recommendationRules`, `systemSettings`, `upload`, `health`.
