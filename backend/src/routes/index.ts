import { Router } from "express";
import { healthRouter } from "./health.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);

apiRouter.get("/", (_req, res) => {
  res.json({
    name: "Agenda UCP API",
    version: "0.1.0",
    status: "ok",
    docs: "Ver backend/README.md",
  });
});
