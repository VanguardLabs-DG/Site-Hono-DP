import { Hono } from "hono";
import { getDb } from "../db";
import { profiles, permissionsMatrix, auditLogs } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { requirePermission, requireRole } from "../middleware/rbac";
import { hashPassword } from "../utils/crypto";
import type { Env, StaffRole } from "../env";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: AuthContext["Variables"] }>();

// Todos os endpoints deste router exigem autenticação
adminRoutes.use("*", authMiddleware);

// ==========================================
// 1. Gestão de Equipe & Usuários (profiles)
// ==========================================

// Listar membros da staff
adminRoutes.get("/users", requirePermission("can_manage_staff"), async (c) => {
  const db = getDb(c.env.DB);
  const users = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      role: profiles.role,
      status: profiles.status,
      avatarUrl: profiles.avatarUrl,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  return c.json(users);
});

// Cadastrar novo membro da staff
adminRoutes.post("/users", requirePermission("can_create_accounts"), async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.email || !body.password || !body.displayName || !body.role) {
    return c.json({ error: "E-mail, senha, nome e cargo são obrigatórios." }, 400);
  }

  const currentUser = c.get("user");
  const targetRole = body.role as StaffRole;

  // Apenas CEO pode criar outros CEOs ou Diretores
  if ((targetRole === "ceo" || targetRole === "diretor") && currentUser.role !== "ceo") {
    return c.json({ error: "Apenas o CEO pode criar contas de Diretor ou CEO." }, 403);
  }

  const db = getDb(c.env.DB);
  const cleanEmail = body.email.toLowerCase().trim();

  // Verifica duplicação
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, cleanEmail))
    .limit(1);

  if (existing) {
    return c.json({ error: "Este e-mail já está cadastrado no sistema." }, 409);
  }

  const { hash, salt } = await hashPassword(body.password);
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(profiles).values({
    id: newId,
    email: cleanEmail,
    passwordHash: hash,
    salt,
    displayName: body.displayName.trim(),
    role: targetRole,
    avatarUrl: body.avatarUrl || null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "USER_CREATED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Novo membro ${body.displayName} (${targetRole}) criado por ${currentUser.displayName}.`,
    createdAt: now,
  });

  return c.json({
    success: true,
    message: `Membro ${body.displayName} criado com sucesso.`,
    userId: newId,
  });
});

// Alterar cargo de membro
adminRoutes.put("/users/:id/role", requirePermission("can_manage_staff"), async (c) => {
  const targetId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || !body.role) {
    return c.json({ error: "Novo cargo é obrigatório." }, 400);
  }

  const currentUser = c.get("user");
  const db = getDb(c.env.DB);

  const [targetUser] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetId))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "Usuário não encontrado." }, 404);
  }

  if (targetUser.role === "ceo" && currentUser.role !== "ceo") {
    return c.json({ error: "Não é permitido alterar o cargo do CEO." }, 403);
  }

  const now = new Date().toISOString();
  await db
    .update(profiles)
    .set({
      role: body.role,
      updatedAt: now,
    })
    .where(eq(profiles.id, targetId));

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "ROLE_CHANGED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Cargo de ${targetUser.displayName} alterado de ${targetUser.role} para ${body.role} por ${currentUser.displayName}.`,
    createdAt: now,
  });

  return c.json({ success: true, message: "Cargo atualizado com sucesso." });
});

// Alterar status de membro (ativar / suspender)
adminRoutes.put("/users/:id/status", requirePermission("can_manage_staff"), async (c) => {
  const targetId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || !body.status) {
    return c.json({ error: "Status é obrigatório." }, 400);
  }

  const currentUser = c.get("user");
  const db = getDb(c.env.DB);

  const [targetUser] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetId))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "Usuário não encontrado." }, 404);
  }

  if (targetUser.id === currentUser.userId) {
    return c.json({ error: "Você não pode alterar o status da sua própria conta." }, 400);
  }

  const now = new Date().toISOString();
  await db
    .update(profiles)
    .set({
      status: body.status,
      updatedAt: now,
    })
    .where(eq(profiles.id, targetId));

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "STATUS_CHANGED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Status de ${targetUser.displayName} alterado para ${body.status} por ${currentUser.displayName}.`,
    createdAt: now,
  });

  return c.json({ success: true, message: `Status alterado para ${body.status}.` });
});

// Excluir membro da staff (Exclusivo CEO)
adminRoutes.delete("/users/:id", requireRole(["ceo"]), async (c) => {
  const targetId = c.req.param("id");
  const currentUser = c.get("user");
  const db = getDb(c.env.DB);

  if (targetId === currentUser.userId) {
    return c.json({ error: "Você não pode excluir sua própria conta de CEO." }, 400);
  }

  const [targetUser] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetId))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "Usuário não encontrado." }, 404);
  }

  await db.delete(profiles).where(eq(profiles.id, targetId));

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "USER_DELETED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Usuário ${targetUser.displayName} (${targetUser.email}) excluído por ${currentUser.displayName}.`,
    createdAt: new Date().toISOString(),
  });

  return c.json({ success: true, message: "Membro excluído com sucesso." });
});

// ==========================================
// 2. Matriz de Permissões RBAC
// ==========================================

// Obter matriz de permissões
adminRoutes.get("/permissions", async (c) => {
  const db = getDb(c.env.DB);
  const matrix = await db.select().from(permissionsMatrix);
  return c.json(matrix);
});

// Atualizar permissão na matriz (Exclusivo CEO)
adminRoutes.put("/permissions", requireRole(["ceo"]), async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.permissionKey || !body.role || typeof body.allowed !== "boolean") {
    return c.json({ error: "permissionKey, role e allowed são obrigatórios." }, 400);
  }

  const { permissionKey, role, allowed } = body;
  const validRoles = ["suporte", "moderador", "administrador", "gerente", "diretor"];

  if (!validRoles.includes(role)) {
    return c.json({ error: "Cargo inválido para modificação na matriz." }, 400);
  }

  const currentUser = c.get("user");
  const db = getDb(c.env.DB);
  const now = new Date().toISOString();

  await db
    .update(permissionsMatrix)
    .set({
      [role]: allowed,
      updatedAt: now,
      updatedBy: currentUser.userId,
    })
    .where(eq(permissionsMatrix.permissionKey, permissionKey));

  // Limpa o cache KV correspondente
  try {
    if (c.env.KV) {
      await c.env.KV.delete(`perm:${permissionKey}:${role}`);
    }
  } catch (e) {}

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "PERMISSION_MATRIX_UPDATED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Permissão '${permissionKey}' para o cargo '${role}' alterada para ${allowed} pelo CEO.`,
    createdAt: now,
  });

  return c.json({ success: true, message: "Matriz de permissões atualizada com sucesso." });
});

// ==========================================
// 3. Trilha de Auditoria (audit_logs)
// ==========================================

// Listar logs de auditoria
adminRoutes.get("/audit", requirePermission("can_view_audit_logs"), async (c) => {
  const db = getDb(c.env.DB);
  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return c.json(logs);
});

// Limpar trilha de auditoria (Exclusivo CEO)
adminRoutes.delete("/audit", requireRole(["ceo"]), async (c) => {
  const currentUser = c.get("user");
  const db = getDb(c.env.DB);

  await db.delete(auditLogs);

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "AUDIT_PURGED",
    userId: currentUser.userId,
    userName: currentUser.displayName,
    details: `Trilha de auditoria reiniciada pelo CEO ${currentUser.displayName}.`,
    createdAt: new Date().toISOString(),
  });

  return c.json({ success: true, message: "Trilha de auditoria limpa com sucesso." });
});
