import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { closeDb, pingDb } from "./db.js";

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.corsOrigin.includes("*") || config.corsOrigin.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(
    `[server] API Agenda UCP escuchando en http://localhost:${config.port}/api (env=${config.nodeEnv})`
  );
  pingDb().then((ok) => {
    console.log(`[server] Conexión a Postgres: ${ok ? "OK" : "FALLÓ"}`);
  });
});

async function shutdown(signal: string) {
  console.log(`[server] Señal ${signal} recibida, cerrando…`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
