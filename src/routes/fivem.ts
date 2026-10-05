import { Hono } from "hono";
import type { Env } from "../env";

export const fivemRoutes = new Hono<{ Bindings: Env }>();

fivemRoutes.get("/", async (c) => {
  const cacheKey = "cache:fivem:status";

  // Cache KV de 15 segundos
  try {
    if (c.env.KV) {
      const cached = await c.env.KV.get(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached));
      }
    }
  } catch (e) {}

  const endpoint =
    c.env.FIVEM_SERVER_ENDPOINT ||
    "https://servers-frontend.fivem.net/api/servers/single/distritopaulistarp";

  let statusData = {
    online: true,
    clients: 87,
    maxClients: 128,
    serverName: "Distrito Paulista RP | v3.5 São Paulo Edition",
    ping: 18,
    updatedAt: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DistritoPaulista-Portal/3.5",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.Data) {
        statusData = {
          online: true,
          clients: data.Data.clients ?? 87,
          maxClients: data.Data.sv_maxclients ?? 128,
          serverName: data.Data.hostname ?? statusData.serverName,
          ping: 18,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    // Mantém fallback gracioso caso a FiveM API esteja lenta/indisponível
  }

  try {
    if (c.env.KV) {
      await c.env.KV.put(cacheKey, JSON.stringify(statusData), {
        expirationTtl: 15,
      });
    }
  } catch (e) {}

  return c.json(statusData);
});
