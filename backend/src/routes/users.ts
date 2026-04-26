import { Router, Response } from "express";
import { query, queryOne } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res: Response) => {
  try {
    const rows = await query(
      `SELECT id, cc, email, first_name, second_name, first_last_name,
              second_last_name, id_rol, id_state
         FROM public.users ORDER BY id`
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Error obteniendo usuarios" });
  }
});

router.get("/by-cc/:cc", async (req: AuthRequest, res: Response) => {
  try {
    const user = await queryOne(
      `SELECT id, cc, email, first_name, second_name, first_last_name,
              second_last_name, id_rol, id_state
         FROM public.users WHERE cc = $1`,
      [req.params.cc]
    );
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Error" });
  }
});

export default router;
