import { Hono } from "hono";
import { getDb } from "../db";
import { rules, auditLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import type { Env } from "../env";

export const rulesRoutes = new Hono<{ Bindings: Env; Variables: AuthContext["Variables"] }>();

// Listar todas as regras oficiais (Público com Cache KV)
rulesRoutes.get("/", async (c) => {
  const cacheKey = "cache:rules:all";

  try {
    if (c.env.KV) {
      const cached = await c.env.KV.get(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached));
      }
    }
  } catch (e) {
    console.warn("Erro ao ler cache de regras:", e);
  }

  const db = getDb(c.env.DB);
  const allRules = await db.select().from(rules);

  try {
    if (c.env.KV && allRules.length > 0) {
      await c.env.KV.put(cacheKey, JSON.stringify(allRules), {
        expirationTtl: 3600, // 1 hora de cache
      });
    }
  } catch (e) {}

  return c.json(allRules);
});

// Atualizar categoria de regras (Exclusivo Staff com permissão rules.edit)
rulesRoutes.put(
  "/:category",
  authMiddleware,
  requirePermission("can_edit_rules"),
  async (c) => {
    const category = c.req.param("category");
    const body = await c.req.json().catch(() => null);

    if (!body || !body.title || !body.content) {
      return c.json({ error: "Título e conteúdo são obrigatórios." }, 400);
    }

    const user = c.get("user");
    const db = getDb(c.env.DB);
    const now = new Date().toISOString();

    const [existing] = await db
      .select()
      .from(rules)
      .where(eq(rules.category, category))
      .limit(1);

    if (existing) {
      await db
        .update(rules)
        .set({
          title: body.title,
          content: body.content,
          updatedAt: now,
          updatedBy: user.userId,
        })
        .where(eq(rules.category, category));
    } else {
      await db.insert(rules).values({
        category,
        title: body.title,
        content: body.content,
        updatedAt: now,
        updatedBy: user.userId,
      });
    }

    // Grava log de auditoria
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      action: "RULE_UPDATE",
      userId: user.userId,
      userName: user.displayName,
      details: `Regra '${category}' atualizada por ${user.displayName} (${user.role}).`,
      createdAt: now,
    });

    // Invalida cache KV
    try {
      if (c.env.KV) {
        await c.env.KV.delete("cache:rules:all");
      }
    } catch (e) {}

    return c.json({ success: true, message: `Regra '${category}' salva com sucesso.` });
  }
);
