import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { rulesRoutes } from "./routes/rules";
import { applicationsRoutes } from "./routes/applications";
import { adminRoutes } from "./routes/admin";
import { fivemRoutes } from "./routes/fivem";
import { discordRoutes } from "./routes/discord";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

// CORS & Segurança
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Headers de Segurança Globais
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Health check & Info
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    system: "Distrito Paulista RP Edge API",
    platform: "Cloudflare Workers + Hono",
    environment: c.env.ENVIRONMENT,
    demoMode: c.env.DEMO_MODE === "true",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.route("/api/auth", authRoutes);
app.route("/api/rules", rulesRoutes);
app.route("/api/applications", applicationsRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/fivem-status", fivemRoutes);
app.route("/api/discord-status", discordRoutes);

// Fallback 404 para endpoints de API inexistentes
app.all("/api/*", (c) => {
  return c.json({ error: "Endpoint não encontrado." }, 404);
});

// Manipulador global de erros não tratados
app.onError((err, c) => {
  console.error("Erro interno não tratado:", err);
  return c.json(
    {
      error: "Ocorreu um erro interno no servidor edge.",
      details: c.env.ENVIRONMENT === "development" ? err.message : undefined,
    },
    500
  );
});

export default app;
