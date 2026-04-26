import pg from "pg";
import { config } from "./config.js";

// Asegura que BIGINT (int8) se devuelva como number cuando sea seguro.
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  application_name: "agenda-ucp-api",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  // Errores en clientes inactivos del pool
  console.error("[db] Error inesperado en cliente del pool:", err);
});

export async function pingDb(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    return result.rows[0]?.ok === 1;
  } catch (err) {
    console.error("[db] ping falló:", err);
    return false;
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
