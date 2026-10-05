import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("player"),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const permissionsMatrix = sqliteTable("permissions_matrix", {
  permissionKey: text("permission_key").primaryKey(),
  label: text("label").notNull(),
  suporte: integer("suporte", { mode: "boolean" }).notNull().default(false),
  moderador: integer("moderador", { mode: "boolean" }).notNull().default(false),
  administrador: integer("administrador", { mode: "boolean" }).notNull().default(false),
  gerente: integer("gerente", { mode: "boolean" }).notNull().default(false),
  diretor: integer("diretor", { mode: "boolean" }).notNull().default(false),
  ceo: integer("ceo", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

export const rules = sqliteTable("rules", {
  category: text("category").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  gameName: text("game_name").notNull(),
  discordTag: text("discord_tag").notNull(),
  age: integer("age").notNull(),
  desiredRole: text("desired_role").notNull(),
  availability: text("availability").notNull(),
  experience: text("experience").notNull(),
  scenario1: text("scenario1").notNull(),
  scenario2: text("scenario2").notNull(),
  motivation: text("motivation").notNull(),
  status: text("status").notNull().default("pending"),
  reviewerNotes: text("reviewer_notes"),
  reviewedAt: text("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  userId: text("user_id"),
  userName: text("user_name").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type PermissionMatrixRow = typeof permissionsMatrix.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
