import { Hono } from "hono";
import { getDb } from "../db";
import { applications, auditLogs } from "../db/schema";
import { eq, desc, or, like } from "drizzle-orm";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { verifyTurnstileToken } from "../middleware/turnstile";
import { rateLimit } from "../middleware/rate-limit";
import type { Env } from "../env";

export const applicationsRoutes = new Hono<{ Bindings: Env; Variables: AuthContext["Variables"] }>();

// Envio de Candidatura (Público, com Turnstile e Rate Limiting)
applicationsRoutes.post(
  "/",
  rateLimit({ limit: 5, windowSecs: 60, prefix: "rl:app_submit" }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: "Dados inválidos." }, 400);
    }

    const {
      gameName,
      discordTag,
      age,
      desiredRole,
      availability,
      experience,
      scenario1,
      scenario2,
      motivation,
      turnstileToken,
    } = body;

    // Verificação de segurança Turnstile
    const ip = c.req.header("cf-connecting-ip") || undefined;
    const isHuman = await verifyTurnstileToken(turnstileToken, c.env, ip);
    if (!isHuman) {
      return c.json(
        { error: "Falha na verificação de segurança anti-bot. Atualize a página e tente novamente." },
        403
      );
    }

    // Validação de campos
    if (
      !gameName ||
      !discordTag ||
      !age ||
      !desiredRole ||
      !availability ||
      !experience ||
      !scenario1 ||
      !scenario2 ||
      !motivation
    ) {
      return c.json({ error: "Preencha todos os campos obrigatórios do formulário." }, 400);
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 99) {
      return c.json({ error: "Idade deve estar entre 13 e 99 anos." }, 400);
    }

    const allowedRoles = ["suporte", "moderador", "administrador"];
    if (!allowedRoles.includes(desiredRole)) {
      return c.json({ error: "Cargo desejado inválido." }, 400);
    }

    const db = getDb(c.env.DB);
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(applications).values({
      id: newId,
      gameName: gameName.trim(),
      discordTag: discordTag.trim(),
      age: parsedAge,
      desiredRole,
      availability: availability.trim(),
      experience: experience.trim(),
      scenario1: scenario1.trim(),
      scenario2: scenario2.trim(),
      motivation: motivation.trim(),
      status: "pending",
      createdAt: now,
    });

    return c.json({
      success: true,
      message: "Candidatura enviada com sucesso! Acompanhe o resultado pelo seu Discord.",
      applicationId: newId,
    });
  }
);

// Consulta de Status Pública por Jogador (busca por Discord ou Nome no Jogo)
applicationsRoutes.get("/status", async (c) => {
  const query = (c.req.query("q") || c.req.query("query"))?.trim();
  if (!query || query.length < 2) {
    return c.json({ error: "Informe pelo menos 2 caracteres para pesquisar." }, 400);
  }

  const db = getDb(c.env.DB);
  const results = await db
    .select({
      id: applications.id,
      gameName: applications.gameName,
      discordTag: applications.discordTag,
      desiredRole: applications.desiredRole,
      status: applications.status,
      reviewerNotes: applications.reviewerNotes,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .where(
      or(
        like(applications.discordTag, `%${query}%`),
        like(applications.gameName, `%${query}%`)
      )
    )
    .orderBy(desc(applications.createdAt))
    .limit(10);

  return c.json(results);
});

// Listar Candidaturas (Exclusivo Staff com permissão can_view_applications)
applicationsRoutes.get(
  "/",
  authMiddleware,
  requirePermission("can_view_applications"),
  async (c) => {
    const db = getDb(c.env.DB);
    const allApps = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return c.json(allApps);
  }
);

// Atualizar Status e Parecer da Candidatura (Exclusivo Staff com permissão can_review_applications)
applicationsRoutes.put(
  "/:id",
  authMiddleware,
  requirePermission("can_review_applications"),
  async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);

    if (!body || !body.status) {
      return c.json({ error: "Status é obrigatório." }, 400);
    }

    const validStatus = ["pending", "reviewing", "approved", "rejected"];
    if (!validStatus.includes(body.status)) {
      return c.json({ error: "Status inválido." }, 400);
    }

    const user = c.get("user");
    const db = getDb(c.env.DB);
    const now = new Date().toISOString();

    const [existing] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Candidatura não encontrada." }, 404);
    }

    await db
      .update(applications)
      .set({
        status: body.status,
        reviewerNotes: body.reviewerNotes ?? existing.reviewerNotes,
        reviewedAt: now,
        reviewedBy: user.userId,
      })
      .where(eq(applications.id, id));

    // Auditoria
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      action: "APPLICATION_EVALUATED",
      userId: user.userId,
      userName: user.displayName,
      details: `Candidatura de ${existing.gameName} alterada para '${body.status}' por ${user.displayName}.`,
      createdAt: now,
    });

    return c.json({ success: true, message: "Candidatura atualizada com sucesso." });
  }
);

// Excluir Candidatura (Exclusivo Staff com permissão can_delete_applications)
applicationsRoutes.delete(
  "/:id",
  authMiddleware,
  requirePermission("can_delete_applications"),
  async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const db = getDb(c.env.DB);

    const [existing] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Candidatura não encontrada." }, 404);
    }

    await db.delete(applications).where(eq(applications.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      action: "APPLICATION_DELETED",
      userId: user.userId,
      userName: user.displayName,
      details: `Candidatura de ${existing.gameName} excluída por ${user.displayName}.`,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: "Candidatura removida com sucesso." });
  }
);
