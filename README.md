# Sistema de Agenda Docente — UCP

Aplicación web para la gestión de agendas y distribución horaria de docentes de planta de la Universidad Católica de Pereira.

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase Self-Hosted (Docker)
- **Routing:** React Router v6
- **State:** React Context + TanStack Query

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Completa los valores con las claves generadas (ver sección Docker abajo).

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Despliegue con Docker (Self-Hosted)

Este proyecto está configurado para correr con una instancia propia de Supabase
en Docker, sin depender de Supabase Cloud.

### Requisitos
- Docker y Docker Compose instalados
- Puertos disponibles: `8000` (API), `5432` (PostgreSQL), `3000` (Supabase Studio)

### Pasos para levantar el backend

1. Copia las variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Genera un JWT secret seguro:
   ```bash
   openssl rand -base64 32
   ```

3. Genera las claves `ANON_KEY` y `SERVICE_ROLE_KEY` con Node.js:
   ```bash
   node -e "
   const jwt = require('jsonwebtoken');
   const secret = 'TU_JWT_SECRET_AQUI';
   const anon = jwt.sign({ role: 'anon', iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + (10*365*24*60*60) }, secret);
   const service = jwt.sign({ role: 'service_role', iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + (10*365*24*60*60) }, secret);
   console.log('ANON_KEY:', anon);
   console.log('SERVICE_ROLE_KEY:', service);
   "
   ```

4. Completa el archivo `.env` con los valores generados.

5. Levanta los contenedores:
   ```bash
   docker compose up -d
   ```

6. Inicia el frontend:
   ```bash
   npm run dev
   ```

### Accesos
| Servicio | URL |
|---|---|
| Aplicación React | http://localhost:5173 |
| Supabase Studio (panel admin) | http://localhost:3000 |
| API Supabase | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

### Base de datos
El archivo `init.sql` en la raíz del proyecto contiene el schema completo
y los datos iniciales. Docker lo ejecuta automáticamente la primera vez
que se levanta el contenedor de PostgreSQL.

Para reinicializar la base de datos desde cero:
```bash
docker compose down -v   # elimina volúmenes
docker compose up -d     # recrea todo
```

## Scripts Disponibles

| Script           | Descripción                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Servidor de desarrollo con hot-reload    |
| `npm run build`  | Build de producción                      |
| `npm run preview`| Vista previa del build de producción     |
| `npm run test`   | Ejecutar tests con Vitest                |
| `npm run lint`   | Linter con ESLint                        |

## Estructura del Proyecto

```
src/
├── components/    # Componentes reutilizables y UI (shadcn)
├── context/       # Contextos de React (Auth, Agenda)
├── data/          # Datos estáticos y constantes
├── hooks/         # Custom hooks
├── integrations/  # Cliente de Supabase (auto-generado)
├── pages/         # Páginas/rutas principales
├── types/         # Tipos TypeScript
└── assets/        # Imágenes y recursos estáticos
```

## Datos Iniciales (Seed)

El archivo `init.sql` contiene todos los registros iniciales del sistema (roles, estados, semestres, facultades, niveles de educación, carreras, asignaturas, actividades, y el usuario de prueba). Los datos se insertan con `ON CONFLICT DO NOTHING` para ser idempotentes.

## Variables de Entorno

Ver `.env.example` para referencia. Las variables requeridas son:

- `VITE_SUPABASE_URL` — URL de la instancia Supabase (ej: `http://localhost:8000`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Clave pública (anon key)
- `VITE_SUPABASE_PROJECT_ID` — ID del proyecto (`local` para self-hosted)
