import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { getDb } from "../db";
import { profiles, permissionsMatrix } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/crypto";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { verifyTurnstileToken } from "../middleware/turnstile";
import { rateLimit } from "../middleware/rate-limit";
import type { Env, AuthUserPayload, StaffRole } from "../env";

export const authRoutes = new Hono<{ Bindings: Env; Variables: AuthContext["Variables"] }>();

// Rota de Login Regular (Email + Senha)
authRoutes.post("/login", rateLimit({ limit: 10, windowSecs: 60, prefix: "rl:login" }), async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.email || !body.password) {
    return c.json({ error: "E-mail e senha são obrigatórios." }, 400);
  }

  const { email, password, turnstileToken } = body;

  // Validação Anti-Bot Turnstile
  const ip = c.req.header("cf-connecting-ip") || undefined;
  const isHuman = await verifyTurnstileToken(turnstileToken, c.env, ip);
  if (!isHuman) {
    return c.json({ error: "Falha na verificação de segurança anti-bot. Tente novamente." }, 403);
  }

  const db = getDb(c.env.DB);
  const [userRecord] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email.toLowerCase().trim()))
    .limit(1);

  if (!userRecord) {
    return c.json({ error: "Credenciais inválidas. Verifique seu e-mail e senha." }, 401);
  }

  if (userRecord.status !== "active") {
    return c.json({ error: "Sua conta está suspensa ou inativa. Contate a Direção." }, 403);
  }

  const isPasswordValid = await verifyPassword(
    password,
    userRecord.passwordHash,
    userRecord.salt
  );

  if (!isPasswordValid) {
    return c.json({ error: "Credenciais inválidas. Verifique seu e-mail e senha." }, 401);
  }

  // Gera o token JWT (expiração em 7 dias)
  const payload = {
    userId: userRecord.id,
    displayName: userRecord.displayName,
    email: userRecord.email,
    role: userRecord.role as StaffRole,
    avatarUrl: userRecord.avatarUrl,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const token = await sign(payload as any, c.env.JWT_SECRET, "HS256");

  setCookie(c, "dp_auth_token", token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.json({
    success: true,
    user: {
      id: userRecord.id,
      displayName: userRecord.displayName,
      email: userRecord.email,
      role: userRecord.role,
      avatarUrl: userRecord.avatarUrl,
    },
  });
});

// Login Demo Rápido de 1-Clique (apenas quando DEMO_MODE = true)
authRoutes.post("/demo-login", async (c) => {
  if (c.env.DEMO_MODE !== "true") {
    return c.json(
      { error: "O modo de demonstração está desativado neste ambiente." },
      403
    );
  }

  const body = await c.req.json().catch(() => null);
  const targetRole = (body?.role as StaffRole) || "ceo";

  const db = getDb(c.env.DB);
  const [userRecord] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, targetRole))
    .limit(1);

  if (!userRecord) {
    return c.json(
      { error: `Nenhuma conta demo encontrada para o cargo '${targetRole}'.` },
      404
    );
  }

  const payload = {
    userId: userRecord.id,
    displayName: userRecord.displayName,
    email: userRecord.email,
    role: userRecord.role as StaffRole,
    avatarUrl: userRecord.avatarUrl,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const token = await sign(payload as any, c.env.JWT_SECRET, "HS256");

  setCookie(c, "dp_auth_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.json({
    success: true,
    user: {
      id: userRecord.id,
      displayName: userRecord.displayName,
      email: userRecord.email,
      role: userRecord.role,
      avatarUrl: userRecord.avatarUrl,
    },
  });
});

// Sessão Atual
authRoutes.get("/me", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  const db = getDb(c.env.DB);

  // Busca matriz de permissões para o cargo atual
  const allPermissions = await db.select().from(permissionsMatrix);
  const userPermissions: Record<string, boolean> = {};

  for (const row of allPermissions) {
    if (currentUser.role === "ceo") {
      userPermissions[row.permissionKey] = true;
    } else {
      const roleKey = currentUser.role as keyof typeof row;
      userPermissions[row.permissionKey] = Boolean(row[roleKey]);
    }
  }

  return c.json({
    user: currentUser,
    permissions: userPermissions,
  });
});

// Logout
authRoutes.post("/logout", async (c) => {
  deleteCookie(c, "dp_auth_token", { path: "/" });
  return c.json({ success: true, message: "Sessão encerrada com sucesso." });
});
