import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { getDb } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Env, AuthUserPayload } from "../env";

export type AuthContext = {
  Variables: {
    user: AuthUserPayload;
  };
  Bindings: Env;
};

export const authMiddleware = createMiddleware<AuthContext>(async (c, next) => {
  let token = getCookie(c, "dp_auth_token");

  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return c.json({ error: "Não autenticado. Faça login para continuar." }, 401);
  }

  try {
    const decoded = await verify(token, c.env.JWT_SECRET, "HS256");
    const payload = decoded as unknown as AuthUserPayload;

    if (!payload || !payload.userId) {
      return c.json({ error: "Sessão inválida ou expirada." }, 401);
    }

    // Validação de segurança no D1: confirma se a conta ainda está ativa
    const db = getDb(c.env.DB);
    const [userRecord] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, payload.userId))
      .limit(1);

    if (!userRecord || userRecord.status !== "active") {
      return c.json({ error: "Conta inativa ou suspensa pela administração." }, 403);
    }

    c.set("user", {
      userId: userRecord.id,
      displayName: userRecord.displayName,
      email: userRecord.email,
      role: userRecord.role as AuthUserPayload["role"],
      avatarUrl: userRecord.avatarUrl,
    });

    await next();
  } catch (err) {
    return c.json({ error: "Sessão inválida ou expirada." }, 401);
  }
});
