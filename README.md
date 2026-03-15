# Sistema de Agenda Docente — UCP

Aplicación web para la gestión de agendas y distribución horaria de docentes de planta de la Universidad Católica de Pereira.

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Lovable Cloud (Supabase)
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
# El archivo .env ya está incluido con las claves públicas.
# Si no existe, copia el ejemplo:
cp .env.example .env
# y completa los valores con las claves del proyecto.

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

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

## Variables de Entorno

Ver `.env.example` para referencia. Las variables requeridas son:

- `VITE_SUPABASE_URL` — URL del proyecto backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Clave pública (anon key)
- `VITE_SUPABASE_PROJECT_ID` — ID del proyecto
