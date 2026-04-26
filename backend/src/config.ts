import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: required(
    "DATABASE_URL",
    "postgres://postgres:postgres@localhost:5432/agenda_ucp"
  ),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:8080")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export type AppConfig = typeof config;
