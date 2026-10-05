import { createMiddleware } from "hono/factory";
import type { Env } from "../env";

interface RateLimitOptions {
  limit: number;
  windowSecs: number;
  prefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { limit, windowSecs, prefix = "rl" } = options;

  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    // Se estiver em modo de teste ou sem KV, permite passar
    if (!c.env.KV || c.env.DEMO_MODE === "true") {
      return next();
    }

    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for") ||
      "127.0.0.1";

    const key = `${prefix}:${ip}`;

    try {
      const current = await c.env.KV.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= limit) {
        return c.json(
          {
            error: "Muitas requisições enviadas em curto intervalo. Aguarde alguns instantes.",
          },
          429
        );
      }

      await c.env.KV.put(key, (count + 1).toString(), {
        expirationTtl: windowSecs,
      });
    } catch (e) {
      console.warn("Erro ao processar rate-limit no KV:", e);
    }

    await next();
  });
}
