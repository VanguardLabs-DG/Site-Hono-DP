import { createMiddleware } from "hono/factory";
import { getDb } from "../db";
import { permissionsMatrix } from "../db/schema";
import { eq } from "drizzle-orm";
import type { AuthContext } from "./auth";
import type { StaffRole } from "../env";

const ROLE_HIERARCHY: Record<StaffRole, number> = {
  ceo: 100,
  diretor: 80,
  gerente: 60,
  administrador: 40,
  moderador: 20,
  suporte: 10,
  player: 0,
};

export function requireRole(allowedRoles: StaffRole[]) {
  return createMiddleware<AuthContext>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Acesso negado. Usuário não autenticado." }, 401);
    }

    if (user.role === "ceo" || allowedRoles.includes(user.role)) {
      return next();
    }

    return c.json(
      {
        error: `Acesso negado. Esta ação requer um dos seguintes cargos: ${allowedRoles.join(", ")}.`,
      },
      403
    );
  });
}

export function requireMinRole(minRole: StaffRole) {
  return createMiddleware<AuthContext>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Acesso negado. Usuário não autenticado." }, 401);
    }

    const userWeight = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[minRole] ?? 0;

    if (userWeight >= requiredWeight) {
      return next();
    }

    return c.json(
      {
        error: `Acesso negado. Cargo insuficiente (mínimo exigido: ${minRole}).`,
      },
      403
    );
  });
}

export function requirePermission(permissionKey: string) {
  return createMiddleware<AuthContext>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Acesso negado. Usuário não autenticado." }, 401);
    }

    // CEO possui acesso irrestrito a todas as funcionalidades do sistema
    if (user.role === "ceo") {
      return next();
    }

    // Tentar cache KV primeiro se disponível para velocidade instantânea
    let hasPerm: boolean | null = null;
    const kvCacheKey = `perm:${permissionKey}:${user.role}`;

    try {
      if (c.env.KV) {
        const cached = await c.env.KV.get(kvCacheKey);
        if (cached !== null) {
          hasPerm = cached === "1";
        }
      }
    } catch (e) {
      // Ignora erro de KV e cai no banco D1
    }

    if (hasPerm === null) {
      const db = getDb(c.env.DB);
      const [row] = await db
        .select()
        .from(permissionsMatrix)
        .where(eq(permissionsMatrix.permissionKey, permissionKey))
        .limit(1);

      if (row) {
        const roleKey = user.role as keyof typeof row;
        hasPerm = Boolean(row[roleKey]);
      } else {
        hasPerm = false;
      }

      // Salva no KV com expiração curta (60 segundos)
      try {
        if (c.env.KV) {
          await c.env.KV.put(kvCacheKey, hasPerm ? "1" : "0", { expirationTtl: 60 });
        }
      } catch (e) {}
    }

    if (hasPerm) {
      return next();
    }

    return c.json(
      {
        error: `Acesso negado. Seu cargo (${user.role}) não possui a permissão '${permissionKey}'.`,
      },
      403
    );
  });
}
