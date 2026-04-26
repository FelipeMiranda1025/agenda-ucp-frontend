import { Router, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { sendPasswordResetEmail } from "../services/email";

const router = Router();

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña requeridos" });
  }
  try {
    const hashed = sha256(password);
    const user = await queryOne<any>(
      `SELECT id, cc, email, first_name, second_name, first_last_name, second_last_name,
              id_rol, id_state
         FROM public.users
        WHERE (cc = $1 OR email = $1)
          AND password = $2
          AND id_state = 1`,
      [username, hashed]
    );
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET no configurado" });
    }
    const token = jwt.sign(
      { id: user.id, cc: user.cc, rolId: user.id_rol },
      secret,
      { expiresIn: "8h" }
    );
    return res.json({
      token,
      user: {
        id: user.id,
        cc: user.cc,
        email: user.email,
        firstName: user.first_name,
        secondName: user.second_name,
        firstLastName: user.first_last_name,
        secondLastName: user.second_last_name,
        rolId: user.id_rol,
        statusId: user.id_state,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await queryOne<any>(
      `SELECT id, cc, email, first_name, second_name, first_last_name, second_last_name,
              id_rol, id_state
         FROM public.users WHERE id = $1`,
      [req.user!.id]
    );
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json({
      id: user.id,
      cc: user.cc,
      email: user.email,
      firstName: user.first_name,
      secondName: user.second_name,
      firstLastName: user.first_last_name,
      secondLastName: user.second_last_name,
      rolId: user.id_rol,
      statusId: user.id_state,
    });
  } catch {
    return res.status(500).json({ message: "Error interno" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ message: "Email requerido" });

  try {
    const user = await queryOne<any>(
      `SELECT id, email, first_name FROM public.users WHERE email = $1 AND id_state = 1`,
      [email]
    );

    // Siempre responder 200 (no revelar si el email existe)
    if (!user) {
      return res.json({
        message: "Si el correo existe, recibirás las instrucciones",
      });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await query(
      `INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expires]
    );

    const resetUrl = `${
      process.env.FRONTEND_URL ?? "http://localhost:5173"
    }/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, user.first_name, resetUrl);
    } catch (mailErr) {
      console.error("Error enviando correo de recuperación:", mailErr);
      // No exponer el detalle al cliente
    }

    return res.json({
      message: "Si el correo existe, recibirás las instrucciones",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Error procesando la solicitud" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token y nueva contraseña requeridos" });
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }
  try {
    const record = await queryOne<any>(
      `SELECT id, user_id, expires_at, used_at
         FROM public.password_reset_tokens
        WHERE token = $1`,
      [token]
    );
    if (!record) return res.status(400).json({ message: "Token inválido" });
    if (record.used_at)
      return res.status(400).json({ message: "Token ya utilizado" });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "Token expirado" });
    }

    const hashed = sha256(newPassword);
    await query(`UPDATE public.users SET password = $1 WHERE id = $2`, [
      hashed,
      record.user_id,
    ]);
    await query(
      `UPDATE public.password_reset_tokens SET used_at = now() WHERE id = $1`,
      [record.id]
    );

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Error actualizando la contraseña" });
  }
});

export default router;
